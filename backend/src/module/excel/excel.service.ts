import { Injectable } from '@nestjs/common';
import * as ExcelJS from 'exceljs';
import { ExcelColumnOptions, ExcelOptions, ExcelSheetOptions } from './excel.interface';


@Injectable()
export class ExcelService<B extends boolean> {
    private readonly buffer: B;

    constructor(buffer=true) {
        this.buffer = buffer as B;
    }

    createExcelWorkbook<const S extends readonly ExcelSheetOptions<any>[]>(
        options: { filename?: string; sheets: S },
    ): Promise<B extends true ? ExcelJS.Buffer : ExcelJS.Workbook> {
        const workbook = new ExcelJS.Workbook();
        options.sheets.forEach((sheet) => {
            this.addSheet(workbook, sheet);
        });
        return (this.buffer ? workbook.xlsx.writeBuffer() : workbook) as any;
    }


    private addSheet(workbook: ExcelJS.Workbook, options: ExcelSheetOptions) {
        const worksheet = workbook.addWorksheet(options.name);

        if (options.data.length > 0) {
            worksheet.addRow({});
            const merges: string[] = [];
            let rowMergeStart = 2;
            options.data.forEach((rowData, index) => {
                const rowValues = options.columns.map(
                    ({ map }) => map(rowData, index + 1) || ''
                );
                const rows = this.expandValues(rowValues);
                rowMergeStart += rows.length;
                worksheet.addRows(rows);
            });
            merges.forEach((merge) => worksheet.mergeCells(merge));
        }

        this.applySheetStyles(worksheet, options.columns);
    }


    private expandValues(values: any[]) {
        // Определяем максимальную длину вложенных массивов
        const maxLen = Math.max(
            ...values.map(v => Array.isArray(v) ? v.length : 1)
        );

        const result = Array.from({ length: maxLen }, () =>
            Array(values.length).fill('')
        );

        values.forEach((v, colIndex) => {
            if (Array.isArray(v)) {
                v.forEach((item, rowIndex) => {
                    result[rowIndex]![colIndex] = item;
                });
            } else {
                result[0]![colIndex] = v;
            }
        });

        return result;
    }


    private applySheetStyles(worksheet: ExcelJS.Worksheet, columns: ExcelColumnOptions<object>[]) {
        worksheet.columns = columns;

        worksheet.views = [
            {
                state: 'frozen',
                xSplit: 1,
            },
            {
                state: 'frozen',
                ySplit: 1,
            },
        ];

        columns.forEach(({isDate }, index) => {
            if (isDate)
                worksheet.getColumn(index + 1).numFmt = 'dd.mm.yyyy, hh:mm:ss';
            worksheet.getColumn(index + 1).width = 45;

        });

        worksheet.eachRow((row, rowNumber) => {
            row.eachCell((cell) => {
                cell.border = {
                    top: { style: 'thin' },
                    left: { style: 'thin' },
                    bottom: { style: 'thin' },
                    right: { style: 'thin' },
                };

                cell.alignment = {
                    vertical: 'middle',
                    horizontal: rowNumber === 1 ? 'center' : 'left',
                    wrapText: true,
                };

                if (rowNumber === 1) {
                    cell.fill = {
                        type: 'pattern',
                        pattern: 'solid',
                        fgColor: { argb: 'CFE2FDF9' },
                    };

                    cell.font = {
                        bold: true,
                        size: 12,
                    };
                }
            });
        });
    }
}
