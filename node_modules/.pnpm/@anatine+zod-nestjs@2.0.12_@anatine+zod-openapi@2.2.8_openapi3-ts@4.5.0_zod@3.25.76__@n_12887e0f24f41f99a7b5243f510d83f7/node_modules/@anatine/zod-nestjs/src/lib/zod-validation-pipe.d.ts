/**
 * This file was originally taken directly from:
 *   https://github.com/kbkk/abitia/blob/master/packages/zod-dto/src/ZodValidationPipe.ts
 */
import { PipeTransform, ArgumentMetadata } from '@nestjs/common';
import { HTTP_ERRORS_BY_CODE } from './http-errors';
export interface ZodValidationPipeOptions {
    errorHttpStatusCode?: keyof typeof HTTP_ERRORS_BY_CODE;
}
export declare class ZodValidationPipe implements PipeTransform {
    private readonly errorHttpStatusCode;
    constructor(options?: ZodValidationPipeOptions);
    transform(value: unknown, metadata: ArgumentMetadata): unknown;
}
