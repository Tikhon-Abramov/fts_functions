import type { Row } from "src/entities/fts-function/types";
import type { TypeResponseDto } from "src/shared/api/ftsFunctionsApi";

import { FtsFunctionCategory } from "src/entities/fts-function/model";

export type TypeCategory = TypeResponseDto["category"];

export const DETAIL_TYPE_CATEGORY = {
    WHO_PERFORMS_ACTION: "WHO_PERFORMS_ACTION",
    FTS_FUNCTION_ACTION_TYPE: "FTS_FUNCTION_ACTION_TYPE",
    TECHNOLOGICAL_SOLUTION: "TECHNOLOGICAL_SOLUTION",
    RESPONSIBLE: "RESPONSIBLE",
} as const satisfies Record<string, TypeCategory>;

export const TECHNOLOGY_DETAIL_LABELS = {
    technologicalSolution: "Технологическое решение",
    number: "Номер ПЗ / АЗ",
    responsible: "Ответственный",
    algorithm: "Алгоритм срабатывания",
} as const;

export type TechnologyFieldsShape = Pick<
    Row,
    "technologicalSolution" | "number" | "responsible" | "algorithm"
>;

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