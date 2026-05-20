import { I18N } from "./keys";

export const ru = {
  // ---- common ----
  [I18N.common.add]: "Добавить",
  [I18N.common.edit]: "Изменить",
  [I18N.common.delete]: "Удалить",
  [I18N.common.save]: "Сохранить",
  [I18N.common.cancel]: "Отмена",
  [I18N.common.close]: "Закрыть",
  [I18N.common.yes]: "Да",
  [I18N.common.no]: "Нет",
  [I18N.common.loading]: "Загрузка...",
  [I18N.common.empty]: "— не выбрано —",
  [I18N.common.search]: "Поиск",
  [I18N.common.confirm]: "Подтвердить",
  [I18N.common.discardChanges]: "Отменить изменения?",
  [I18N.common.notFilled]: "Не заполнено",
  [I18N.common.notSelected]: "Не указано",

  // ---- empty states ----
  [I18N.empty.types]: "Справочник типов пуст",
  [I18N.empty.typesNoMatch]:
    "Под выбранную категорию записей нет. Сбросьте фильтр или создайте новый тип.",
  [I18N.empty.users]: "Пользователи ещё не добавлены",
  [I18N.empty.usersNoMatch]:
    "Под выбранную роль пользователей нет. Сбросьте фильтр или создайте нового.",
  [I18N.empty.functions]: "Функций ещё нет",
  [I18N.empty.functionsSearch]:
    "По вашему запросу ничего не найдено. Попробуйте изменить условия поиска.",
  [I18N.empty.createFirstType]: "Создать первый тип",
  [I18N.empty.createFirstUser]: "Добавить пользователя",
  [I18N.empty.clearFilters]: "Сбросить фильтр",

  // ---- registry ----
  [I18N.registry.pageTitle]: "Реестр функций",
  [I18N.registry.pageSubtitle]:
    "Функциональный анализ · Управление функциями и детализация",
  [I18N.registry.addFunction]: "Добавить функцию",
  [I18N.registry.editFunction]: "Изменить функцию №{{id}}",
  [I18N.registry.tableTitle]: "Список функций",
  [I18N.registry.searchPlaceholder]: "Поиск по функциям...",
  [I18N.registry.counterShown]: "Отображено",
  [I18N.registry.counterOf]: "из",
  [I18N.registry.counterTotal]: "всего",
  [I18N.registry.addFunctionHint]: "Нажмите, чтобы добавить новую функцию",
  [I18N.registry.listLoadError]: "Не удалось загрузить список функций",
  [I18N.registry.toggleThemeTitle]: "Переключить тему",
  [I18N.registry.columns.id]: "ID",
  [I18N.registry.columns.name]: "Наименование",
  [I18N.registry.columns.marker]: "Маркер",
  [I18N.registry.columns.strategyProjects]: "Стратегия Д",
  [I18N.registry.columns.centralization]: "Центр. функ.",
  [I18N.registry.columns.competencyCenter]: "Центр комп.",
  [I18N.registry.columns.curatorCA]: "Куратор ЦА",
  [I18N.registry.columns.nuZnu]: "НУ/ЗНУ",
  [I18N.registry.columns.manager]: "Менеджер",
  [I18N.registry.columns.niZni]: "НИ/ЗНИ",
  [I18N.registry.columns.actions]: "Действия",
  [I18N.registry.actions.editFunction]: "Редактировать функцию",
  [I18N.registry.actions.closeEditPanel]: "Закрыть карточку редактирования",
  [I18N.registry.actions.details]: "Детализация",
  [I18N.registry.actions.delete]: "Удалить",

  // ---- form ----
  [I18N.form.fields.name]: "Наименование функции",
  [I18N.form.fields.marker]: "Маркер функции",
  [I18N.form.fields.centralization]: "Централизация функции",
  [I18N.form.fields.competencyCenter]: "Центр компетенций",
  [I18N.form.fields.dtis]: "ДТИ (Проект «Стратегия Д»)",
  [I18N.form.fields.curatorCA]: "Куратор ЦА",
  [I18N.form.fields.nuZnu]: "НУ/ЗНУ",
  [I18N.form.fields.managerMIUDOL]: "Менеджер МИУДОЛ",
  [I18N.form.fields.niZni]: "НИ/ЗНИ",
  [I18N.form.buttons.create]: "Добавить функцию",
  [I18N.form.buttons.save]: "Сохранить",
  [I18N.form.buttons.cancel]: "Отменить",
  [I18N.form.buttons.clear]: "Очистить",
  [I18N.form.messages.changesSaved]: "Изменения сохранены",
  [I18N.form.messages.confirmDiscard]: "Отменить изменения?",
  [I18N.form.messages.nameAlreadyUsed]:
    "Функция с таким названием уже существует",

  // ---- modal ----
  [I18N.modal.title]: "Детализация",
  [I18N.modal.step1Counter]: "Шаг 1: {{count}}",
  [I18N.modal.step2Counter]: "Шаг 2: {{count}}",
  [I18N.modal.linkCounter]: "Связей: {{count}}",
  [I18N.modal.loadError]: "Не удалось загрузить детализацию функции",
  [I18N.modal.step1Title]: "Шаг 1: Выбор объекта",
  [I18N.modal.step2Title]: "Шаг 2: Кластеризация / Воздействие",
  [I18N.modal.step1Short]: "Ш1: {{count}}",
  [I18N.modal.step2Short]: "Ш2: {{count}}",
  [I18N.modal.linksCount]: "{{count}} связей",
  [I18N.modal.tabs.links]: "Связи",
  [I18N.modal.tabs.details]: "Сведения",
  [I18N.modal.tabs.add]: "Добавить",
  [I18N.modal.tabs.bind]: "Связать",
  [I18N.modal.tabs.linkerDisabledReason]:
    "Сначала выберите строку в таблице — её можно будет связать с другими функциями.",
  [I18N.modal.tabs.tabDisabledReason]: "Раздел временно недоступен.",
  [I18N.modal.columns.num]: "№",
  [I18N.modal.columns.detail]: "Детализация функций",
  [I18N.modal.columns.who]: "Кто делает",
  [I18N.modal.columns.action]: "Что делать",
  [I18N.modal.actions.removeRow]: "Удалить строку",
  [I18N.modal.snackbars.dictsLoading]:
    "Справочники ещё загружаются, повторите позже",
  [I18N.modal.snackbars.added]: "Добавлено (№{{id}})",
  [I18N.modal.snackbars.updated]: "Сведения обновлены",
  [I18N.modal.snackbars.rowRemoved]: "Строка удалена",
  [I18N.modal.snackbars.linkRemoved]: "Связь удалена",
  [I18N.modal.snackbars.linkTypeLoading]: "Тип связи ещё не загружен",
  [I18N.modal.snackbars.linksAdded]: "Добавлено {{count}} связей",
  [I18N.modal.snackbars.dualAdded]: "Добавлены Шаг 1 + Шаг 2 со связью",

  // ---- linksPanel ----
  [I18N.linksPanel.emptySelection]:
    "Выберите элемент в таблице для просмотра связей",
  [I18N.linksPanel.selectedLabel]: "Выбрано (Шаг {{step}})",
  [I18N.linksPanel.noLinks]: "Связей нет",
  [I18N.linksPanel.linkChip]: "Связь",
  [I18N.linksPanel.stepLabel]: "Шаг {{step}}",
  [I18N.linksPanel.categoryCount]: "{{name}} ({{count}})",

  // ---- rowDetails ----
  [I18N.rowDetails.emptySelection]:
    "Выберите строку в таблице, чтобы увидеть сведения",
  [I18N.rowDetails.step1Label]: "Шаг 1",
  [I18N.rowDetails.step2Label]: "Шаг 2",
  [I18N.rowDetails.passport]: "— Паспорт",
  [I18N.rowDetails.editing]: "Редактирование",
  [I18N.rowDetails.editButton]: "Редактировать",
  [I18N.rowDetails.saveChanges]: "Сохранить изменения",
  [I18N.rowDetails.category]: "Категория",
  [I18N.rowDetails.detail]: "Детализация",
  [I18N.rowDetails.extraFields]: "Дополнительные сведения",

  // ---- addItem ----
  [I18N.addItem.newItem]: "Новый элемент",
  [I18N.addItem.step1]: "Шаг 1",
  [I18N.addItem.step2]: "Шаг 2",
  [I18N.addItem.limitReached]:
    'Лимит {{limit}} в категории "{{category}}" достигнут',
  [I18N.addItem.primaryFields]: "Основные поля",
  [I18N.addItem.extraFields]: "Дополнительные сведения",
  [I18N.addItem.inCategoryCount]:
    "В категории (Шаг {{step}}): {{count}} / {{limit}}",
  [I18N.addItem.dualHint]:
    "Оба шага заполнены — будут сохранены вместе со связью",
  [I18N.addItem.saveSingle]: "Сохранить",
  [I18N.addItem.saveDual]: "Сохранить (Шаг 1 + Шаг 2)",
  [I18N.addItem.quickLink]: "Сразу связать",
  [I18N.addItem.detailRequired]: "Детализация *",

  // ---- linkPicker ----
  [I18N.linkPicker.source]: "Источник",
  [I18N.linkPicker.linkKind]: "Тип связи",
  [I18N.linkPicker.step1Target]: "Шаг 1",
  [I18N.linkPicker.step2Target]: "Шаг 2",
  [I18N.linkPicker.searchPlaceholder]: "Поиск по детализации...",
  [I18N.linkPicker.alreadyLinked]: "Уже связано",
  [I18N.linkPicker.noCandidates]: "Нет подходящих элементов",
  [I18N.linkPicker.createLinks]: "Добавить {{count}} связей",

  // ---- field labels ----
  [I18N.field.who]: "Кто делает",
  [I18N.field.action]: "Что делать",
  [I18N.field.category]: "Категория",
  [I18N.field.periodicity]: "Периодичность",
  [I18N.field.complexity]: "Сложность",
  [I18N.field.artifact]: "Артефакт",
  [I18N.field.basis]: "Основание",
  [I18N.field.artifactUsage]: "Как используется артефакт",
  [I18N.field.purpose]: "Зачем выполняется",
  [I18N.field.detail]: "Детализация",

  // ---- categories ----
  [I18N.category.methodology]: "Методология",
  [I18N.category.actualAction]: "Фактическое действие",
  [I18N.category.controlAnalytics]: "Контроль/Аналитика",

  // ---- actions ----
  [I18N.action.keep]: "Оставить",
  [I18N.action.transfer]: "Передать",
  [I18N.action.optimize]: "Оптимизировать",
  [I18N.action.optimizeTransfer]: "Оптимизировать / Передать",
  [I18N.action.remove]: "Убрать",
  [I18N.action.notSet]: "Не указано",

  // ---- periodicity ----
  [I18N.periodicity.daily]: "Ежедневно",
  [I18N.periodicity.weekly]: "Еженедельно",
  [I18N.periodicity.monthly]: "Ежемесячно",
  [I18N.periodicity.byEvent]: "По событию",
  [I18N.periodicity.once]: "Разово",

  // ---- complexity ----
  [I18N.complexity.low]: "Низкая",
  [I18N.complexity.medium]: "Средняя",
  [I18N.complexity.high]: "Высокая",

  // ---- link kinds ----
  [I18N.linkKind.related]: "Связан",
  [I18N.linkKind.dependsOn]: "Зависит от",
  [I18N.linkKind.controls]: "Контролирует",

  // ---- delete dialog ----
  [I18N.delete.title]: "Подтверждение удаления",
  [I18N.delete.functionName]: "Наименование функции:",
  [I18N.delete.question]: "Вы точно хотите удалить функцию?",
  [I18N.delete.captchaPrompt]: "Для подтверждения удаления введите код:",
  [I18N.delete.captchaLabel]: "Код подтверждения",
  [I18N.delete.captchaWrong]: "Неверный код",
  [I18N.delete.confirmButton]: "Удалить",
  [I18N.delete.no]: "Нет",
  [I18N.delete.yes]: "Да",
  [I18N.delete.cancel]: "Отмена",

  // ---- not found ----
  [I18N.notFound.title]: "404 — страница не найдена",
  [I18N.notFound.hint]: "Проверьте адрес или вернитесь на главную.",

  // ---- errors ----
  [I18N.errors.TYPE_CATEGORY_MISMATCH]:
    "Значение поля {{column}} не соответствует требуемой категории справочника ({{category}}).",
  [I18N.errors.USER_ROLE_MISMATCH]:
    "Пользователь в роли «{{slot}}» не соответствует необходимой ветви ФНС или должности.",
  [I18N.errors.SELF_LOOP_FORBIDDEN]: "Нельзя связать детализацию саму с собой.",
  [I18N.errors.DUPLICATE_TREE_EDGE]: "Такая связь уже существует.",
  [I18N.errors.FTS_FUNCTION_NOT_FOUND]: "Функция ФНС не найдена.",
  [I18N.errors.FTS_FUNCTION_DETAIL_NOT_FOUND]:
    "Детализация функции ФНС не найдена.",
  [I18N.errors.FTS_FUNCTION_TREE_EDGE_NOT_FOUND]:
    "Связь в дереве функций не найдена.",
  [I18N.errors.TYPE_NOT_FOUND]: "Справочное значение не найдено.",
  [I18N.errors.USER_NOT_FOUND]: "Пользователь не найден.",
  [I18N.errors.RESOURCE_NOT_FOUND]: "Ресурс не найден.",
  [I18N.errors.UNIQUE_CONSTRAINT]: "Такая запись уже существует.",
  [I18N.errors.FOREIGN_KEY_CONSTRAINT]:
    "Ссылочная целостность нарушена: {{field}}.",
  [I18N.errors.VALIDATION_ERROR]: "Проверьте корректность полей.",
  [I18N.errors.HTTP_EXCEPTION]: "Ошибка сервера. Попробуйте позже.",
  [I18N.errors.INTERNAL_SERVER_ERROR]:
    "Внутренняя ошибка сервера. Попробуйте позже.",
  [I18N.errors.INVALID_CREDENTIALS]: "Неверный email или пароль.",
  [I18N.errors.EMAIL_ALREADY_REGISTERED]: "Этот email уже зарегистрирован.",
  [I18N.errors.EMAIL_NOT_VERIFIED]:
    "Email не подтверждён. Проверьте почту или запросите новое письмо.",
  [I18N.errors.EMAIL_VERIFICATION_REQUIRED]:
    "Чтобы продолжить, подтвердите свой email.",
  [I18N.errors.INVALID_TOKEN]: "Ссылка некорректна. Запросите новое письмо.",
  [I18N.errors.TOKEN_EXPIRED]: "Срок действия ссылки истёк. Запросите новую.",

  // ---- auth ----
  [I18N.auth.login.title]: "Вход в систему",
  [I18N.auth.login.subtitle]: "Войдите, используя email или служебный логин.",
  [I18N.auth.login.identifier]: "Email или логин",
  [I18N.auth.login.password]: "Пароль",
  [I18N.auth.login.submit]: "Войти",
  [I18N.auth.login.forgotPassword]: "Забыли пароль?",
  [I18N.auth.login.noAccount]: "Ещё нет учётной записи?",
  [I18N.auth.login.register]: "Зарегистрироваться",
  [I18N.auth.login.registeredHint]:
    "Регистрация прошла успешно. Подтвердите email и войдите.",

  [I18N.auth.register.title]: "Регистрация",
  [I18N.auth.register.subtitle]:
    "Создайте учётную запись — мы отправим письмо для подтверждения email.",
  [I18N.auth.register.email]: "Email",
  [I18N.auth.register.password]: "Пароль",
  [I18N.auth.register.confirmPassword]: "Повторите пароль",
  [I18N.auth.register.firstName]: "Имя",
  [I18N.auth.register.lastName]: "Фамилия",
  [I18N.auth.register.patronymic]: "Отчество (необязательно)",
  [I18N.auth.register.submit]: "Зарегистрироваться",
  [I18N.auth.register.haveAccount]: "Уже есть учётная запись?",
  [I18N.auth.register.login]: "Войти",
  [I18N.auth.register.successHint]:
    "Письмо с подтверждением отправлено на {{email}}. Проверьте почту.",

  [I18N.auth.verifyEmail.title]: "Подтверждение email",
  [I18N.auth.verifyEmail.verifying]: "Подтверждаем...",
  [I18N.auth.verifyEmail.success]: "Email подтверждён. Сейчас войдём.",
  [I18N.auth.verifyEmail.expired]:
    "Ссылка устарела или некорректна. Запросите новое письмо.",
  [I18N.auth.verifyEmail.checkInbox]: "Проверьте почту",
  [I18N.auth.verifyEmail.checkInboxHint]:
    "Мы отправили письмо со ссылкой на {{email}}. Перейдите по ней, чтобы завершить регистрацию.",
  [I18N.auth.verifyEmail.resendButton]: "Отправить письмо ещё раз",
  [I18N.auth.verifyEmail.resendCooldown]:
    "Можно отправить ещё раз через {{seconds}} с",
  [I18N.auth.verifyEmail.resendSuccess]:
    "Если email зарегистрирован, мы отправили новое письмо.",
  [I18N.auth.verifyEmail.backToLogin]: "Вернуться ко входу",

  [I18N.auth.forgotPassword.title]: "Восстановление пароля",
  [I18N.auth.forgotPassword.subtitle]:
    "Укажите email, и мы отправим инструкции по сбросу пароля.",
  [I18N.auth.forgotPassword.email]: "Email",
  [I18N.auth.forgotPassword.submit]: "Отправить инструкции",
  [I18N.auth.forgotPassword.sent]:
    "Если email {{email}} зарегистрирован, мы отправили инструкции.",
  [I18N.auth.forgotPassword.back]: "Назад ко входу",

  [I18N.auth.resetPassword.title]: "Новый пароль",
  [I18N.auth.resetPassword.subtitle]:
    "Введите новый пароль для своей учётной записи.",
  [I18N.auth.resetPassword.password]: "Новый пароль",
  [I18N.auth.resetPassword.confirmPassword]: "Повторите пароль",
  [I18N.auth.resetPassword.submit]: "Обновить пароль",
  [I18N.auth.resetPassword.success]:
    "Пароль обновлён. Войдите с новым паролем.",
  [I18N.auth.resetPassword.expired]:
    "Срок действия ссылки истёк. Запросите новую.",
  [I18N.auth.resetPassword.requestNew]: "Запросить новую ссылку",
  [I18N.auth.resetPassword.tokenMissing]:
    "Ссылка некорректна — отсутствует токен сброса.",

  [I18N.auth.common.passwordTooShort]:
    "Пароль должен быть не короче 8 символов.",
  [I18N.auth.common.passwordsDoNotMatch]: "Пароли не совпадают.",
  [I18N.auth.common.passwordWeak]: "Пароль должен содержать буквы и цифры.",
  [I18N.auth.common.required]: "Поле обязательно.",
  [I18N.auth.common.invalidEmail]: "Введите корректный email.",

  [I18N.auth.profile.title]: "Профиль",
  [I18N.auth.profile.subtitle]:
    "Управляйте своими данными, email и паролем. Изменения вступают в силу сразу.",
  [I18N.auth.profile.sectionBasic]: "Основные данные",
  [I18N.auth.profile.sectionEmail]: "Изменить email",
  [I18N.auth.profile.sectionPassword]: "Сменить пароль",
  [I18N.auth.profile.fullName]: "ФИО",
  [I18N.auth.profile.login]: "Логин",
  [I18N.auth.profile.email]: "Email",
  [I18N.auth.profile.currentEmail]: "Текущий email",
  [I18N.auth.profile.newEmail]: "Новый email",
  [I18N.auth.profile.currentPassword]: "Текущий пароль",
  [I18N.auth.profile.newPassword]: "Новый пароль",
  [I18N.auth.profile.confirmPassword]: "Повторите новый пароль",
  [I18N.auth.profile.save]: "Сохранить",
  [I18N.auth.profile.saveEmail]: "Сохранить email",
  [I18N.auth.profile.savePassword]: "Сохранить пароль",
  [I18N.auth.profile.avatarUpload]: "Загрузить фото",
  [I18N.auth.profile.avatarHint]: "PNG, JPEG, WEBP или GIF. До 5 МБ.",
  [I18N.auth.profile.emailReVerifyNotice]:
    "Потребуется повторное подтверждение по новому адресу.",
  [I18N.auth.profile.basicSavedSuccess]: "Профиль обновлён.",
  [I18N.auth.profile.emailSavedSuccess]:
    "Email обновлён. Проверьте новый адрес и подтвердите его.",
  [I18N.auth.profile.passwordSavedSuccess]:
    "Пароль обновлён. На остальных устройствах потребуется повторный вход.",
  [I18N.auth.profile.avatarSavedSuccess]: "Аватар обновлён.",
  [I18N.auth.profile.avatarUploadFailed]:
    "Не удалось загрузить файл. Проверьте подключение и попробуйте снова.",
  [I18N.auth.profile.avatarTypeUnsupported]:
    "Поддерживаются только PNG, JPEG, WEBP и GIF.",
  [I18N.auth.profile.emailVerified]: "Email подтверждён",
  [I18N.auth.profile.emailNotVerified]: "Email не подтверждён",
  [I18N.auth.profile.role]: "Роль",

  // ---- admin ----
  [I18N.admin.guard.forbidden]: "Доступ только для администраторов.",
  [I18N.admin.dashboard.title]: "Админ-панель",
  [I18N.admin.dashboard.subtitle]:
    "Управление справочниками типов и учётными записями пользователей.",
  [I18N.admin.dashboard.types]: "Справочники типов",
  [I18N.admin.dashboard.users]: "Пользователи",
  [I18N.admin.dashboard.recordsCount]: "{{count}} записей",
  [I18N.admin.dashboard.manage]: "Управлять",

  [I18N.admin.common.create]: "Создать",
  [I18N.admin.common.edit]: "Редактировать",
  [I18N.admin.common.delete]: "Удалить",
  [I18N.admin.common.save]: "Сохранить",
  [I18N.admin.common.cancel]: "Отмена",
  [I18N.admin.common.back]: "Назад",
  [I18N.admin.common.empty]: "Записей пока нет.",
  [I18N.admin.common.createFirst]: "Создать первую запись",
  [I18N.admin.common.saveSuccess]: "Запись сохранена.",
  [I18N.admin.common.deleteSuccess]: "Запись удалена.",
  [I18N.admin.common.filterAll]: "Все",
  [I18N.admin.common.filterCategory]: "Категория",
  [I18N.admin.common.filterRole]: "Роль",
  [I18N.admin.common.pageSize]: "Записей на странице",
  [I18N.admin.common.showMore]: "Показать ещё",
  [I18N.admin.common.required]: "Поле обязательно.",
  [I18N.admin.common.invalidColor]: "Введите цвет в формате #RRGGBB.",
  [I18N.admin.common.invalidEmail]: "Введите корректный email.",
  [I18N.admin.common.passwordTooShort]:
    "Пароль должен быть не короче 8 символов.",
  [I18N.admin.common.captchaPrompt]:
    "Для подтверждения введите название записи:",
  [I18N.admin.common.captchaLabel]: "Название записи",
  [I18N.admin.common.captchaWrong]: "Название не совпадает.",
  [I18N.admin.common.hardDeleteWarning]:
    "Запись будет удалена окончательно (hard-delete). Восстановление невозможно.",
  [I18N.admin.common.softDeleteWarning]:
    "Учётная запись будет деактивирована (soft-delete). Восстановление возможно администратором.",
  [I18N.admin.common.searchPlaceholder]: "Поиск…",
  [I18N.admin.common.lockToEdit]: "Разблокировать для редактирования",
  [I18N.admin.common.unlockToView]: "Заблокировать (только просмотр)",
  [I18N.admin.common.closePanel]: "Закрыть панель",
  [I18N.admin.common.readOnlyHint]:
    "Карточка открыта в режиме просмотра. Нажмите на замок, чтобы редактировать.",
  [I18N.admin.common.pickRecord]:
    "Выберите запись в таблице, чтобы открыть карточку.",

  [I18N.admin.types.listTitle]: "Справочники типов",
  [I18N.admin.types.createButton]: "Создать",
  [I18N.admin.types.createTitle]: "Создать тип",
  [I18N.admin.types.editTitle]: "Редактировать тип",
  [I18N.admin.types.deleteTitle]: "Удалить тип",
  [I18N.admin.types.deletePrompt]: "Вы точно хотите удалить тип «{{name}}»?",
  [I18N.admin.types.noSupertype]: "— без супертипа —",
  [I18N.admin.types.columns.id]: "ID",
  [I18N.admin.types.columns.code]: "Код",
  [I18N.admin.types.columns.name]: "Наименование",
  [I18N.admin.types.columns.category]: "Категория",
  [I18N.admin.types.columns.supertypeId]: "Супертип",
  [I18N.admin.types.columns.color]: "Цвет",
  [I18N.admin.types.columns.actions]: "Действия",
  [I18N.admin.types.fields.code]: "Код",
  [I18N.admin.types.fields.name]: "Наименование",
  [I18N.admin.types.fields.description]: "Описание",
  [I18N.admin.types.fields.category]: "Категория",
  [I18N.admin.types.fields.supertypeId]: "Супертип",
  [I18N.admin.types.fields.color]: "Цвет (#RRGGBB)",

  [I18N.admin.users.listTitle]: "Пользователи",
  [I18N.admin.users.createButton]: "Создать",
  [I18N.admin.users.createTitle]: "Создать пользователя",
  [I18N.admin.users.editTitle]: "Редактировать пользователя",
  [I18N.admin.users.deleteTitle]: "Удалить пользователя",
  [I18N.admin.users.deletePrompt]:
    "Вы точно хотите удалить пользователя «{{name}}»?",
  [I18N.admin.users.columns.id]: "ID",
  [I18N.admin.users.columns.fullName]: "ФИО",
  [I18N.admin.users.columns.login]: "Логин",
  [I18N.admin.users.columns.email]: "Email",
  [I18N.admin.users.columns.role]: "Роль",
  [I18N.admin.users.columns.ftsBranchType]: "Ветвь ФНС",
  [I18N.admin.users.columns.actions]: "Действия",
  [I18N.admin.users.fields.firstName]: "Имя",
  [I18N.admin.users.fields.lastName]: "Фамилия",
  [I18N.admin.users.fields.patronymic]: "Отчество",
  [I18N.admin.users.fields.login]: "Логин",
  [I18N.admin.users.fields.email]: "Email",
  [I18N.admin.users.fields.role]: "Роль",
  [I18N.admin.users.fields.ftsPositionRole]: "Должность",
  [I18N.admin.users.fields.ftsFunctionRole]: "Функциональная роль",
  [I18N.admin.users.fields.ftsBranchType]: "Ветвь ФНС",
  [I18N.admin.users.fields.description]: "Описание",
  [I18N.admin.users.fields.password]: "Пароль (необязательно)",
  [I18N.admin.users.fields.passwordHint]:
    "Если оставить пустым, пользователь активирует пароль через flow восстановления.",
} as const;
