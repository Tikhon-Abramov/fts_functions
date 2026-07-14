import type { TypeResponseDto, UserResponseDto } from "../store/ftsFunctionRegistry";

export type OptionType = {
    value: number;
    label: string;
    code?: string;
};


export function createOtionsFromTypes(values: TypeResponseDto[] | undefined): OptionType[] {
    return (values || []).map(({ id, name, code }) => ({ value: id, label: name, code }));
}

export function createDtiOtions(values: TypeResponseDto[] | undefined): OptionType[] {
    return (values || []).map(({ id, name, code }) => ({ value: id, label: `${code}: ${name}` }));
}

export function createOtionsFromUsers(values: UserResponseDto[] | undefined): OptionType[] {
    return (values || []).map(({ id, shortName }) => ({ value: id, label: shortName || '' }));
}
