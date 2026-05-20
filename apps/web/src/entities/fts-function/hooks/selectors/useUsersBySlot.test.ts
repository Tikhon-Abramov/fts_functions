import type { UserResponseDto } from "src/shared/api/ftsFunctionsApi";

import { renderHook } from "@testing-library/react";
import {
  UserSlot,
  useUsersBySlot,
} from "src/entities/fts-function/hooks/selectors/useUsersBySlot";
import { describe, expect, it } from "vitest";

function user(
  over: Partial<UserResponseDto> & { id: number },
): UserResponseDto {
  return {
    firstName: "F",
    lastName: "L",
    patronymic: null,
    fullName: "F L",
    shortName: "F.L.",
    description: null,
    role: "USER",
    ftsPositionRole: null,
    ftsFunctionRole: null,
    ftsBranchType: "CENTRAL_OFFICE",
    ...over,
  };
}

describe("useUsersBySlot", () => {
  const users: UserResponseDto[] = [
    user({
      id: 1,
      ftsBranchType: "CENTRAL_OFFICE",
      ftsFunctionRole: "CURATOR",
    }),
    user({
      id: 2,
      ftsBranchType: "INTERREGIONAL_INSPECTION",
      ftsFunctionRole: "MANAGER",
    }),
    user({
      id: 3,
      ftsBranchType: "CENTRAL_OFFICE",
      ftsPositionRole: "CHIEF",
    }),
    user({
      id: 4,
      ftsBranchType: "INTERREGIONAL_INSPECTION",
      ftsPositionRole: "DEPUTY_CHIEF",
    }),
    // Should be filtered out by every predicate (no role match anywhere).
    user({ id: 5, ftsBranchType: "CENTRAL_OFFICE" }),
  ];

  it("CURATOR_CA picks central-office curators only", () => {
    const { result } = renderHook(() =>
      useUsersBySlot(users, UserSlot.CURATOR_CA),
    );
    expect(result.current.map((u) => u.id)).toEqual([1]);
  });

  it("MANAGER_MIUDOL picks interregional managers only", () => {
    const { result } = renderHook(() =>
      useUsersBySlot(users, UserSlot.MANAGER_MIUDOL),
    );
    expect(result.current.map((u) => u.id)).toEqual([2]);
  });

  it("DEPT_HEAD_CA picks central-office users with any positionRole", () => {
    const { result } = renderHook(() =>
      useUsersBySlot(users, UserSlot.DEPT_HEAD_CA),
    );
    expect(result.current.map((u) => u.id)).toEqual([3]);
  });

  it("DEPT_HEAD_MIUDOL picks interregional users with any positionRole", () => {
    const { result } = renderHook(() =>
      useUsersBySlot(users, UserSlot.DEPT_HEAD_MIUDOL),
    );
    expect(result.current.map((u) => u.id)).toEqual([4]);
  });

  it("returns an empty array for an empty user list", () => {
    const { result } = renderHook(() =>
      useUsersBySlot([], UserSlot.CURATOR_CA),
    );
    expect(result.current).toEqual([]);
  });
});
