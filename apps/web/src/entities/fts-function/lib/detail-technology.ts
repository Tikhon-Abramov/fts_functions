import type { Row } from "src/entities/fts-function/types";
import type { TypeResponseDto } from "src/shared/api/ftsFunctionsApi";

import { findTypeNameByCode } from "src/entities/fts-function/api/mappers";
import { Category } from "@registry/shared/enums";

export const FACTUAL_ACTION_NAME = "Фактическое действие";

export const TECHNOLOGY_DETAIL_LABELS = {
    technologicalSolution: "Технологическое решение",
    number: "Номер ПЗ / АЗ",
    responsible: "Ответственный КЦА / ГНИТС / МЮА",
    algorithm: "Алгоритм срабатывания",
} as const;

export type TechnologyFieldsShape = Pick<
    Row,
    "technologicalSolution" | "number" | "responsible" | "algorithm"
>;

function normalize(value: string | undefined | null): string {
    return String(value ?? "").trim().toLocaleLowerCase("ru-RU");
}

export function isFactualActionCode(
    actionCode: string | undefined | null,
    typesAll: TypeResponseDto[] | undefined,
): boolean {
    if (!actionCode || !typesAll?.length) return false;

    const dbName = findTypeNameByCode(typesAll, actionCode);
    return normalize(dbName) === normalize(FACTUAL_ACTION_NAME);
}

export function getTypeCodeOptionsByCategory(
    typesAll: TypeResponseDto[] | undefined,
    category: Category,
): TypeResponseDto[] {
    return (typesAll ?? []).filter((item) => item.category === category);
}

export function getTypeNameOptionsByCategory(
    typesAll: TypeResponseDto[] | undefined,
    category: Category,
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

export function cleanupTechnologyFields<T extends Partial<TechnologyFieldsShape>>(
    fields: T,
    enabled: boolean,
): T {
    if (enabled && fields.technologicalSolution?.trim()) return fields;

    return {
        ...fields,
        technologicalSolution: "",
        number: "",
        responsible: "",
        algorithm: "",
    };
}