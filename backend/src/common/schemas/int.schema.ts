import z from 'zod';



export const intFromStringOrNumber = z
    .union([z.string(), z.number()])
    .transform((v) => (typeof v === 'string' ? Number(v) : v))
    .pipe(z.number().int());


export const positiveInt = intFromStringOrNumber.pipe(z.number().int().positive());


export const idArrayQuery = z
    .union([z.string(), z.number(), z.array(z.union([z.string(), z.number()]))])
    .transform((v) => (Array.isArray(v) ? v : [v]))
    .pipe(z.array(positiveInt));
