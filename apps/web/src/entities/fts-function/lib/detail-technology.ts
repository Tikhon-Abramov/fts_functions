import type { Row } from "src/entities/fts-function/types";
import type { TypeResponseDto } from "src/shared/api/ftsFunctionsApi";

import { FtsFunctionCategory } from "src/entities/fts-function/model";

export type TypeCategory = TypeResponseDto["category"];

export const DETAIL_TYPE_CATEGORY = {
    WHO_PERFORMS_ACTION: "WHO_PERFORMS_ACTION",
    FTS_FUNCTION_ACTION_TYPE: "FTS_FUNCTION_ACTION_TYPE",
    FTS_FUNCTION_EFFECTIVENESS: "FTS_FUNCTION_EFFECTIVENESS",
    TECHNOLOGICAL_SOLUTION: "TECHNOLOGICAL_SOLUTION",
    FEEDBACK_SOURCE: "FEEDBACK_SOURCE",
    RESPONSIBLE: "RESPONSIBLE",
    FTS_METHODOLOGY_STATUS: "FTS_METHODOLOGY_STATUS",
} as const satisfies Record<string, TypeCategory>;

export const TECHNOLOGY_DETAIL_LABELS = {
    technologicalSolution: "Технологическое решение",
    number: "Номер ПЗ / АЗ",
    responsible: "Ответственный КЦА / ГНИТС / МЮА",
    algorithm: "Алгоритм срабатывания",
} as const;

export const FEEDBACK_DETAIL_LABELS = {
    feedbackSource: "Источник обратной связи",
    feedbackQualityMetric: "Метрики качества процесса в рамках обратной связи",
    problemDescription:
        "Описание проблемы с указанием источника, метрики, способа решения",
    initiatorRequisites: "Реквизиты автора инициативы",
    methodologyPosition: "Методология позиции ЦА ФНС России",
    deadline: "Срок реализации доработки",
    initiatorAcceptance: "Акцепт автора инициативы",
} as const;

export type TechnologyFieldsShape = Pick<
    Row,
    "technologicalSolution" | "number" | "responsible" | "algorithm"
>;

export type FeedbackFieldsShape = Pick<
    Row,
    | "feedbackSource"
    | "feedbackQualityMetric"
    | "problemDescription"
    | "initiatorRequisites"
    | "methodologyPosition"
    | "deadline"
    | "initiatorAcceptance"
>;

export type FeedbackStatus = "pending" | "accepted" | "rejected";

export function isActualActionCategory(
    category: string | undefined | null,
): boolean {
    return category === FtsFunctionCategory.ACTUAL_ACTION;
}

export function getTypeCodeOptionsByCategory(
    typesAll: TypeResponseDto[] | undefined,
    category: TypeCategory,
): TypeResponseDto[] {
    return (typesAll ?? []).filter((item) => item.category === category);
}

export function getTypeNameOptionsByCategory(
    typesAll: TypeResponseDto[] | undefined,
    category: TypeCategory,
): string[] {
    return getTypeCodeOptionsByCategory(typesAll, category).map(
        (item) => item.name,
    );
}

export function findTypeByCodeOrName(
    typesAll: TypeResponseDto[] | undefined,
    category: TypeCategory,
    value: string | undefined | null,
): TypeResponseDto | undefined {
    const normalized = value?.trim();

    if (!normalized) return undefined;

    return (typesAll ?? []).find(
        (item) =>
            item.category === category &&
            (item.code === normalized || item.name === normalized),
    );
}

export function hasTechnologicalSolution(
    fields: Partial<TechnologyFieldsShape>,
): boolean {
    return Boolean(fields.technologicalSolution?.trim());
}

export function areTechnologyRequiredFieldsFilled(
    fields: Partial<TechnologyFieldsShape>,
): boolean {
    if (!hasTechnologicalSolution(fields)) return true;

    return Boolean(
        fields.number?.trim() &&
        fields.responsible?.trim() &&
        fields.algorithm?.trim(),
    );
}

export function hasFeedback(row: Partial<Row> | null | undefined): boolean {
    if (!row) return false;

    return Boolean(
        row.feedbackSource?.trim() ||
        row.feedbackQualityMetric?.trim() ||
        row.problemDescription?.trim() ||
        row.initiatorRequisites?.trim() ||
        row.methodologyPosition?.trim() ||
        row.deadline?.trim() ||
        row.initiatorAcceptance?.trim(),
    );
}

export function areFeedbackRequiredFieldsFilled(
    fields: Partial<FeedbackFieldsShape>,
): boolean {
    return Boolean(
        fields.feedbackSource?.trim() &&
        fields.feedbackQualityMetric?.trim() &&
        fields.problemDescription?.trim() &&
        fields.initiatorRequisites?.trim() &&
        fields.methodologyPosition?.trim() &&
        fields.deadline?.trim() &&
        fields.initiatorAcceptance?.trim(),
    );
}

export function getFeedbackStatus(
    row: Partial<Row> | null | undefined,
): FeedbackStatus | null {
    if (!hasFeedback(row)) return null;
    if (row?.isAccepted === true) return "accepted";
    if (row?.isAccepted === false) return "rejected";
    return "pending";
}