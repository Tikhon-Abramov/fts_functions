/**
 * Auth + Profile API endpoint typings + RTK Query injectEndpoints for
 * `/v1/auth/*` and `/v1/profile/*`.
 *
 * Why this file exists (vs. RTK Query OpenAPI codegen):
 *   `pnpm web:codegen` was attempted as part of the auth-frontend rollout but
 *   the backend (port 3000) was not reachable from the agent's environment.
 *   The codegen tool requires a live `/api/json` endpoint, so the auth
 *   typings could not be regenerated automatically. This file is a hand-
 *   written stand-in that mirrors the shape `@rtk-query/codegen-openapi`
 *   would produce: an `injectEndpoints` block on the same `baseApi`, with
 *   `useXxxMutation` / `useXxxQuery` hook names matching the codegen template.
 *
 * Profile endpoints were added inline (rather than in a separate
 * `profileApi.ts`) because the file remains comfortably small and the
 * profile endpoints share `baseApi` + the `AuthMe` tag with the auth
 * endpoints — colocation makes invalidation choices obvious at the call
 * site. If this file ever exceeds ~400 LOC, split out `profileApi.ts`.
 *
 * Contract source: `apps/api/src/module/auth/auth.controller.ts` /
 * `auth.schema.ts` for `/auth/*` and
 * `apps/api/src/module/profile/profile.controller.ts` /
 * `profile.schema.ts` for `/profile/*`. When the backend is reachable
 * again, running `pnpm web:codegen` will regenerate `ftsFunctionsApi.ts`
 * with these endpoints and *this file should be deleted* (the hooks will
 * appear in the generated file under the same names).
 *
 * Hooks exported:
 *   - useAuthControllerRegisterV1Mutation
 *   - useAuthControllerVerifyEmailV1Mutation
 *   - useAuthControllerResendVerificationV1Mutation
 *   - useAuthControllerLoginV1Mutation
 *   - useAuthControllerRefreshV1Mutation
 *   - useAuthControllerLogoutV1Mutation
 *   - useAuthControllerForgotPasswordV1Mutation
 *   - useAuthControllerResetPasswordV1Mutation
 *   - useLazyAuthControllerCheckEmailV1Query
 *   - useAuthControllerMeV1Query
 *   - useProfileControllerGetV1Query
 *   - useProfileControllerUpdateV1Mutation
 *   - useProfileControllerUpdateEmailV1Mutation
 *   - useProfileControllerUpdatePasswordV1Mutation
 *   - useProfileControllerUploadAvatarV1Mutation
 *   - useProfileControllerGetAvatarPresignedUrlV1Mutation (deprecated)
 *   - useProfileControllerConfirmAvatarV1Mutation (deprecated)
 */
import { baseApi as api } from "./baseApi";

export type RegisterRequest = {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  patronymic?: string;
};

export type VerifyEmailRequest = { token: string };
export type ResendVerificationRequest = { email: string };
export type LoginRequest = { identifier: string; password: string };
export type ForgotPasswordRequest = { email: string };
export type ResetPasswordRequest = { token: string; password: string };
export type CheckEmailRequest = { email: string };
export type CheckEmailResponse = { available: boolean };

export type AuthMessageResponse = { message: string };

export type AuthTokensResponse = {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
};

export type MeResponse = {
  id: number;
  email: string | null;
  login: string | null;
  firstName: string;
  lastName: string;
  patronymic: string | null;
  fullName: string | null;
  role: string;
  emailVerified: boolean;
  isActive: boolean;
  avatarKey: string | null;
};

/** Alias used by the auth slice. */
export type ProfileDto = MeResponse;

// ---------- /v1/profile/* (PHASE5 backend) ----------

export type ProfileResponse = {
  id: number;
  login: string | null;
  email: string | null;
  /**
   * Identity fields are first-class on `/v1/profile` since F5 (see
   * `docs/open-questions.md`). Previously these were only available
   * via `/v1/auth/me`, forcing two-endpoint splicing.
   */
  firstName: string;
  lastName: string;
  patronymic: string | null;
  fullName: string | null;
  role: string;
  ftsPositionRole: string | null;
  ftsFunctionRole: string | null;
  ftsBranchType: string;
  emailVerified: boolean;
  /**
   * Stable S3 object key — survives presigned-URL TTL expiration. Pair
   * with `avatarUrl` (presigned GET TTL ≈1h) to render the current
   * avatar without an extra round-trip to `/auth/me`.
   */
  avatarKey: string | null;
  /**
   * Presigned GET URL for the current avatar object, refreshed on every
   * profile fetch / confirm. `null` when the user has no avatar.
   */
  avatarUrl: string | null;
  createdAt: string;
  updatedAt: string;
};

/**
 * `PATCH /v1/profile` accepts the four logical edits a user may run on
 * their own row: identity (`firstName/lastName/patronymic`), display
 * name (`fullName` — derived server-side when name parts are sent),
 * and `login`. Empty `patronymic` ("") is treated as "remove" and the
 * backend writes it as `null`.
 */
export type UpdateProfileRequest = {
  fullName?: string;
  login?: string;
  firstName?: string;
  lastName?: string;
  patronymic?: string | null;
};

export type ChangeProfileEmailRequest = { newEmail: string };

export type ChangeProfilePasswordRequest = {
  currentPassword: string;
  newPassword: string;
};

export type AvatarContentType =
  | "image/png"
  | "image/jpeg"
  | "image/webp"
  | "image/gif";

export type AvatarPresignedUrlRequest = { contentType: AvatarContentType };

export type AvatarPresignedUrlResponse = {
  uploadUrl: string;
  key: string;
  getUrl: string;
  expiresAt: string;
};

export type ConfirmAvatarRequest = { key: string };

export type ProfileMessageResponse = { message: string };

export type ProfileTokensResponse = {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
};

const authApi = api
  .enhanceEndpoints({ addTagTypes: ["AuthMe"] })
  .injectEndpoints({
    endpoints: (build) => ({
      authControllerRegisterV1: build.mutation<
        AuthMessageResponse,
        RegisterRequest
      >({
        query: (body) => ({
          url: `/v1/auth/register`,
          method: "POST",
          body,
        }),
      }),
      authControllerVerifyEmailV1: build.mutation<
        AuthMessageResponse & AuthTokensResponse,
        VerifyEmailRequest
      >({
        query: (body) => ({
          url: `/v1/auth/verify-email`,
          method: "POST",
          body,
        }),
        invalidatesTags: ["AuthMe"],
      }),
      authControllerResendVerificationV1: build.mutation<
        AuthMessageResponse,
        ResendVerificationRequest
      >({
        query: (body) => ({
          url: `/v1/auth/resend-verification`,
          method: "POST",
          body,
        }),
      }),
      authControllerLoginV1: build.mutation<AuthTokensResponse, LoginRequest>({
        query: (body) => ({
          url: `/v1/auth/login`,
          method: "POST",
          body,
        }),
        invalidatesTags: ["AuthMe"],
      }),
      authControllerRefreshV1: build.mutation<AuthTokensResponse, void>({
        // Refresh authorisation flows through `Authorization: Bearer <refreshToken>`
        // — handled by the baseQuery override (see `baseQuery.ts`).
        query: () => ({
          url: `/v1/auth/refresh`,
          method: "POST",
        }),
      }),
      authControllerLogoutV1: build.mutation<AuthMessageResponse, void>({
        query: () => ({
          url: `/v1/auth/logout`,
          method: "POST",
        }),
        invalidatesTags: ["AuthMe"],
      }),
      authControllerForgotPasswordV1: build.mutation<
        AuthMessageResponse,
        ForgotPasswordRequest
      >({
        query: (body) => ({
          url: `/v1/auth/forgot-password`,
          method: "POST",
          body,
        }),
      }),
      authControllerResetPasswordV1: build.mutation<
        AuthMessageResponse,
        ResetPasswordRequest
      >({
        query: (body) => ({
          url: `/v1/auth/reset-password`,
          method: "POST",
          body,
        }),
      }),
      authControllerCheckEmailV1: build.query<
        CheckEmailResponse,
        CheckEmailRequest
      >({
        query: ({ email }) => ({
          url: `/v1/auth/check-email`,
          params: { email },
        }),
      }),
      authControllerMeV1: build.query<MeResponse, void>({
        query: () => ({ url: `/v1/auth/me` }),
        providesTags: ["AuthMe"],
      }),
      profileControllerGetV1: build.query<ProfileResponse, void>({
        query: () => ({ url: `/v1/profile` }),
        providesTags: ["AuthMe"],
      }),
      profileControllerUpdateV1: build.mutation<
        ProfileResponse,
        UpdateProfileRequest
      >({
        query: (body) => ({
          url: `/v1/profile`,
          method: "PATCH",
          body,
        }),
        invalidatesTags: ["AuthMe"],
      }),
      profileControllerUpdateEmailV1: build.mutation<
        ProfileMessageResponse,
        ChangeProfileEmailRequest
      >({
        query: (body) => ({
          url: `/v1/profile/email`,
          method: "PATCH",
          body,
        }),
        invalidatesTags: ["AuthMe"],
      }),
      profileControllerUpdatePasswordV1: build.mutation<
        ProfileTokensResponse,
        ChangeProfilePasswordRequest
      >({
        query: (body) => ({
          url: `/v1/profile/password`,
          method: "PATCH",
          body,
        }),
      }),
      profileControllerUploadAvatarV1: build.mutation<
        ProfileResponse,
        FormData
      >({
        // The body is a FormData with a single `file` field. RTK Query's
        // baseQuery passes FormData through to fetch unchanged — fetch
        // sets the multipart Content-Type with the right boundary
        // automatically. Don't set `headers: { "Content-Type": ... }`
        // here, that would strip the boundary and the server would 400.
        query: (body) => ({
          url: `/v1/profile/avatar`,
          method: "POST",
          body,
        }),
        invalidatesTags: ["AuthMe"],
      }),
      /** @deprecated Use `useProfileControllerUploadAvatarV1Mutation`. */
      profileControllerGetAvatarPresignedUrlV1: build.mutation<
        AvatarPresignedUrlResponse,
        AvatarPresignedUrlRequest
      >({
        query: (body) => ({
          url: `/v1/profile/avatar/presigned-url`,
          method: "POST",
          body,
        }),
      }),
      /** @deprecated Use `useProfileControllerUploadAvatarV1Mutation`. */
      profileControllerConfirmAvatarV1: build.mutation<
        ProfileResponse,
        ConfirmAvatarRequest
      >({
        query: (body) => ({
          url: `/v1/profile/avatar/confirm`,
          method: "POST",
          body,
        }),
        invalidatesTags: ["AuthMe"],
      }),
    }),
    overrideExisting: false,
  });

export const {
  useAuthControllerRegisterV1Mutation,
  useAuthControllerVerifyEmailV1Mutation,
  useAuthControllerResendVerificationV1Mutation,
  useAuthControllerLoginV1Mutation,
  useAuthControllerRefreshV1Mutation,
  useAuthControllerLogoutV1Mutation,
  useAuthControllerForgotPasswordV1Mutation,
  useAuthControllerResetPasswordV1Mutation,
  useLazyAuthControllerCheckEmailV1Query,
  useAuthControllerMeV1Query,
  useLazyAuthControllerMeV1Query,
  useProfileControllerGetV1Query,
  useProfileControllerUpdateV1Mutation,
  useProfileControllerUpdateEmailV1Mutation,
  useProfileControllerUpdatePasswordV1Mutation,
  useProfileControllerUploadAvatarV1Mutation,
  useProfileControllerGetAvatarPresignedUrlV1Mutation,
  useProfileControllerConfirmAvatarV1Mutation,
} = authApi;

export { authApi };
