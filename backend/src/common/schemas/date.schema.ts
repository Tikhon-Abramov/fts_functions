import z from 'zod';



export const dateFromJson = z
    .union([z.string(), z.date()])
    .transform((v) => {
        if (v instanceof Date) return v;

        const raw = v.trim();
        const normalized = /^\d{4}-\d{2}-\d{2}$/.test(raw)
            ? `${raw}T00:00:00.000Z`
            : raw;

        return new Date(normalized);
    })
    .pipe(z.date());