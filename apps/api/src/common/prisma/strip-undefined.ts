/**
 * Drops keys whose value is `undefined`.
 *
 * Needed in every Prisma write under `tsconfig.exactOptionalPropertyTypes:
 * true`: Prisma's update `data` types use `Without<A, B>` that disallow
 * explicit `undefined`, while Zod-derived update DTOs type optional fields
 * as `T | undefined`. Spreading the DTO directly fails type-check; this
 * helper produces a clean partial.
 */
export function stripUndefined<T extends Record<string, unknown>>(input: T): Partial<T> {
  const out: Partial<T> = {};
  for (const key of Object.keys(input) as Array<keyof T>) {
    const v = input[key];
    if (v !== undefined) out[key] = v;
  }
  return out;
}
