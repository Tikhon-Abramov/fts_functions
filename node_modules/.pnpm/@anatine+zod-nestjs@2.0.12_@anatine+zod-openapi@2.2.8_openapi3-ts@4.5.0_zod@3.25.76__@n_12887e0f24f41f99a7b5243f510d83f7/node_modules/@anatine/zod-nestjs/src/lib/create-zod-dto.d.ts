import { OpenApiZodAny } from '@anatine/zod-openapi';
import * as z from 'zod';
import type { TupleToUnion, Merge } from './types';
/**
 * This file was originally taken from:
 *   https://github.com/kbkk/abitia/blob/master/packages/zod-dto/src/createZodDto.ts
 *
 * It is used to create a DTO from a Zod object.
 * I assume that the create method is called within NestJS.
 */
/**
 * ZodType is a very complex interface describing not just public properties but private ones as well
 * causing the interface to change fairly often among versions
 *
 * Since we're interested in the main subset of Zod functionality (type inferring + parsing) this type is introduced
 * to achieve the most compatibility.
 */
export type CompatibleZodType = Pick<z.ZodType<unknown>, '_input' | '_output' | 'parse' | 'safeParse'>;
export type CompatibleZodInfer<T extends CompatibleZodType> = T['_output'];
export type MergeZodSchemaOutput<T extends CompatibleZodType> = T extends z.ZodDiscriminatedUnion<string, infer Options> ? Merge<object, TupleToUnion<{
    [X in keyof Options]: Options[X] extends z.ZodType ? Options[X]['_output'] : Options[X];
}>> : T extends z.ZodUnion<infer UnionTypes> ? UnionTypes extends z.ZodType[] ? Merge<object, TupleToUnion<{
    [X in keyof UnionTypes]: UnionTypes[X] extends z.ZodType ? UnionTypes[X]['_output'] : UnionTypes[X];
}>> : T['_output'] : T['_output'];
export type ZodDtoStatic<T extends CompatibleZodType = CompatibleZodType> = {
    new (): MergeZodSchemaOutput<T>;
    zodSchema: T;
    create(input: unknown): CompatibleZodInfer<T>;
};
export declare const createZodDto: <T extends OpenApiZodAny>(zodSchema: T) => ZodDtoStatic<T>;
