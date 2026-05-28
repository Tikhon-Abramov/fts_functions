# Frontend Auth — Design Plan

Подробный дизайн-документ для следующего агента, который будет делать UI для
auth-flow. AUTH-BACKEND даёт REST endpoints; этот документ описывает что
именно строить на фронте.

Last updated: 2026-04-25

---

## Routes

```
/login                    Public
/register                 Public
/verify-email?token=...   Public  (deep link from verification email)
/forgot-password          Public
/reset-password?token=... Public  (deep link from reset email)
/profile                  Protected
```

Защита routes: компонент `<RequireAuth>` оборачивает protected routes. Если
нет токена → redirect на `/login?redirect=<original-path>`.

## Redux slice

`apps/web/src/shared/store/authSlice.ts`:

```ts
type AuthState = {
  status: "idle" | "authenticated" | "anonymous";
  user: ProfileDto | null;
  accessToken: string | null;
  refreshToken: string | null;  // localStorage-persisted
};

selectors:
  selectAuthStatus
  selectCurrentUser
  selectAccessToken
  selectIsAuthenticated

actions:
  loginSuccess(payload: { user, accessToken, refreshToken })
  logout()
  refreshTokens(payload: { accessToken, refreshToken })
  updateProfile(payload: ProfileDto)
```

`refreshToken` сохраняется в `localStorage`. `accessToken` живёт только в
памяти (in Redux state) — после reload получаем новый через refresh-flow.

## RTK Query baseQuery с retry-on-401

В `apps/web/src/shared/api/baseQuery.ts`:

```ts
const rawBaseQuery = fetchBaseQuery({
  baseUrl: "/v1",
  prepareHeaders: (headers, { getState }) => {
    const token = selectAccessToken(getState() as RootState);
    if (token) headers.set("Authorization", `Bearer ${token}`);
    return headers;
  },
});

// Wrap with retry-on-401:
const baseQueryWithReauth: BaseQueryFn = async (args, api, extraOptions) => {
  let result = await rawBaseQuery(args, api, extraOptions);
  if (result.error?.status === 401) {
    const refreshToken = selectRefreshToken(api.getState() as RootState);
    if (refreshToken) {
      // Try refresh:
      const refreshResult = await rawBaseQuery(
        { url: "/auth/refresh", method: "POST", body: { refreshToken } },
        api,
        extraOptions,
      );
      if (refreshResult.data) {
        api.dispatch(refreshTokens(refreshResult.data));
        result = await rawBaseQuery(args, api, extraOptions);
      } else {
        api.dispatch(logout());
      }
    }
  }
  return result;
};
```

Update `ftsFunctionsApi.ts` и любые RTK Query API definitions to use
`baseQueryWithReauth`.

## Pages

### `/login`

Поля: `identifier` (email или login), `password`.

Layout: центрированная карточка ~400px ширина, с логотипом сверху, формой
посередине, ссылкой "Забыли пароль?" + "Регистрация" внизу.

RHF + Zod validation:

- identifier: required, не должно быть пустым
- password: required, минимум 6 символов

On submit:

- `POST /v1/auth/login` с `{ identifier, password }`
- 200 → `dispatch(loginSuccess(...))` → navigate(redirectTo || "/")
- 403 EMAIL_NOT_VERIFIED → redirect на `/verify-email?email=<их email>` с
  кнопкой "Отправить заново"
- 401 INVALID_CREDENTIALS → snackbar "Неверный email или пароль"
- остальное → rtkErrorMiddleware покажет

Файл: `apps/web/src/pages/login.tsx`

### `/register`

Поля: `email`, `password`, `confirmPassword`, `fullName`.

Validation:

- email: Zod `.email()`
- password: min 8, требует букву + цифру
- confirmPassword: must equal password (Zod `.refine()`)
- fullName: min 2

On submit:

- `POST /v1/auth/register`
- 201 → snackbar "Письмо с подтверждением отправлено на your@email" →
  redirect на `/login?registered=1`
- 409 EMAIL_ALREADY_REGISTERED → field error на email "Этот email уже
  зарегистрирован"

Файл: `apps/web/src/pages/register.tsx`

### `/verify-email`

Variants:

- `?token=...` — deep link from email. Auto-submit `POST /v1/auth/verify-email`
  on mount. Show "Подтверждение..." spinner. On 200 → snackbar success →
  redirect to `/`. On 410 INVALID_TOKEN или TOKEN_EXPIRED → "Ссылка
  устарела" + кнопка "Отправить заново".
- `?email=...` (без token) — показать "Мы отправили ссылку на your@email.
  Проверьте почту." + кнопка "Отправить заново" (rate-limited backend
  endpoint).

Файл: `apps/web/src/pages/verify-email.tsx`

### `/forgot-password`

Поле: `email`.

On submit:

- `POST /v1/auth/forgot-password`
- 200 → "Если email зарегистрирован, мы отправим инструкции на $email" (сообщение нейтральное чтобы не утекала информация о существовании пользователя).

Файл: `apps/web/src/pages/forgot-password.tsx`

### `/reset-password?token=...`

Поля: `password`, `confirmPassword`.

Validation = такая же как на регистрации.

On submit:

- `POST /v1/auth/reset-password` с `{ token, newPassword }`
- 200 → snackbar "Пароль обновлён" → redirect `/login`
- 410 → "Ссылка устарела, запросите новую" + кнопка → `/forgot-password`

Файл: `apps/web/src/pages/reset-password.tsx`

### `/profile`

Layout: две колонки на десктопе.

- Левая колонка: аватар + кнопка "Загрузить фото" (presigned URL flow)
- Правая колонка: form для изменения fullName, login, role-related fields

Для смены email — отдельная секция "Изменить email" с пометкой
"Потребуется повторное подтверждение".

Для смены пароля — отдельная секция с тремя полями
(current/new/confirm).

Avatar upload flow:

1. Select file → `POST /v1/profile/avatar/presigned-url` → получить
   `{ uploadUrl, key }`
2. `PUT uploadUrl` (direct to MinIO) с file body
3. `POST /v1/profile/avatar/confirm` с `{ key }` → обновлённый профиль с
   новым `getUrl`

Все три запроса в одной submit функции; loading state на
аватарной превью.

Файл: `apps/web/src/pages/profile/Profile.tsx` (component-as-folder
паттерн, см. patterns.md Class 31)

## Common UI components

`apps/web/src/components/auth/ui/`:

- `AuthCard.tsx` — карточка-обёртка с центром, лого, тенью. Используется
  всеми auth pages.
- `AuthFormError.tsx` — алерт для server-side ошибок
- `AuthSubmitButton.tsx` — кнопка с loading state, blocked when invalid

## Полный список API hooks

Из RTK Query codegen после регенерации (`pnpm web:codegen`):

- `useAuthControllerRegisterV1Mutation`
- `useAuthControllerVerifyEmailV1Mutation`
- `useAuthControllerResendVerificationV1Mutation`
- `useAuthControllerLoginV1Mutation`
- `useAuthControllerRefreshV1Mutation`
- `useAuthControllerLogoutV1Mutation`
- `useAuthControllerForgotPasswordV1Mutation`
- `useAuthControllerResetPasswordV1Mutation`
- `useAuthControllerMeV1Query`
- `useProfileControllerGetV1Query`
- `useProfileControllerUpdateV1Mutation`
- `useProfileControllerGetAvatarPresignedUrlV1Mutation`
- `useProfileControllerConfirmAvatarV1Mutation`

## Router updates

`apps/web/src/app/App.tsx`:

- Добавить `<Route path="/login" component={Login} />` etc.
- Обернуть protected routes в `<RequireAuth>`.
- `<RequireAuth>` смотрит на `selectAuthStatus`. Если `idle` → проверяет
  refreshToken в localStorage, делает refresh-call, переходит в
  `authenticated` или `anonymous`. Если `anonymous` → redirect.
- Show `<CircularProgress>` в `<RequireAuth>` пока статус `idle`.

## i18n keys to add

`apps/web/src/shared/i18n/keys.ts`:

```ts
auth: {
  login: { title, identifier, password, submit, forgotPassword, register, errors: { invalidCredentials, emailNotVerified } },
  register: { title, email, password, confirmPassword, fullName, submit, errors: { emailAlreadyRegistered, passwordTooShort, passwordsDoNotMatch } },
  verifyEmail: { verifying, success, expired, resendButton, checkInbox },
  forgotPassword: { title, email, submit, sent },
  resetPassword: { title, password, confirmPassword, submit, success, expired },
  profile: { title, fullName, email, login, save, changePassword, currentPassword, newPassword, avatarUpload },
}
```

И в `ru.ts` соответствующие переводы.

## Tests

Vitest + RTL:

- `pages/login.test.tsx` — submit happy path, invalid creds, email-not-verified
- `pages/register.test.tsx` — submit happy path, email-already-registered
- `pages/verify-email.test.tsx` — auto-verify on mount, expired token
- `pages/profile/Profile.test.tsx` — view, edit, avatar upload mock
- `shared/store/authSlice.test.ts` — actions + selectors
- `shared/api/baseQuery.test.ts` — retry-on-401 logic with mock fetch

Playwright e2e:

- `e2e/auth-flow.spec.ts` — register → verify (mock email link visit) →
  login → see profile → logout

## Dependencies

Уже установлены: `@reduxjs/toolkit`, `react-redux`, `react-hook-form`,
`@hookform/resolvers`, `zod`, MUI.

Нужно установить: НИЧЕГО — все компоненты собираем из имеющегося.

## Последовательность реализации

Агенту делать в этом порядке (каждый этап коммит):

1. **Schema + types** — RTK Query codegen rebuild (`pnpm web:codegen`)
   когда AUTH-BACKEND landed; типы для всех auth endpoints появятся
   автоматически.
2. **authSlice** + persistence (refreshToken to localStorage)
3. **baseQueryWithReauth** + connect to ftsFunctionsApi
4. **AuthCard / common components**
5. **Login page** + tests
6. **Register page** + tests
7. **Verify email page** + tests
8. **Forgot/Reset password pages** + tests
9. **Profile page** + avatar upload + tests
10. **Router updates + RequireAuth wrapper**
11. **i18n keys + Russian translations**
12. **Playwright e2e**
13. **Verify**: tsc clean, lint clean, all unit + e2e tests green

Estimated: 6-8 часов агентского времени.
