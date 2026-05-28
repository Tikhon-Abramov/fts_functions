type Cell = Date | string | number | null | undefined;

export interface ExcelColumnOptions<T> {
    header: string;
    map: (row: T, index?: number) => Cell | Cell[];
    isNumber?: boolean;
    isDate?: boolean;
}

export interface ExcelSheetOptions<T = any> {
    name: string;
    columns: ExcelColumnOptions<T>[];
    data: T[];
}

export interface ExcelOptions {
    filename?: string;
    sheets: ExcelSheetOptions[];
}