/**
 * Admin Type/User CRUD endpoint typings + RTK Query injectEndpoints for
 * `/v1/constants/type/*` and `/v1/constants/user/*`.
 *
 * Why this file exists (vs. RTK Query OpenAPI codegen):
 *   `pnpm web:codegen` requires a live `/api/json` endpoint, which was not
 *   reachable while admin-fe was authored. The list-side hooks
 *   (`useConstantControllerGetTypesV1Query`, `useConstantControllerGetUsersV1Query`)
 *   already exist in the auto-generated `ftsFunctionsApi.ts` from a previous
 *   codegen pass — those are reused as-is. Only the admin-only write
 *   endpoints (POST/PATCH/DELETE) live here.
 *
 * Why a separate file from `authApi.ts`:
 *   - `authApi.ts` is being touched concurrently by the F5 profile-contract
 *     work; isolating admin endpoints avoids a merge conflict.
 *   - The admin namespace is logically distinct from auth/profile.
 *   - When the backend becomes reachable for codegen, this file deletes
 *     itself (the hooks will appear under the same names in
 *     `ftsFunctionsApi.ts`).
 *
 * Contract source: `apps/api/src/module/constant/constant.schema.ts`
 *   - `TypeCreateSchema` / `TypeUpdateSchema` / `TypeResponseSchema`
 *   - `UserCreateSchema` / `UserUpdateSchema` / `UserResponseSchema`
 *
 * Hooks exported:
 *   - useConstantControllerCreateTypeV1Mutation
 *   - useConstantControllerUpdateTypeV1Mutation
 *   - useConstantControllerDeleteTypeV1Mutation
 *   - useConstantControllerCreateUserV1Mutation
 *   - useConstantControllerUpdateUserV1Mutation
 *   - useConstantControllerDeleteUserV1Mutation
 */
import type {
  Category,
  FtsBranchType,
  FtsFunctionRole,
  FtsPositionRole,
  UserRole,
} from "@registry/shared/enums";

import { baseApi as api } from "./baseApi";

// ---------- Type CRUD ----------

export type CreateTypeRequest = {
  code: string;
  name: string;
  description?: string | null;
  supertypeId?: number | null;
  category: Category;
  color?: string | null;
};

export type UpdateTypeRequest = Partial<CreateTypeRequest>;

export type TypeResponse = {
  id: number;
  code: string;
  name: string;
  description: string | null;
  supertypeId: number | null;
  category: Category;
  color?: string | null;
};

// ---------- User CRUD ----------

export type CreateUserRequest = {
  firstName: string;
  lastName: string;
  patronymic?: string | null;
  fullName?: string | null;
  shortName?: string | null;
  description?: string | null;
  role: UserRole;
  ftsPositionRole?: FtsPositionRole | null;
  ftsFunctionRole?: FtsFunctionRole | null;
  ftsBranchType: FtsBranchType;
  login?: string | null;
  email?: string | null;
  password?: string;
};

export type UpdateUserRequest = Partial<CreateUserRequest>;

export type AdminUserResponse = {
  id: number;
  firstName: string;
  lastName: string;
  patronymic: string | null;
  fullName: string | null;
  shortName: string | null;
  description: string | null;
  role: UserRole;
  ftsPositionRole: FtsPositionRole | null;
  ftsFunctionRole: FtsFunctionRole | null;
  ftsBranchType: FtsBranchType;
};

const adminApi = api
  .enhanceEndpoints({ addTagTypes: ["Constant"] })
  .injectEndpoints({
    endpoints: (build) => ({
      constantControllerCreateTypeV1: build.mutation<
        TypeResponse,
        CreateTypeRequest
      >({
        query: (body) => ({
          url: `/v1/constants/type`,
          method: "POST",
          body,
        }),
        invalidatesTags: ["Constant"],
      }),
      constantControllerUpdateTypeV1: build.mutation<
        TypeResponse,
        { id: number; body: UpdateTypeRequest }
      >({
        query: ({ id, body }) => ({
          url: `/v1/constants/type/${id}`,
          method: "PATCH",
          body,
        }),
        invalidatesTags: ["Constant"],
      }),
      constantControllerDeleteTypeV1: build.mutation<
        TypeResponse,
        { id: number }
      >({
        query: ({ id }) => ({
          url: `/v1/constants/type/${id}`,
          method: "DELETE",
        }),
        invalidatesTags: ["Constant"],
      }),
      constantControllerCreateUserV1: build.mutation<
        AdminUserResponse,
        CreateUserRequest
      >({
        query: (body) => ({
          url: `/v1/constants/user`,
          method: "POST",
          body,
        }),
        invalidatesTags: ["Constant"],
      }),
      constantControllerUpdateUserV1: build.mutation<
        AdminUserResponse,
        { id: number; body: UpdateUserRequest }
      >({
        query: ({ id, body }) => ({
          url: `/v1/constants/user/${id}`,
          method: "PATCH",
          body,
        }),
        invalidatesTags: ["Constant"],
      }),
      constantControllerDeleteUserV1: build.mutation<
        AdminUserResponse,
        { id: number }
      >({
        query: ({ id }) => ({
          url: `/v1/constants/user/${id}`,
          method: "DELETE",
        }),
        invalidatesTags: ["Constant"],
      }),
    }),
    overrideExisting: false,
  });

export const {
  useConstantControllerCreateTypeV1Mutation,
  useConstantControllerUpdateTypeV1Mutation,
  useConstantControllerDeleteTypeV1Mutation,
  useConstantControllerCreateUserV1Mutation,
  useConstantControllerUpdateUserV1Mutation,
  useConstantControllerDeleteUserV1Mutation,
} = adminApi;

export { adminApi };
