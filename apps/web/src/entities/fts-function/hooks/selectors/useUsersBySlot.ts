import type { UserResponseDto } from "src/shared/api/ftsFunctionsApi";

import { useMemo } from "react";

/**
 * The four user dropdowns on the function form each filter the same `users`
 * list by branch + role/position. A single hook driven by a predicate table
 * collapses what was four near-identical `useMemo` blocks into one call site.
 */
export const UserSlot = {
  CURATOR_CA: "CURATOR_CA",
  MANAGER_MIUDOL: "MANAGER_MIUDOL",
  DEPT_HEAD_CA: "DEPT_HEAD_CA",
  DEPT_HEAD_MIUDOL: "DEPT_HEAD_MIUDOL",
} as const;
export type UserSlot = (typeof UserSlot)[keyof typeof UserSlot];

type Predicate = (u: UserResponseDto) => boolean;

const PREDICATES: Record<UserSlot, Predicate> = {
  [UserSlot.CURATOR_CA]: (u) =>
    u.ftsBranchType === "CENTRAL_OFFICE" && u.ftsFunctionRole === "CURATOR",
  [UserSlot.MANAGER_MIUDOL]: (u) =>
    u.ftsBranchType === "INTERREGIONAL_INSPECTION" &&
    u.ftsFunctionRole === "MANAGER",
  [UserSlot.DEPT_HEAD_CA]: (u) =>
    u.ftsBranchType === "CENTRAL_OFFICE" && u.ftsPositionRole !== null,
  [UserSlot.DEPT_HEAD_MIUDOL]: (u) =>
    u.ftsBranchType === "INTERREGIONAL_INSPECTION" &&
    u.ftsPositionRole !== null,
};

export function useUsersBySlot(
  users: UserResponseDto[],
  slot: UserSlot,
): UserResponseDto[] {
  return useMemo(() => users.filter(PREDICATES[slot]), [users, slot]);
}
