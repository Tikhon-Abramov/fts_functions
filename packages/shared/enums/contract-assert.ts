/**
 * Compile-time guard: A and B must be exact equal sets.
 * Fails the build if they drift.
 *
 * Usage:
 *   type _Contract = AssertEqual<SharedEnum, PrismaEnum>;
 *   const _check: _Contract = true;
 */
export type AssertEqual<A, B> = [A] extends [B]
  ? [B] extends [A]
    ? true
    : false
  : false;
