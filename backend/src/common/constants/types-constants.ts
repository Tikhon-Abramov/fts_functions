import { Category } from 'src/generated/prisma/client';


export const CodesByCategory = {
    token_rotation_event: ['ROTATION_SUCCESS', 'ROTATION_FAILED', 'SUSPICIOUS_ACTIVITY', 'TOKEN_REUSE_DETECTED'],

    token_status: ['TOKEN_ACTIVE', 'TOKEN_REVOKED'],

    ACTION_HISTORY_TYPE: ['INSERT', 'UPDATE', 'DELETE'],

    FTS_CENTRALIZATION: ['FTS_CENTRALIZATION_YES', 'FTS_CENTRALIZATION_NO'],

    FTS_FUNCTION_NAME: [
        'FTS_FUNCTION_1',
        'FTS_FUNCTION_2',
        'FTS_FUNCTION_3',
        'FTS_FUNCTION_4',
        'FTS_FUNCTION_5',
        'FTS_FUNCTION_6',
        'FTS_FUNCTION_7',
        'FTS_FUNCTION_8',
        'FTS_FUNCTION_9',
        'FTS_FUNCTION_10',
        'FTS_FUNCTION_11',
        'FTS_FUNCTION_12',
        'FTS_FUNCTION_13',
        'FTS_FUNCTION_14',
        'FTS_FUNCTION_15',
        'FTS_FUNCTION_16',
        'FTS_FUNCTION_17',
        'FTS_FUNCTION_18',
        'FTS_FUNCTION_19',
        'FTS_FUNCTION_20',
        'FTS_FUNCTION_21',
        'FTS_FUNCTION_22',
        'FTS_FUNCTION_23',
        'FTS_FUNCTION_24',
        'FTS_FUNCTION_25',
        'FTS_FUNCTION_26',
        'FTS_FUNCTION_27',
        'FTS_FUNCTION_28',
        'FTS_FUNCTION_29',
        'FTS_FUNCTION_30',
        'FTS_FUNCTION_31',
        'FTS_FUNCTION_32',
        'FTS_FUNCTION_33',
        'FTS_FUNCTION_34',
        'FTS_FUNCTION_35',
        'FTS_FUNCTION_36',
    ],

    FTS_FUNCTION_STEP: ['OBJECT_SELECTION', 'CLUSTERING_IMPACT'],

    FTS_FUNCTION_CATEGORY: ['METHODOLOGY', 'ACTUAL_ACTION', 'CONTROL_ANALYTICS',],

    FTS_FUNCTION_MARKER: ['DEBT_SETTLEMENT', 'PROSECUTION'],

    FTS_FUNCTION_COMPLEXITY: ['SIMPLE_COMPLEXITY', 'MIDDLE_COMPLEXITY', 'HARD_COMPLEXITY'],

    FTS_FUNCTION_EXECUTION_FREQUENCY: ['DAILY', 'WEEKLY', 'MONTHLY', 'ON_EVENT', 'ONCE'],

    WHO_PERFORMS_ACTION: [
        'FEDERAL_TAX_SERVICE',
        'TERRITORIAL_OFFICE',
        'COMPETENCY_CENTER',
        'INTERREGIONAL_INSPECTION',
        'COMPETENCY_CENTER__TERRITORIAL_OFFICE',
        'FEDERAL_TAX_SERVICE__COMPETENCY_CENTER',
        'INTERREGIONAL_INSPECTION__COMPETENCY_CENTER',
        'INTERREGIONAL_INSPECTION__TERRITORIAL_OFFICE',
        'INTERREGIONAL_INSPECTION__FEDERAL_TAX_SERVICE',
        'TERRITORIAL_OFFICE__PRD',
        'TERRITORIAL_OFFICE__PRD__INTERREGIONAL_INSPECTION',
        'PRD__INTERREGIONAL_INSPECTION',
        'COMPETENCY_CENTER__TERRITORIAL_OFFICE__INTERREGIONAL_INSPECTION',
    ],

    FTS_FUNCTION_ACTION_TYPE: [
        'REMOVE',
        'KEEP',
        'OPTIMIZE',
        'TRANSFER',
        'OPTIMIZE_TRANSFER',
        'OPTIMIZE_KEEP',
        'PILOT_RESULT',
    ],

    FTS_FUNCTION_EFFECTIVENESS: [
        'SIMPLE_EFFECTIVENESS',
        'MIDDLE_EFFECTIVENESS',
        'HARD_EFFECTIVENESS',
    ],

    FTS_COMPETENCY_CENTER: [
        'PVA',
        'SBZ',
        'VSI',
        'KNB',
        'OKNO',
        'COP',
        'PRD',
        'PMV',
        'IPB',
        'RKM',
        'RAU',
        'VPD',
    ],

    FTS_DTI: [
        'DTI-3',
        'DTI-4',
        'DTI-5',
        'DTI-6',
        'DTI-12',
        'DTI-14',
        'DTI-26',
        'DTI-29',
        'DTI-32',
        'DTI-36',
        'DTI-38',
        'DTI-41',
        'DTI-46',
        'DTI-48',
        'DTI-52',
        'DTI-53',
        'DTI-54',
        'DTI-55',
        'DTI-89',
        'DTI-91',
        'DTI-92',
        'DTI-94',
        'DTI-95',
        'DTI-97',
        'DTI-99',
        'DTI-101',
        'DTI-102',
        'DTI-104',
        'DTI-115',
        'DTI-116',
        'DTI-117',
        'DTI-118',
        'DTI-119',
        'DTI-123',
        'DTI-130',
        'DTI-133',
        'DTI-1188',
        'DTI-2019',
        'DTI-2464',
        'DTI-2694',
        'DTI-2719',
        'DTI-2786',
        'DTI-2910',
    ],

    FTS_FUNCTION_RELATION_TYPE: ['CONNECTED', 'DEPENDS_ON', 'CONTROLS'],

    TECHNOLOGICAL_SOLUTION: [
        'AUTOMATIC_TASK',
        'USER_TASK',
        'EXTRACTION',
        'FNS_INTERACTION_SERVICE',
        'REQUEST_PROCESSING',
    ],

    FEEDBACK_SOURCE: [
        'CA_COORDINATOR_PROPOSALS',
        'CA_CHAT_FEEDBACK',
        'EXPERT_COMMUNITY_PROPOSALS',
        'OFFLINE_MEETINGS_SUMMARY',
        'KNOWN_SOFTWARE_IMPROVEMENTS',
        'PROCESS_MININING_RESULTS',
    ],

    FEEDBACK_QUALITY_METRICS: ['SLOW', 'SUBOPTIMAL', 'REDUNDANT', 'NOT_WORKING'],

    FEEDBACK_ACCEPT_STATUS: ['PENDING', 'ACCEPTED', 'REJECTED'],

    RESPONSIBLE: ['CA', 'GNIVC', 'MIUDOL'],

    FTS_METHODOLOGY_STATUS: ['SUPPORTED', 'NOT_SUPPORTED'],

    ACTION_STATUS: ['AUTO', 'MANUAL'],

    PRIORITY_ACTION: ['NECESSARILY', 'NOT_NECESSARILY'],

    CHARACTER_ACTION: ['EXCLUDE_ACTION', 'OPTIMIZE_ACTION'],

    PERSON_PERFORMING_ACTION: ['CHIEF', 'DEPUTY_CHIEF', 'INSPECTOR', 'OTHER_PERSON'],
} as const satisfies Record<Category, readonly string[]>;

export const ValidCodes = new Set(Object.values(CodesByCategory).flat());


export type Code = {
    [K in keyof typeof CodesByCategory]: {
        [V in (typeof CodesByCategory)[K][number]]: V;
    };
};

export const Code = Object.fromEntries(
    Object.entries(CodesByCategory).map(([key, codes]) => [
        key,
        Object.fromEntries(codes.map((c) => [c, c])),
    ]),
) as Code;


