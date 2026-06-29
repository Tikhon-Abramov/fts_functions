import { type Prisma, type PrismaClient } from 'src/generated/prisma/client';

const data: Prisma.TypeCreateManyInput[] = [
  { code: 'FTS_CENTRALIZATION_YES', category: 'FTS_CENTRALIZATION', name: 'Да' },
  { code: 'FTS_CENTRALIZATION_NO', category: 'FTS_CENTRALIZATION', name: 'Нет' },

  { code: 'FTS_FUNCTION_1', category: 'FTS_FUNCTION_NAME', name: 'Ведение ОКНО и учет платежей' },
  {
    code: 'FTS_FUNCTION_2',
    category: 'FTS_FUNCTION_NAME',
    name: 'Учет платежей и определения принадлежности ЕНП',
  },
  { code: 'FTS_FUNCTION_3', category: 'FTS_FUNCTION_NAME', name: 'Зачеты, возвраты' },
  {
    code: 'FTS_FUNCTION_4',
    category: 'FTS_FUNCTION_NAME',
    name: 'Взыскание задолженности со счетов в банке',
  },
  { code: 'FTS_FUNCTION_5', category: 'FTS_FUNCTION_NAME', name: 'Информирование о задолженности' },
  { code: 'FTS_FUNCTION_6', category: 'FTS_FUNCTION_NAME', name: 'Взыскание с лицевых счетов' },
  {
    code: 'FTS_FUNCTION_7',
    category: 'FTS_FUNCTION_NAME',
    name: 'Приостановление взыскания по суду',
  },
  { code: 'FTS_FUNCTION_8', category: 'FTS_FUNCTION_NAME', name: 'Формирование РАУ' },
  {
    code: 'FTS_FUNCTION_9',
    category: 'FTS_FUNCTION_NAME',
    name: 'Выявление и пресечение нарушений',
  },
  {
    code: 'FTS_FUNCTION_10',
    category: 'FTS_FUNCTION_NAME',
    name: 'Финансирование процедур банкротства',
  },
  { code: 'FTS_FUNCTION_11', category: 'FTS_FUNCTION_NAME', name: 'Обработка запросов АУ' },
  { code: 'FTS_FUNCTION_12', category: 'FTS_FUNCTION_NAME', name: 'Формирование выписки об АУ' },
  {
    code: 'FTS_FUNCTION_13',
    category: 'FTS_FUNCTION_NAME',
    name: 'Выявление деликтов, инициирование и сопровождение споров по производному долгу',
  },
  { code: 'FTS_FUNCTION_14', category: 'FTS_FUNCTION_NAME', name: 'Поиск и фиксация активов' },
  {
    code: 'FTS_FUNCTION_15',
    category: 'FTS_FUNCTION_NAME',
    name: 'Исполнение судебных актов по взысканию производного долга',
  },
  {
    code: 'FTS_FUNCTION_16',
    category: 'FTS_FUNCTION_NAME',
    name: 'Инициирование процедур банкротства',
  },
  { code: 'FTS_FUNCTION_17', category: 'FTS_FUNCTION_NAME', name: 'Включение в РТК' },
  { code: 'FTS_FUNCTION_ЦА18', category: 'FTS_FUNCTION_NAME', name: 'Сделки с ФНС' },
  { code: 'FTS_FUNCTION_19', category: 'FTS_FUNCTION_NAME', name: 'КоАП РФ' },
  { code: 'FTS_FUNCTION_20', category: 'FTS_FUNCTION_NAME', name: 'Арест имущества должников' },
  {
    code: 'FTS_FUNCTION_21',
    category: 'FTS_FUNCTION_NAME',
    name: 'Привлечение к уголовной ответственности',
  },
  {
    code: 'FTS_FUNCTION_22',
    category: 'FTS_FUNCTION_NAME',
    name: 'Обращение взыскания на предмет залога',
  },
  { code: 'FTS_FUNCTION_23', category: 'FTS_FUNCTION_NAME', name: 'Взыскание за счет имущества' },
  {
    code: 'FTS_FUNCTION_24',
    category: 'FTS_FUNCTION_NAME',
    name: 'Взыскание за счет дебиторской задолженности',
  },
  {
    code: 'FTS_FUNCTION_25',
    category: 'FTS_FUNCTION_NAME',
    name: 'Получение акта о невозможности взыскания, для последующего списания задолженности',
  },
  {
    code: 'FTS_FUNCTION_26',
    category: 'FTS_FUNCTION_NAME',
    name: 'Рассмотрение заявлений о предоставлении мер поддержки',
  },
  {
    code: 'FTS_FUNCTION_27',
    category: 'FTS_FUNCTION_NAME',
    name: 'Анализ качества и достаточности представленного заинтересованными лицами обеспечения решений о предоставлении отсрочки (рассрочки) (в части оценки обеспечения)',
  },
  {
    code: 'FTS_FUNCTION_28',
    category: 'FTS_FUNCTION_NAME',
    name: 'Формирование и реализация конкурсной массы',
  },
  {
    code: 'FTS_FUNCTION_29',
    category: 'FTS_FUNCTION_NAME',
    name: 'Формирование и реализация конкурсной массы № 2',
  },
  {
    code: 'FTS_FUNCTION_30',
    category: 'FTS_FUNCTION_NAME',
    name: 'Взыскание ликвидного дебиторского долга в банкротстве',
  },
  {
    code: 'FTS_FUNCTION_31',
    category: 'FTS_FUNCTION_NAME',
    name: 'Завершение (прекращение) неэффективных процедур банкротства',
  },
  {
    code: 'FTS_FUNCTION_32',
    category: 'FTS_FUNCTION_NAME',
    name: 'Сопровождение заявлений о намерении погашения долга перед бюджетом',
  },
  {
    code: 'FTS_FUNCTION_33',
    category: 'FTS_FUNCTION_NAME',
    name: 'Обработка обращений налогоплательщиков',
  },
  {
    code: 'FTS_FUNCTION_34',
    category: 'FTS_FUNCTION_NAME',
    name: 'Контроль за исполнением банками обязанностей, установленных Налоговым кодексом Российской Федерации',
  },
  {
    code: 'FTS_FUNCTION_35',
    category: 'FTS_FUNCTION_NAME',
    name: 'Списание безнадежной к взысканию задолженности (ст. 59 НК РФ, 47.2 БК РФ)',
  },
  {
    code: 'FTS_FUNCTION_36',
    category: 'FTS_FUNCTION_NAME',
    name: 'Восстановление пропущенных сроков в судебном порядке',
  },

  { code: 'OBJECT_SELECTION', category: 'FTS_FUNCTION_STEP', name: 'Выбор объекта' },
  { code: 'CLUSTERING_IMPACT', category: 'FTS_FUNCTION_STEP', name: 'Кластеризация / Воздействие' },

  { code: 'METHODOLOGY', category: 'FTS_FUNCTION_CATEGORY', name: 'Методология' },
  { code: 'ACTUAL_ACTION', category: 'FTS_FUNCTION_CATEGORY', name: 'Фактическое действие' },
  { code: 'CONTROL_ANALYTICS', category: 'FTS_FUNCTION_CATEGORY', name: 'Контроль / Аналитика' },

  {
    code: 'DEBT_SETTLEMENT',
    category: 'FTS_FUNCTION_MARKER',
    name: 'Урегулирование задолженности',
  },
  {
    code: 'PROSECUTION',
    category: 'FTS_FUNCTION_MARKER',
    name: 'Преследование при наличии деликтного поведения',
  },

  { code: 'SIMPLE_COMPLEXITY', category: 'FTS_FUNCTION_COMPLEXITY', name: 'Низкая' },
  { code: 'MIDDLE_COMPLEXITY', category: 'FTS_FUNCTION_COMPLEXITY', name: 'Средняя' },
  { code: 'HARD_COMPLEXITY', category: 'FTS_FUNCTION_COMPLEXITY', name: 'Высокая' },

  { code: 'DAILY', category: 'FTS_FUNCTION_EXECUTION_FREQUENCY', name: 'Ежедневно' },
  { code: 'WEEKLY', category: 'FTS_FUNCTION_EXECUTION_FREQUENCY', name: 'Еженедельно' },
  { code: 'MONTHLY', category: 'FTS_FUNCTION_EXECUTION_FREQUENCY', name: 'Ежемесячно' },
  { code: 'ON_EVENT', category: 'FTS_FUNCTION_EXECUTION_FREQUENCY', name: 'По событию' },
  { code: 'ONCE', category: 'FTS_FUNCTION_EXECUTION_FREQUENCY', name: 'Разово' },
  // { code: 'QUARTERLY',        category: 'FTS_FUNCTION_EXECUTION_FREQUENCY', name: 'Ежеквартально' },
  // { code: 'ANNUALLY',         category: 'FTS_FUNCTION_EXECUTION_FREQUENCY', name: 'Ежегодно' },
  // { code: 'TEN_DAYS',         category: 'FTS_FUNCTION_EXECUTION_FREQUENCY', name: '1 раз в 10 дней' },
  // { code: 'TWO_WEEKS',        category: 'FTS_FUNCTION_EXECUTION_FREQUENCY', name: '1 раз в 2 недели' },
  // { code: 'TWO_MONTHS',       category: 'FTS_FUNCTION_EXECUTION_FREQUENCY', name: '1 раз в 2 месяца' },
  // { code: 'HALF_YEAR',        category: 'FTS_FUNCTION_EXECUTION_FREQUENCY', name: '1 раз в полугодие' },
  // { code: 'AS_PER_FNS_ORDER', category: 'FTS_FUNCTION_EXECUTION_FREQUENCY', name: 'В соответствии со сроками, указанными в поручении ФНС России' },

  // { code: 'CENTRAL_OFFICE__URZ',                                          category: 'WHO_PERFORMS_ACTION', name: 'ЦА - УРЗ' },
  // { code: 'CENTRAL_OFFICE__UOPB',                                         category: 'WHO_PERFORMS_ACTION', name: 'ЦА - УОПБ' },
  // { code: 'COMPETENCY_CENTER__TERRITORIAL_OFFICE',                        category: 'WHO_PERFORMS_ACTION', name: 'ЦК / ТНО' },
  // { code: 'INTERREGIONAL_INSPECTION',                                     category: 'WHO_PERFORMS_ACTION', name: 'МИУДОЛ' },
  { code: 'FEDERAL_TAX_SERVICE', category: 'WHO_PERFORMS_ACTION', name: 'ФНС' },
  { code: 'TERRITORIAL_OFFICE', category: 'WHO_PERFORMS_ACTION', name: 'ТНО' },
  { code: 'COMPETENCY_CENTER', category: 'WHO_PERFORMS_ACTION', name: 'ЦК' },
  { code: 'INTERREGIONAL_INSPECTION', category: 'WHO_PERFORMS_ACTION', name: 'МИУДОЛ' },
  {
    code: 'COMPETENCY_CENTER__TERRITORIAL_OFFICE',
    category: 'WHO_PERFORMS_ACTION',
    name: 'ЦК / ТНО',
  },
  {
    code: 'FEDERAL_TAX_SERVICE__COMPETENCY_CENTER',
    category: 'WHO_PERFORMS_ACTION',
    name: 'ФНС / ЦК',
  },
  {
    code: 'INTERREGIONAL_INSPECTION__COMPETENCY_CENTER',
    category: 'WHO_PERFORMS_ACTION',
    name: 'МИУДОЛ / ЦК',
  },
  {
    code: 'INTERREGIONAL_INSPECTION__TERRITORIAL_OFFICE',
    category: 'WHO_PERFORMS_ACTION',
    name: 'МИУДОЛ / ТНО',
  },
  {
    code: 'INTERREGIONAL_INSPECTION__FEDERAL_TAX_SERVICE',
    category: 'WHO_PERFORMS_ACTION',
    name: 'МИУДОЛ / ФНС',
  },
  { code: 'TERRITORIAL_OFFICE__PRD', category: 'WHO_PERFORMS_ACTION', name: 'ТНО / ПРД' },
  {
    code: 'TERRITORIAL_OFFICE__PRD__INTERREGIONAL_INSPECTION',
    category: 'WHO_PERFORMS_ACTION',
    name: 'ТНО / ПРД / МИУДОЛ',
  },
  { code: 'PRD__INTERREGIONAL_INSPECTION', category: 'WHO_PERFORMS_ACTION', name: 'ПРД / МИУДОЛ' },
  {
    code: 'COMPETENCY_CENTER__TERRITORIAL_OFFICE__INTERREGIONAL_INSPECTION',
    category: 'WHO_PERFORMS_ACTION',
    name: 'ЦК / ТНО / МИУДОЛ',
  },

  { code: 'REMOVE', category: 'FTS_FUNCTION_ACTION_TYPE', name: 'Убрать' },
  { code: 'KEEP', category: 'FTS_FUNCTION_ACTION_TYPE', name: 'Оставить' },
  { code: 'OPTIMIZE', category: 'FTS_FUNCTION_ACTION_TYPE', name: 'Оптимизировать' },
  { code: 'TRANSFER', category: 'FTS_FUNCTION_ACTION_TYPE', name: 'Передать' },
  {
    code: 'OPTIMIZE_TRANSFER',
    category: 'FTS_FUNCTION_ACTION_TYPE',
    name: 'Оптимизировать / Передать',
  },
  {
    code: 'OPTIMIZE_KEEP',
    category: 'FTS_FUNCTION_ACTION_TYPE',
    name: 'Оптимизировать / Оставить',
  },
  {
    code: 'PILOT_RESULT',
    category: 'FTS_FUNCTION_ACTION_TYPE',
    name: 'Решение по результатам пилота',
  },

  { code: 'SIMPLE_EFFECTIVENESS', category: 'FTS_FUNCTION_EFFECTIVENESS', name: 'Низкая' },
  { code: 'MIDDLE_EFFECTIVENESS', category: 'FTS_FUNCTION_EFFECTIVENESS', name: 'Средняя' },
  { code: 'HARD_EFFECTIVENESS', category: 'FTS_FUNCTION_EFFECTIVENESS', name: 'Высокая' },

  { code: 'PVA', category: 'FTS_COMPETENCY_CENTER', name: 'ПВА' },
  { code: 'SBZ', category: 'FTS_COMPETENCY_CENTER', name: 'СБЗ' },
  { code: 'VSI', category: 'FTS_COMPETENCY_CENTER', name: 'ВСИ' },
  { code: 'KNB', category: 'FTS_COMPETENCY_CENTER', name: 'КНБ' },
  { code: 'OKNO', category: 'FTS_COMPETENCY_CENTER', name: 'ОКНО' },
  { code: 'COP', category: 'FTS_COMPETENCY_CENTER', name: 'ЦОП' },
  { code: 'PRD', category: 'FTS_COMPETENCY_CENTER', name: 'ПРД' },
  { code: 'PMV', category: 'FTS_COMPETENCY_CENTER', name: 'ПМВ' },
  { code: 'IPB', category: 'FTS_COMPETENCY_CENTER', name: 'ИПБ' },
  { code: 'RKM', category: 'FTS_COMPETENCY_CENTER', name: 'РКМ' },
  { code: 'RAU', category: 'FTS_COMPETENCY_CENTER', name: 'РАУ' },
  { code: 'VPD', category: 'FTS_COMPETENCY_CENTER', name: 'ВПД' },

  { code: 'DTI-3', category: 'FTS_DTI', name: 'Учет/взыскание неналоговых доходов' },
  { code: 'DTI-4', category: 'FTS_DTI', name: 'Рейтинг ФОИВ и МО' },
  { code: 'DTI-5', category: 'FTS_DTI', name: 'Система управления проектами' },
  { code: 'DTI-6', category: 'FTS_DTI', name: 'Репутационные характеристики НП' },
  { code: 'DTI-12', category: 'FTS_DTI', name: 'Профиль сотрудника' },
  { code: 'DTI-14', category: 'FTS_DTI', name: 'Индекс доверия' },
  { code: 'DTI-26', category: 'FTS_DTI', name: 'Умное инициирование и взыскание' },
  { code: 'DTI-29', category: 'FTS_DTI', name: 'Взыскание дебиторской задолженности' },
  {
    code: 'DTI-32',
    category: 'FTS_DTI',
    name: 'Прозрачность распределения налогов по бюджетам в ЛК',
  },
  { code: 'DTI-36', category: 'FTS_DTI', name: 'СКУАД Развитие' },
  { code: 'DTI-38', category: 'FTS_DTI', name: 'Эффективный залог' },
  { code: 'DTI-41', category: 'FTS_DTI', name: 'Центр оперативной помощи (ЦОП)' },
  { code: 'DTI-46', category: 'FTS_DTI', name: 'Взыскание производного долга' },
  { code: 'DTI-48', category: 'FTS_DTI', name: 'Развитие экосистемы реструктуризации долга' },
  { code: 'DTI-52', category: 'FTS_DTI', name: 'QR-код во все платежки' },
  {
    code: 'DTI-53',
    category: 'FTS_DTI',
    name: 'Стратсессии с ФОИВ/судами в регионах на основе анализа судебной практики',
  },
  {
    code: 'DTI-54',
    category: 'FTS_DTI',
    name: 'Единая проектная группа по выстраиванию коммуникации с внешним и внутренним клиентом',
  },
  { code: 'DTI-55', category: 'FTS_DTI', name: 'Развитие ЕНС' },
  { code: 'DTI-89', category: 'FTS_DTI', name: 'Целевая модель решения о взыскании' },
  { code: 'DTI-91', category: 'FTS_DTI', name: 'Отраслевые проекты' },
  { code: 'DTI-92', category: 'FTS_DTI', name: 'Аналитический проект' },
  { code: 'DTI-94', category: 'FTS_DTI', name: 'ЭДО с судами' },
  {
    code: 'DTI-95',
    category: 'FTS_DTI',
    name: 'Предупреждение банкротства стратегических предприятий и организаций ОПК',
  },
  {
    code: 'DTI-97',
    category: 'FTS_DTI',
    name: 'Единый проект по чистоте и корректности данных ЕНС',
  },
  { code: 'DTI-99', category: 'FTS_DTI', name: 'Платежная активность НПД' },
  {
    code: 'DTI-101',
    category: 'FTS_DTI',
    name: 'Долг наследников (технический долг в рамках 263-ФЗ)',
  },
  { code: 'DTI-102', category: 'FTS_DTI', name: 'Взыскание долга с несовершеннолетних' },
  { code: 'DTI-104', category: 'FTS_DTI', name: 'МЕГАПРОЕКТ' },
  { code: 'DTI-115', category: 'FTS_DTI', name: 'СПОТ' },
  { code: 'DTI-116', category: 'FTS_DTI', name: 'Переход на ПУД \"Электронный бюджет\"' },
  { code: 'DTI-117', category: 'FTS_DTI', name: 'Понятные ПЕНИ' },
  { code: 'DTI-118', category: 'FTS_DTI', name: 'Возврат на карту \"МИР\"' },
  { code: 'DTI-119', category: 'FTS_DTI', name: 'Возврат/зачет недобросовестным НП' },
  { code: 'DTI-123', category: 'FTS_DTI', name: 'Рейтинг банков' },
  { code: 'DTI-130', category: 'FTS_DTI', name: 'Просроченный долг' },
  { code: 'DTI-133', category: 'FTS_DTI', name: 'TaxFacto' },
  { code: 'DTI-1188', category: 'FTS_DTI', name: 'Выбор региона уплаты НДФЛ' },
  {
    code: 'DTI-2019',
    category: 'FTS_DTI',
    name: 'Обеспечительные меры ( ПОМ, ст. 101, ст. 77 НК РФ, АПК РФ, ГПК РФ, КАС',
  },
  {
    code: 'DTI-2464',
    category: 'FTS_DTI',
    name: 'Администрирование текущих платежей в банкротстве',
  },
  { code: 'DTI-2694', category: 'FTS_DTI', name: 'Работа с правоохранительными органами' },
  { code: 'DTI-2719', category: 'FTS_DTI', name: 'РАУ' },
  { code: 'DTI-2786', category: 'FTS_DTI', name: 'Внесудебное взыскание с ФЛ' },
  {
    code: 'DTI-2910',
    category: 'FTS_DTI',
    name: 'Единая с ФССП витрина исполнительных производств',
  },

  { code: 'CONNECTED', category: 'FTS_FUNCTION_RELATION_TYPE', name: 'Связан' },
  { code: 'DEPENDS_ON', category: 'FTS_FUNCTION_RELATION_TYPE', name: 'Зависит от' },
  { code: 'CONTROLS', category: 'FTS_FUNCTION_RELATION_TYPE', name: 'Контролирует' },
];


const additionally: Prisma.TypeCreateManyInput[] = [
  { code: 'AUTOMATIC_TASK',          category: 'TECHNOLOGICAL_SOLUTION', name: 'Автоматическое задание' },
  { code: 'USER_TASK',               category: 'TECHNOLOGICAL_SOLUTION', name: 'Пользовательское задание (в т.ч. любое действие по отработке документов в АИС)' },
  { code: 'EXTRACTION',              category: 'TECHNOLOGICAL_SOLUTION', name: 'Выборка' },
  { code: 'FNS_INTERACTION_SERVICE', category: 'TECHNOLOGICAL_SOLUTION', name: 'Сервис «ФНС-Взаимодействие»' },
  { code: 'REQUEST_PROCESSING',      category: 'TECHNOLOGICAL_SOLUTION', name: 'Отработка обращения' },

  { code: 'CA_COORDINATOR_PROPOSALS',    category: 'FEEDBACK_SOURCE', name: 'Собранные координатором ЦА и менеджером МИУДОЛ предложения ЦК (в т.ч. в рамках рабочих групп, выездов на гэмбу и пр.)' },
  { code: 'CA_CHAT_FEEDBACK',            category: 'FEEDBACK_SOURCE', name: 'Обратная связь ЦК/ТНО в чате «Централизация функций по работе с долгом»' },
  { code: 'EXPERT_COMMUNITY_PROPOSALS',  category: 'FEEDBACK_SOURCE', name: 'Предложения Экспертного сообщества ФНС России' },
  { code: 'OFFLINE_MEETINGS_SUMMARY',    category: 'FEEDBACK_SOURCE', name: 'Саммари очных совещаний с ЦК' },
  { code: 'KNOWN_SOFTWARE_IMPROVEMENTS', category: 'FEEDBACK_SOURCE', name: 'Доработки ПО, известные СП ЦА ФНС России' },
  { code: 'PROCESS_MININING_RESULTS',    category: 'FEEDBACK_SOURCE', name: 'Результаты процесс-майнинга, таск-майнинга' },

  { code: 'SLOW', category: 'FEEDBACK_QUALITY_METRICS', name: 'Долго' },
  { code: 'SUBOPTIMAL', category: 'FEEDBACK_QUALITY_METRICS', name: 'Неоптимально' },
  { code: 'REDUNDANT', category: 'FEEDBACK_QUALITY_METRICS', name: 'Лишнее' },
  { code: 'NOT_WORKING', category: 'FEEDBACK_QUALITY_METRICS', name: 'Не работает' },

  { code: 'KCA',   category: 'RESPONSIBLE', name: 'КЦА' },
  { code: 'GNITS', category: 'RESPONSIBLE', name: 'ГНИТС' },
  { code: 'MUA',   category: 'RESPONSIBLE', name: 'МЮА' },

  { code: 'SUPPORTED',     category: 'FTS_METHODOLOGY_STATUS', name: 'Поддержано' },
  { code: 'NOT_SUPPORTED', category: 'FTS_METHODOLOGY_STATUS', name: 'Нет' },
];



export async function constantsSeed(prisma: PrismaClient) {
  const codes = additionally.map(({code}) => code);

  await prisma.type.deleteMany({
    where: {
      code: { in: codes },
    },
  });
  
  await prisma.type.createMany({ data: additionally });
}
