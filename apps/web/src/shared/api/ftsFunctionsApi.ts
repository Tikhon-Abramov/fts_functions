import { baseApi as api } from "./baseApi";
export const addTagTypes = ["Constant", "FtsFunction", "Health"] as const;
const injectedRtkApi = api
  .enhanceEndpoints({
    addTagTypes,
  })
  .injectEndpoints({
    endpoints: (build) => ({
      constantControllerGetTypesV1: build.query<
        ConstantControllerGetTypesV1ApiResponse,
        ConstantControllerGetTypesV1ApiArg
      >({
        query: (queryArg) => ({
          url: `/v1/constants/type`,
          params: {
            codes: queryArg.codes,
            categories: queryArg.categories,
            supertypeIds: queryArg.supertypeIds,
          },
        }),
        providesTags: ["Constant"],
      }),
      constantControllerCreateTypeV1: build.mutation<
        ConstantControllerCreateTypeV1ApiResponse,
        ConstantControllerCreateTypeV1ApiArg
      >({
        query: (queryArg) => ({
          url: `/v1/constants/type`,
          method: "POST",
          body: queryArg.typeCreateDto,
        }),
        invalidatesTags: ["Constant"],
      }),
      constantControllerUpdateTypeV1: build.mutation<
        ConstantControllerUpdateTypeV1ApiResponse,
        ConstantControllerUpdateTypeV1ApiArg
      >({
        query: (queryArg) => ({
          url: `/v1/constants/type/${queryArg.id}`,
          method: "PATCH",
          body: queryArg.typeUpdateDto,
        }),
        invalidatesTags: ["Constant"],
      }),
      constantControllerDeleteTypeV1: build.mutation<
        ConstantControllerDeleteTypeV1ApiResponse,
        ConstantControllerDeleteTypeV1ApiArg
      >({
        query: (queryArg) => ({
          url: `/v1/constants/type/${queryArg.id}`,
          method: "DELETE",
        }),
        invalidatesTags: ["Constant"],
      }),
      constantControllerGetUsersV1: build.query<
        ConstantControllerGetUsersV1ApiResponse,
        ConstantControllerGetUsersV1ApiArg
      >({
        query: (queryArg) => ({
          url: `/v1/constants/user`,
          params: {
            roles: queryArg.roles,
            ftsPositionRoles: queryArg.ftsPositionRoles,
            ftsFunctionRoles: queryArg.ftsFunctionRoles,
            ftsBranchTypes: queryArg.ftsBranchTypes,
          },
        }),
        providesTags: ["Constant"],
      }),
      constantControllerCreateUserV1: build.mutation<
        ConstantControllerCreateUserV1ApiResponse,
        ConstantControllerCreateUserV1ApiArg
      >({
        query: (queryArg) => ({
          url: `/v1/constants/user`,
          method: "POST",
          body: queryArg.userCreateDto,
        }),
        invalidatesTags: ["Constant"],
      }),
      constantControllerUpdateUserV1: build.mutation<
        ConstantControllerUpdateUserV1ApiResponse,
        ConstantControllerUpdateUserV1ApiArg
      >({
        query: (queryArg) => ({
          url: `/v1/constants/user/${queryArg.id}`,
          method: "PATCH",
          body: queryArg.userUpdateDto,
        }),
        invalidatesTags: ["Constant"],
      }),
      constantControllerDeleteUserV1: build.mutation<
        ConstantControllerDeleteUserV1ApiResponse,
        ConstantControllerDeleteUserV1ApiArg
      >({
        query: (queryArg) => ({
          url: `/v1/constants/user/${queryArg.id}`,
          method: "DELETE",
        }),
        invalidatesTags: ["Constant"],
      }),
      ftsFunctionControllerListV1: build.query<
        FtsFunctionControllerListV1ApiResponse,
        FtsFunctionControllerListV1ApiArg
      >({
        query: (queryArg) => ({
          url: `/v1/fts-functions`,
          params: {
            competencyCenterIds: queryArg.competencyCenterIds,
            ftsFunctionNameIds: queryArg.ftsFunctionNameIds,
            ftsFunctionMarkerIds: queryArg.ftsFunctionMarkerIds,
            ftsCentralizationIds: queryArg.ftsCentralizationIds,
            dtiIds: queryArg.dtiIds,
            curatorCentralOfficeIds: queryArg.curatorCentralOfficeIds,
            managerInterregionalInspectionIds:
              queryArg.managerInterregionalInspectionIds,
            departmentHeadCentralOfficeIds:
              queryArg.departmentHeadCentralOfficeIds,
            departmentHeadInterregionalInspectionIds:
              queryArg.departmentHeadInterregionalInspectionIds,
            ids: queryArg.ids,
            idNot: queryArg.idNot,
            idGt: queryArg.idGt,
            idGte: queryArg.idGte,
            idLt: queryArg.idLt,
            idLte: queryArg.idLte,
            includeDeleted: queryArg.includeDeleted,
            search: queryArg.search,
            sortBy: queryArg.sortBy,
            sortDir: queryArg.sortDir,
          },
        }),
        providesTags: ["FtsFunction"],
      }),
      ftsFunctionControllerCreateV1: build.mutation<
        FtsFunctionControllerCreateV1ApiResponse,
        FtsFunctionControllerCreateV1ApiArg
      >({
        query: (queryArg) => ({
          url: `/v1/fts-functions`,
          method: "POST",
          body: queryArg.createFtsFunctionDto,
        }),
        invalidatesTags: ["FtsFunction"],
      }),
      ftsFunctionControllerGetByIdV1: build.query<
        FtsFunctionControllerGetByIdV1ApiResponse,
        FtsFunctionControllerGetByIdV1ApiArg
      >({
        query: (queryArg) => ({ url: `/v1/fts-functions/${queryArg.id}` }),
        providesTags: ["FtsFunction"],
      }),
      ftsFunctionControllerUpdateV1: build.mutation<
        FtsFunctionControllerUpdateV1ApiResponse,
        FtsFunctionControllerUpdateV1ApiArg
      >({
        query: (queryArg) => ({
          url: `/v1/fts-functions/${queryArg.id}`,
          method: "PATCH",
          body: queryArg.updateFtsFunctionDto,
        }),
        invalidatesTags: ["FtsFunction"],
      }),
      ftsFunctionControllerSoftDeleteV1: build.mutation<
        FtsFunctionControllerSoftDeleteV1ApiResponse,
        FtsFunctionControllerSoftDeleteV1ApiArg
      >({
        query: (queryArg) => ({
          url: `/v1/fts-functions/${queryArg.id}`,
          method: "DELETE",
        }),
        invalidatesTags: ["FtsFunction"],
      }),
      ftsFunctionControllerCreateDetailV1: build.mutation<
        FtsFunctionControllerCreateDetailV1ApiResponse,
        FtsFunctionControllerCreateDetailV1ApiArg
      >({
        query: (queryArg) => ({
          url: `/v1/fts-functions/${queryArg.id}/details`,
          method: "POST",
          body: queryArg.createFtsFunctionDetailDto,
        }),
        invalidatesTags: ["FtsFunction"],
      }),
      ftsFunctionControllerUpdateDetailV1: build.mutation<
        FtsFunctionControllerUpdateDetailV1ApiResponse,
        FtsFunctionControllerUpdateDetailV1ApiArg
      >({
        query: (queryArg) => ({
          url: `/v1/fts-functions/details/${queryArg.detailId}`,
          method: "PATCH",
          body: queryArg.updateFtsFunctionDetailDto,
        }),
        invalidatesTags: ["FtsFunction"],
      }),
      ftsFunctionControllerSoftDeleteDetailV1: build.mutation<
        FtsFunctionControllerSoftDeleteDetailV1ApiResponse,
        FtsFunctionControllerSoftDeleteDetailV1ApiArg
      >({
        query: (queryArg) => ({
          url: `/v1/fts-functions/details/${queryArg.detailId}`,
          method: "DELETE",
        }),
        invalidatesTags: ["FtsFunction"],
      }),
      ftsFunctionControllerCreateFeedbackV1: build.mutation<
        FtsFunctionControllerCreateFeedbackV1ApiResponse,
        FtsFunctionControllerCreateFeedbackV1ApiArg
      >({
        query: (queryArg) => ({
          url: `/v1/fts-functions/details/${queryArg.detailId}/feedbacks`,
          method: "POST",
          body: queryArg.createFeedbackDto,
        }),
        invalidatesTags: ["FtsFunction"],
      }),
      ftsFunctionControllerUpdateFeedbackV1: build.mutation<
        FtsFunctionControllerUpdateFeedbackV1ApiResponse,
        FtsFunctionControllerUpdateFeedbackV1ApiArg
      >({
        query: (queryArg) => ({
          url: `/v1/fts-functions/feedbacks/${queryArg.feedbackId}`,
          method: "PATCH",
          body: queryArg.updateFeedbackDto,
        }),
        invalidatesTags: ["FtsFunction"],
      }),
      ftsFunctionControllerDeleteFeedbackV1: build.mutation<
        FtsFunctionControllerDeleteFeedbackV1ApiResponse,
        FtsFunctionControllerDeleteFeedbackV1ApiArg
      >({
        query: (queryArg) => ({
          url: `/v1/fts-functions/feedbacks/${queryArg.feedbackId}`,
          method: "DELETE",
        }),
        invalidatesTags: ["FtsFunction"],
      }),
      ftsFunctionControllerAcceptFeedbackV1: build.mutation<
        FtsFunctionControllerAcceptFeedbackV1ApiResponse,
        FtsFunctionControllerAcceptFeedbackV1ApiArg
      >({
        query: (queryArg) => ({
          url: `/v1/fts-functions/feedbacks/accept/${queryArg.feedbackId}`,
          method: "PATCH",
          body: queryArg.acceptFeedbackDto,
        }),
        invalidatesTags: ["FtsFunction"],
      }),
      ftsFunctionControllerCreatActionV1: build.mutation<
        FtsFunctionControllerCreatActionV1ApiResponse,
        FtsFunctionControllerCreatActionV1ApiArg
      >({
        query: (queryArg) => ({
          url: `/v1/fts-functions/details/${queryArg.detailId}/actions`,
          method: "POST",
          body: queryArg.createActionDto,
        }),
        invalidatesTags: ["FtsFunction"],
      }),
      ftsFunctionControllerUpdateActionV1: build.mutation<
        FtsFunctionControllerUpdateActionV1ApiResponse,
        FtsFunctionControllerUpdateActionV1ApiArg
      >({
        query: (queryArg) => ({
          url: `/v1/fts-functions/actions/${queryArg.actionId}`,
          method: "PATCH",
          body: queryArg.updateActionDto,
        }),
        invalidatesTags: ["FtsFunction"],
      }),
      ftsFunctionControllerDeleteActionV1: build.mutation<
        FtsFunctionControllerDeleteActionV1ApiResponse,
        FtsFunctionControllerDeleteActionV1ApiArg
      >({
        query: (queryArg) => ({
          url: `/v1/fts-functions/actions/${queryArg.actionId}`,
          method: "DELETE",
        }),
        invalidatesTags: ["FtsFunction"],
      }),
      ftsFunctionControllerCreateTreeEdgeV1: build.mutation<
        FtsFunctionControllerCreateTreeEdgeV1ApiResponse,
        FtsFunctionControllerCreateTreeEdgeV1ApiArg
      >({
        query: (queryArg) => ({
          url: `/v1/fts-functions/tree`,
          method: "POST",
          body: queryArg.createFtsFunctionTreeDto,
        }),
        invalidatesTags: ["FtsFunction"],
      }),
      ftsFunctionControllerDeleteTreeEdgeV1: build.mutation<
        FtsFunctionControllerDeleteTreeEdgeV1ApiResponse,
        FtsFunctionControllerDeleteTreeEdgeV1ApiArg
      >({
        query: (queryArg) => ({
          url: `/v1/fts-functions/tree/${queryArg.parentId}/${queryArg.childId}`,
          method: "DELETE",
        }),
        invalidatesTags: ["FtsFunction"],
      }),
      ftsFunctionControllerBatchAttachDtisV1V1: build.mutation<
        FtsFunctionControllerBatchAttachDtisV1V1ApiResponse,
        FtsFunctionControllerBatchAttachDtisV1V1ApiArg
      >({
        query: (queryArg) => ({
          url: `/v1/fts-functions/${queryArg.id}/dtis/batch`,
          method: "POST",
          body: queryArg.batchAttachDtisRequestDto,
        }),
        invalidatesTags: ["FtsFunction"],
      }),
      ftsFunctionControllerAttachDtiV1: build.mutation<
        FtsFunctionControllerAttachDtiV1ApiResponse,
        FtsFunctionControllerAttachDtiV1ApiArg
      >({
        query: (queryArg) => ({
          url: `/v1/fts-functions/${queryArg.id}/dtis/${queryArg.dtiId}`,
          method: "POST",
        }),
        invalidatesTags: ["FtsFunction"],
      }),
      ftsFunctionControllerDetachDtiV1: build.mutation<
        FtsFunctionControllerDetachDtiV1ApiResponse,
        FtsFunctionControllerDetachDtiV1ApiArg
      >({
        query: (queryArg) => ({
          url: `/v1/fts-functions/${queryArg.id}/dtis/${queryArg.dtiId}`,
          method: "DELETE",
        }),
        invalidatesTags: ["FtsFunction"],
      }),
      ftsFunctionControllerGetDownloadV1: build.query<
        FtsFunctionControllerGetDownloadV1ApiResponse,
        FtsFunctionControllerGetDownloadV1ApiArg
      >({
        query: () => ({ url: `/v1/fts-functions/download` }),
        providesTags: ["FtsFunction"],
      }),
      healthControllerCheckV1: build.query<
        HealthControllerCheckV1ApiResponse,
        HealthControllerCheckV1ApiArg
      >({
        query: () => ({ url: `/v1/health` }),
        providesTags: ["Health"],
      }),
    }),
    overrideExisting: false,
  });
export { injectedRtkApi as ftsFunctionsApi };
export type ConstantControllerGetTypesV1ApiResponse =
  /** status 200 Ресурс успешно найден */ TypeResponseDto[];
export type ConstantControllerGetTypesV1ApiArg = {
  codes?: string[];
  categories?: (
    | "FTS_CENTRALIZATION"
    | "FTS_FUNCTION_NAME"
    | "FTS_FUNCTION_STEP"
    | "FTS_FUNCTION_CATEGORY"
    | "FTS_FUNCTION_MARKER"
    | "FTS_FUNCTION_COMPLEXITY"
    | "FTS_FUNCTION_EXECUTION_FREQUENCY"
    | "WHO_PERFORMS_ACTION"
    | "FTS_FUNCTION_ACTION_TYPE"
    | "FTS_FUNCTION_EFFECTIVENESS"
    | "FTS_COMPETENCY_CENTER"
    | "FTS_DTI"
    | "FTS_FUNCTION_RELATION_TYPE"
    | "TECHNOLOGICAL_SOLUTION"
    | "FEEDBACK_SOURCE"
    | "FEEDBACK_QUALITY_METRICS"
    | "RESPONSIBLE"
    | "FTS_METHODOLOGY_STATUS"
    | "ACTION_STATUS"
  )[];
  supertypeIds?: number[];
};
export type ConstantControllerCreateTypeV1ApiResponse =
  /** status 201 Ресурс успешно создан */ TypeResponseDto;
export type ConstantControllerCreateTypeV1ApiArg = {
  typeCreateDto: TypeCreateDto;
};
export type ConstantControllerUpdateTypeV1ApiResponse =
  /** status 200 Ресурс успешно обновлен */ TypeResponseDto;
export type ConstantControllerUpdateTypeV1ApiArg = {
  id: number;
  typeUpdateDto: TypeUpdateDto;
};
export type ConstantControllerDeleteTypeV1ApiResponse = unknown;
export type ConstantControllerDeleteTypeV1ApiArg = {
  id: number;
};
export type ConstantControllerGetUsersV1ApiResponse =
  /** status 200 Ресурс успешно найден */ UserResponseDto[];
export type ConstantControllerGetUsersV1ApiArg = {
  roles?: ("ADMIN" | "USER")[];
  ftsPositionRoles?: ("DEPUTY_CHIEF" | "CHIEF")[];
  ftsFunctionRoles?: ("CURATOR" | "MANAGER")[];
  ftsBranchTypes?: ("CENTRAL_OFFICE" | "INTERREGIONAL_INSPECTION")[];
};
export type ConstantControllerCreateUserV1ApiResponse =
  /** status 201 Ресурс успешно создан */ UserResponseDto;
export type ConstantControllerCreateUserV1ApiArg = {
  userCreateDto: UserCreateDto;
};
export type ConstantControllerUpdateUserV1ApiResponse =
  /** status 200 Ресурс успешно обновлен */ UserResponseDto;
export type ConstantControllerUpdateUserV1ApiArg = {
  id: number;
  userUpdateDto: UserUpdateDto;
};
export type ConstantControllerDeleteUserV1ApiResponse = unknown;
export type ConstantControllerDeleteUserV1ApiArg = {
  id: number;
};
export type FtsFunctionControllerListV1ApiResponse =
  /** status 200 Ресурс успешно найден */ FtsFunctionListResponseDto;
export type FtsFunctionControllerListV1ApiArg = {
  competencyCenterIds?: string | number | (string | number)[];
  ftsFunctionNameIds?: string | number | (string | number)[];
  ftsFunctionMarkerIds?: string | number | (string | number)[];
  ftsCentralizationIds?: string | number | (string | number)[];
  dtiIds?: string | number | (string | number)[];
  curatorCentralOfficeIds?: string | number | (string | number)[];
  managerInterregionalInspectionIds?: string | number | (string | number)[];
  departmentHeadCentralOfficeIds?: string | number | (string | number)[];
  departmentHeadInterregionalInspectionIds?:
    | string
    | number
    | (string | number)[];
  ids?: string | number | (string | number)[];
  idNot?: string | number;
  idGt?: string | number;
  idGte?: string | number;
  idLt?: string | number;
  idLte?: string | number;
  includeDeleted?: string | boolean;
  search?: string;
  sortBy?: "createdAt" | "updatedAt" | "id";
  sortDir?: "asc" | "desc";
};
export type FtsFunctionControllerCreateV1ApiResponse =
  /** status 200 Ресурс успешно создан */ FtsFunctionBaseResponseDto;
export type FtsFunctionControllerCreateV1ApiArg = {
  createFtsFunctionDto: CreateFtsFunctionDto;
};
export type FtsFunctionControllerGetByIdV1ApiResponse =
  /** status 200 Ресурс успешно найден */ FtsFunctionDetailedResponseDto;
export type FtsFunctionControllerGetByIdV1ApiArg = {
  id: string | number;
};
export type FtsFunctionControllerUpdateV1ApiResponse =
  /** status 200 Ресурс успешно обновлен */ FtsFunctionBaseResponseDto;
export type FtsFunctionControllerUpdateV1ApiArg = {
  id: string | number;
  updateFtsFunctionDto: UpdateFtsFunctionDto;
};
export type FtsFunctionControllerSoftDeleteV1ApiResponse =
  /** status 200 Ресурс успешно удален */ FtsFunctionBaseResponseDto;
export type FtsFunctionControllerSoftDeleteV1ApiArg = {
  id: string | number;
};
export type FtsFunctionControllerCreateDetailV1ApiResponse =
  /** status 200 Ресурс успешно создан */ FtsFunctionDetailDetailedResponseDto;
export type FtsFunctionControllerCreateDetailV1ApiArg = {
  id: string | number;
  createFtsFunctionDetailDto: CreateFtsFunctionDetailDto;
};
export type FtsFunctionControllerUpdateDetailV1ApiResponse =
  /** status 200 Ресурс успешно обновлен */ FtsFunctionDetailDetailedResponseDto;
export type FtsFunctionControllerUpdateDetailV1ApiArg = {
  detailId: string | number;
  updateFtsFunctionDetailDto: UpdateFtsFunctionDetailDto;
};
export type FtsFunctionControllerSoftDeleteDetailV1ApiResponse =
  /** status 200 Ресурс успешно удален */ FtsFunctionDetailDetailedResponseDto;
export type FtsFunctionControllerSoftDeleteDetailV1ApiArg = {
  detailId: string | number;
};
export type FtsFunctionControllerCreateFeedbackV1ApiResponse =
  /** status 200 Ресурс успешно создан */ FeedbackResponseDto;
export type FtsFunctionControllerCreateFeedbackV1ApiArg = {
  detailId: string | number;
  createFeedbackDto: CreateFeedbackDto;
};
export type FtsFunctionControllerUpdateFeedbackV1ApiResponse =
  /** status 200 Ресурс успешно обновлен */ FeedbackResponseDto;
export type FtsFunctionControllerUpdateFeedbackV1ApiArg = {
  feedbackId: string | number;
  updateFeedbackDto: UpdateFeedbackDto;
};
export type FtsFunctionControllerDeleteFeedbackV1ApiResponse =
  /** status 200 Ресурс успешно удален */ FeedbackResponseDto;
export type FtsFunctionControllerDeleteFeedbackV1ApiArg = {
  feedbackId: string | number;
};
export type FtsFunctionControllerAcceptFeedbackV1ApiResponse =
  /** status 200 Ресурс успешно обновлен */ FeedbackResponseDto;
export type FtsFunctionControllerAcceptFeedbackV1ApiArg = {
  feedbackId: string | number;
  acceptFeedbackDto: AcceptFeedbackDto;
};
export type FtsFunctionControllerCreatActionV1ApiResponse =
  /** status 200 Ресурс успешно создан */ ActionResponseDto;
export type FtsFunctionControllerCreatActionV1ApiArg = {
  detailId: string | number;
  createActionDto: CreateActionDto;
};
export type FtsFunctionControllerUpdateActionV1ApiResponse =
  /** status 200 Ресурс успешно обновлен */ ActionResponseDto;
export type FtsFunctionControllerUpdateActionV1ApiArg = {
  actionId: string | number;
  updateActionDto: UpdateActionDto;
};
export type FtsFunctionControllerDeleteActionV1ApiResponse =
  /** status 200 Ресурс успешно удален */ ActionResponseDto;
export type FtsFunctionControllerDeleteActionV1ApiArg = {
  actionId: string | number;
};
export type FtsFunctionControllerCreateTreeEdgeV1ApiResponse =
  /** status 200 Ресурс успешно создан */ FtsFunctionTreeResponseDto;
export type FtsFunctionControllerCreateTreeEdgeV1ApiArg = {
  createFtsFunctionTreeDto: CreateFtsFunctionTreeDto;
};
export type FtsFunctionControllerDeleteTreeEdgeV1ApiResponse =
  /** status 200 Ресурс успешно удален */ FtsFunctionTreeResponseDto;
export type FtsFunctionControllerDeleteTreeEdgeV1ApiArg = {
  parentId: string | number;
  childId: string | number;
};
export type FtsFunctionControllerBatchAttachDtisV1V1ApiResponse =
  /** status 200 Ресурс успешно обновлен */ FtsFunctionDetailedResponseDto;
export type FtsFunctionControllerBatchAttachDtisV1V1ApiArg = {
  id: string | number;
  batchAttachDtisRequestDto: BatchAttachDtisRequestDto;
};
export type FtsFunctionControllerAttachDtiV1ApiResponse =
  /** status 200 Ресурс успешно создан */ FtsFunctionToDtiResponseDto;
export type FtsFunctionControllerAttachDtiV1ApiArg = {
  id: string | number;
  dtiId: string | number;
};
export type FtsFunctionControllerDetachDtiV1ApiResponse =
  /** status 200 Ресурс успешно удален */ FtsFunctionToDtiResponseDto;
export type FtsFunctionControllerDetachDtiV1ApiArg = {
  id: string | number;
  dtiId: string | number;
};
export type FtsFunctionControllerGetDownloadV1ApiResponse =
  /** status 200 Файл успешно выгружен */ Blob;
export type FtsFunctionControllerGetDownloadV1ApiArg = void;
export type HealthControllerCheckV1ApiResponse = unknown;
export type HealthControllerCheckV1ApiArg = void;
export type TypeResponseDto = {
  id: number;
  code: string;
  name: string;
  description: string | null;
  supertypeId: number | null;
  category:
    | "FTS_CENTRALIZATION"
    | "FTS_FUNCTION_NAME"
    | "FTS_FUNCTION_STEP"
    | "FTS_FUNCTION_CATEGORY"
    | "FTS_FUNCTION_MARKER"
    | "FTS_FUNCTION_COMPLEXITY"
    | "FTS_FUNCTION_EXECUTION_FREQUENCY"
    | "WHO_PERFORMS_ACTION"
    | "FTS_FUNCTION_ACTION_TYPE"
    | "FTS_FUNCTION_EFFECTIVENESS"
    | "FTS_COMPETENCY_CENTER"
    | "FTS_DTI"
    | "FTS_FUNCTION_RELATION_TYPE"
    | "TECHNOLOGICAL_SOLUTION"
    | "FEEDBACK_SOURCE"
    | "FEEDBACK_QUALITY_METRICS"
    | "RESPONSIBLE"
    | "FTS_METHODOLOGY_STATUS"
    | "ACTION_STATUS";
  color?: string | null;
};
export type ErrorResponseDto = {
  statusCode: number;
  code: string;
  params?: {
    [key: string]: any;
  };
  message: string | string[] | any[];
  timestamp: string;
};
export type TypeCreateDto = {
  code: string;
  name: string;
  description?: string | null;
  supertypeId?: number | null;
  category:
    | "FTS_CENTRALIZATION"
    | "FTS_FUNCTION_NAME"
    | "FTS_FUNCTION_STEP"
    | "FTS_FUNCTION_CATEGORY"
    | "FTS_FUNCTION_MARKER"
    | "FTS_FUNCTION_COMPLEXITY"
    | "FTS_FUNCTION_EXECUTION_FREQUENCY"
    | "WHO_PERFORMS_ACTION"
    | "FTS_FUNCTION_ACTION_TYPE"
    | "FTS_FUNCTION_EFFECTIVENESS"
    | "FTS_COMPETENCY_CENTER"
    | "FTS_DTI"
    | "FTS_FUNCTION_RELATION_TYPE"
    | "TECHNOLOGICAL_SOLUTION"
    | "FEEDBACK_SOURCE"
    | "FEEDBACK_QUALITY_METRICS"
    | "RESPONSIBLE"
    | "FTS_METHODOLOGY_STATUS"
    | "ACTION_STATUS";
  color?: string | null;
};
export type TypeUpdateDto = {
  code?: string;
  name?: string;
  description?: string | null;
  supertypeId?: number | null;
  category?:
    | "FTS_CENTRALIZATION"
    | "FTS_FUNCTION_NAME"
    | "FTS_FUNCTION_STEP"
    | "FTS_FUNCTION_CATEGORY"
    | "FTS_FUNCTION_MARKER"
    | "FTS_FUNCTION_COMPLEXITY"
    | "FTS_FUNCTION_EXECUTION_FREQUENCY"
    | "WHO_PERFORMS_ACTION"
    | "FTS_FUNCTION_ACTION_TYPE"
    | "FTS_FUNCTION_EFFECTIVENESS"
    | "FTS_COMPETENCY_CENTER"
    | "FTS_DTI"
    | "FTS_FUNCTION_RELATION_TYPE"
    | "TECHNOLOGICAL_SOLUTION"
    | "FEEDBACK_SOURCE"
    | "FEEDBACK_QUALITY_METRICS"
    | "RESPONSIBLE"
    | "FTS_METHODOLOGY_STATUS"
    | "ACTION_STATUS";
  color?: string | null;
};
export type UserResponseDto = {
  id: number;
  firstName: string;
  lastName: string;
  patronymic: string | null;
  fullName: string | null;
  shortName: string | null;
  description: string | null;
  role: "ADMIN" | "USER";
  ftsPositionRole: ("DEPUTY_CHIEF" | "CHIEF") | null;
  ftsFunctionRole: ("CURATOR" | "MANAGER") | null;
  ftsBranchType: "CENTRAL_OFFICE" | "INTERREGIONAL_INSPECTION";
};
export type UserCreateDto = {
  firstName: string;
  lastName: string;
  patronymic?: string | null;
  fullName?: string | null;
  shortName?: string | null;
  description?: string | null;
  role: "ADMIN" | "USER";
  ftsPositionRole?: ("DEPUTY_CHIEF" | "CHIEF") | null;
  ftsFunctionRole?: ("CURATOR" | "MANAGER") | null;
  ftsBranchType: "CENTRAL_OFFICE" | "INTERREGIONAL_INSPECTION";
  login?: string | null;
  email?: string | null;
  password?: string;
};
export type UserUpdateDto = {
  firstName?: string;
  lastName?: string;
  patronymic?: string | null;
  fullName?: string | null;
  shortName?: string | null;
  description?: string | null;
  role?: "ADMIN" | "USER";
  ftsPositionRole?: ("DEPUTY_CHIEF" | "CHIEF") | null;
  ftsFunctionRole?: ("CURATOR" | "MANAGER") | null;
  ftsBranchType?: "CENTRAL_OFFICE" | "INTERREGIONAL_INSPECTION";
  login?: string | null;
  email?: string | null;
  password?: string;
};
export type FtsFunctionListResponseDto = {
  items: {
    id: number;
    ftsCentralizationId: number;
    ftsFunctionNameId: number;
    competencyCenterId: number;
    ftsFunctionMarkerId: number;
    curatorCentralOfficeId: number;
    managerInterregionalInspectionId: number;
    departmentHeadCentralOfficeId: number;
    departmentHeadInterregionalInspectionId: number;
    createdAt: string;
    updatedAt: string;
    isDeleted: boolean;
    deletedAt: string | null;
    dtis: {
      dti: {
        id: number;
        name: string;
        code: string;
      };
    }[];
  }[];
  filteredTotal: number;
  overallTotal: number;
};
export type FtsFunctionBaseResponseDto = {
  id: number;
  ftsCentralizationId: number;
  ftsFunctionNameId: number;
  competencyCenterId: number;
  ftsFunctionMarkerId: number;
  curatorCentralOfficeId: number;
  managerInterregionalInspectionId: number;
  departmentHeadCentralOfficeId: number;
  departmentHeadInterregionalInspectionId: number;
  createdAt: string;
  updatedAt: string;
  isDeleted: boolean;
  deletedAt: string | null;
};
export type CreateFtsFunctionDto = {
  ftsCentralizationId: string | number;
  ftsFunctionNameId: string | number;
  competencyCenterId: string | number;
  ftsFunctionMarkerId: string | number;
  curatorCentralOfficeId: string | number;
  managerInterregionalInspectionId: string | number;
  departmentHeadCentralOfficeId: string | number;
  departmentHeadInterregionalInspectionId: string | number;
};
export type FtsFunctionDetailedResponseDto = {
  id: number;
  ftsCentralizationId: number;
  ftsFunctionNameId: number;
  competencyCenterId: number;
  ftsFunctionMarkerId: number;
  curatorCentralOfficeId: number;
  managerInterregionalInspectionId: number;
  departmentHeadCentralOfficeId: number;
  departmentHeadInterregionalInspectionId: number;
  createdAt: string;
  updatedAt: string;
  isDeleted: boolean;
  deletedAt: string | null;
  ftsCentralization: {
    id: number;
    code: string;
    name: string;
    category:
      | "FTS_CENTRALIZATION"
      | "FTS_FUNCTION_NAME"
      | "FTS_FUNCTION_STEP"
      | "FTS_FUNCTION_CATEGORY"
      | "FTS_FUNCTION_MARKER"
      | "FTS_FUNCTION_COMPLEXITY"
      | "FTS_FUNCTION_EXECUTION_FREQUENCY"
      | "WHO_PERFORMS_ACTION"
      | "FTS_FUNCTION_ACTION_TYPE"
      | "FTS_FUNCTION_EFFECTIVENESS"
      | "FTS_COMPETENCY_CENTER"
      | "FTS_DTI"
      | "FTS_FUNCTION_RELATION_TYPE"
      | "TECHNOLOGICAL_SOLUTION"
      | "FEEDBACK_SOURCE"
      | "FEEDBACK_QUALITY_METRICS"
      | "RESPONSIBLE"
      | "FTS_METHODOLOGY_STATUS"
      | "ACTION_STATUS";
  };
  ftsFunctionName: {
    id: number;
    code: string;
    name: string;
    category:
      | "FTS_CENTRALIZATION"
      | "FTS_FUNCTION_NAME"
      | "FTS_FUNCTION_STEP"
      | "FTS_FUNCTION_CATEGORY"
      | "FTS_FUNCTION_MARKER"
      | "FTS_FUNCTION_COMPLEXITY"
      | "FTS_FUNCTION_EXECUTION_FREQUENCY"
      | "WHO_PERFORMS_ACTION"
      | "FTS_FUNCTION_ACTION_TYPE"
      | "FTS_FUNCTION_EFFECTIVENESS"
      | "FTS_COMPETENCY_CENTER"
      | "FTS_DTI"
      | "FTS_FUNCTION_RELATION_TYPE"
      | "TECHNOLOGICAL_SOLUTION"
      | "FEEDBACK_SOURCE"
      | "FEEDBACK_QUALITY_METRICS"
      | "RESPONSIBLE"
      | "FTS_METHODOLOGY_STATUS"
      | "ACTION_STATUS";
  };
  competencyCenter: {
    id: number;
    code: string;
    name: string;
    category:
      | "FTS_CENTRALIZATION"
      | "FTS_FUNCTION_NAME"
      | "FTS_FUNCTION_STEP"
      | "FTS_FUNCTION_CATEGORY"
      | "FTS_FUNCTION_MARKER"
      | "FTS_FUNCTION_COMPLEXITY"
      | "FTS_FUNCTION_EXECUTION_FREQUENCY"
      | "WHO_PERFORMS_ACTION"
      | "FTS_FUNCTION_ACTION_TYPE"
      | "FTS_FUNCTION_EFFECTIVENESS"
      | "FTS_COMPETENCY_CENTER"
      | "FTS_DTI"
      | "FTS_FUNCTION_RELATION_TYPE"
      | "TECHNOLOGICAL_SOLUTION"
      | "FEEDBACK_SOURCE"
      | "FEEDBACK_QUALITY_METRICS"
      | "RESPONSIBLE"
      | "FTS_METHODOLOGY_STATUS"
      | "ACTION_STATUS";
  };
  ftsFunctionMarker: {
    id: number;
    code: string;
    name: string;
    category:
      | "FTS_CENTRALIZATION"
      | "FTS_FUNCTION_NAME"
      | "FTS_FUNCTION_STEP"
      | "FTS_FUNCTION_CATEGORY"
      | "FTS_FUNCTION_MARKER"
      | "FTS_FUNCTION_COMPLEXITY"
      | "FTS_FUNCTION_EXECUTION_FREQUENCY"
      | "WHO_PERFORMS_ACTION"
      | "FTS_FUNCTION_ACTION_TYPE"
      | "FTS_FUNCTION_EFFECTIVENESS"
      | "FTS_COMPETENCY_CENTER"
      | "FTS_DTI"
      | "FTS_FUNCTION_RELATION_TYPE"
      | "TECHNOLOGICAL_SOLUTION"
      | "FEEDBACK_SOURCE"
      | "FEEDBACK_QUALITY_METRICS"
      | "RESPONSIBLE"
      | "FTS_METHODOLOGY_STATUS"
      | "ACTION_STATUS";
  };
  curatorCentralOffice: {
    id: number;
    shortName: string | null;
    fullName: string | null;
  };
  managerInterregionalInspection: {
    id: number;
    shortName: string | null;
    fullName: string | null;
  };
  departmentHeadCentralOffice: {
    id: number;
    shortName: string | null;
    fullName: string | null;
  };
  departmentHeadInterregionalInspection: {
    id: number;
    shortName: string | null;
    fullName: string | null;
  };
  dtis: {
    dtiId: number;
    createdAt: string;
    dti: {
      id: number;
      code: string;
      name: string;
      category:
        | "FTS_CENTRALIZATION"
        | "FTS_FUNCTION_NAME"
        | "FTS_FUNCTION_STEP"
        | "FTS_FUNCTION_CATEGORY"
        | "FTS_FUNCTION_MARKER"
        | "FTS_FUNCTION_COMPLEXITY"
        | "FTS_FUNCTION_EXECUTION_FREQUENCY"
        | "WHO_PERFORMS_ACTION"
        | "FTS_FUNCTION_ACTION_TYPE"
        | "FTS_FUNCTION_EFFECTIVENESS"
        | "FTS_COMPETENCY_CENTER"
        | "FTS_DTI"
        | "FTS_FUNCTION_RELATION_TYPE"
        | "TECHNOLOGICAL_SOLUTION"
        | "FEEDBACK_SOURCE"
        | "FEEDBACK_QUALITY_METRICS"
        | "RESPONSIBLE"
        | "FTS_METHODOLOGY_STATUS"
        | "ACTION_STATUS";
    };
  }[];
  ftsFunctionDetails: {
    id: number;
    ftsFunctionId: number;
    ftsFunctionStepId: number;
    ftsFunctionCategoryId: number | null;
    ftsFunctionComplexityId: number | null;
    ftsFunctionExecutionFrequencyId: number | null;
    whoPerformsActionId: number | null;
    ftsFunctionActionTypeId: number | null;
    ftsFunctionEffectivenessId: number | null;
    technologicalSolutionId?: ((string | null) | (number | null)) | null;
    responsibleId?: ((string | null) | (number | null)) | null;
    ftsFunctionDetails: string | null;
    basis: string | null;
    artifact: string | null;
    artifactUsage: string | null;
    purpose: string | null;
    number?: string | null;
    algorithm?: string | null;
    createdAt: string;
    updatedAt: string;
    isDeleted: boolean;
    deletedAt: string | null;
    feedbacks?: {
      id: number;
      ftsFunctionDetailId: number;
      feedbackQualityMetricsId: number | null;
      ftsMethodologyStatusId: number | null;
      problemDescription: string | null;
      initiatorRequisites: string | null;
      initiatorAcceptance: string | null;
      deadline: string | null;
      isAccepted: boolean | null;
      ftsMethodologyStatus: {
        id: number;
        code: string;
        name: string;
        category:
          | "FTS_CENTRALIZATION"
          | "FTS_FUNCTION_NAME"
          | "FTS_FUNCTION_STEP"
          | "FTS_FUNCTION_CATEGORY"
          | "FTS_FUNCTION_MARKER"
          | "FTS_FUNCTION_COMPLEXITY"
          | "FTS_FUNCTION_EXECUTION_FREQUENCY"
          | "WHO_PERFORMS_ACTION"
          | "FTS_FUNCTION_ACTION_TYPE"
          | "FTS_FUNCTION_EFFECTIVENESS"
          | "FTS_COMPETENCY_CENTER"
          | "FTS_DTI"
          | "FTS_FUNCTION_RELATION_TYPE"
          | "TECHNOLOGICAL_SOLUTION"
          | "FEEDBACK_SOURCE"
          | "FEEDBACK_QUALITY_METRICS"
          | "RESPONSIBLE"
          | "FTS_METHODOLOGY_STATUS"
          | "ACTION_STATUS";
      } | null;
      feedbackQualityMetrics: {
        id: number;
        code: string;
        name: string;
        category:
          | "FTS_CENTRALIZATION"
          | "FTS_FUNCTION_NAME"
          | "FTS_FUNCTION_STEP"
          | "FTS_FUNCTION_CATEGORY"
          | "FTS_FUNCTION_MARKER"
          | "FTS_FUNCTION_COMPLEXITY"
          | "FTS_FUNCTION_EXECUTION_FREQUENCY"
          | "WHO_PERFORMS_ACTION"
          | "FTS_FUNCTION_ACTION_TYPE"
          | "FTS_FUNCTION_EFFECTIVENESS"
          | "FTS_COMPETENCY_CENTER"
          | "FTS_DTI"
          | "FTS_FUNCTION_RELATION_TYPE"
          | "TECHNOLOGICAL_SOLUTION"
          | "FEEDBACK_SOURCE"
          | "FEEDBACK_QUALITY_METRICS"
          | "RESPONSIBLE"
          | "FTS_METHODOLOGY_STATUS"
          | "ACTION_STATUS";
      } | null;
      feedbackSources: {
        feedbackSource: {
          id: number;
          code: string;
          name: string;
          category:
            | "FTS_CENTRALIZATION"
            | "FTS_FUNCTION_NAME"
            | "FTS_FUNCTION_STEP"
            | "FTS_FUNCTION_CATEGORY"
            | "FTS_FUNCTION_MARKER"
            | "FTS_FUNCTION_COMPLEXITY"
            | "FTS_FUNCTION_EXECUTION_FREQUENCY"
            | "WHO_PERFORMS_ACTION"
            | "FTS_FUNCTION_ACTION_TYPE"
            | "FTS_FUNCTION_EFFECTIVENESS"
            | "FTS_COMPETENCY_CENTER"
            | "FTS_DTI"
            | "FTS_FUNCTION_RELATION_TYPE"
            | "TECHNOLOGICAL_SOLUTION"
            | "FEEDBACK_SOURCE"
            | "FEEDBACK_QUALITY_METRICS"
            | "RESPONSIBLE"
            | "FTS_METHODOLOGY_STATUS"
            | "ACTION_STATUS";
        };
      }[];
      feedbackAgreementHistory: {
        id: number;
        feedbackId: number;
        fromStatus: string | null;
        toStatus: string;
        comment: string | null;
        createdAt: string;
      }[];
    }[];
    actions?: {
      status: {
        id: number;
        code: string;
        name: string;
        category:
          | "FTS_CENTRALIZATION"
          | "FTS_FUNCTION_NAME"
          | "FTS_FUNCTION_STEP"
          | "FTS_FUNCTION_CATEGORY"
          | "FTS_FUNCTION_MARKER"
          | "FTS_FUNCTION_COMPLEXITY"
          | "FTS_FUNCTION_EXECUTION_FREQUENCY"
          | "WHO_PERFORMS_ACTION"
          | "FTS_FUNCTION_ACTION_TYPE"
          | "FTS_FUNCTION_EFFECTIVENESS"
          | "FTS_COMPETENCY_CENTER"
          | "FTS_DTI"
          | "FTS_FUNCTION_RELATION_TYPE"
          | "TECHNOLOGICAL_SOLUTION"
          | "FEEDBACK_SOURCE"
          | "FEEDBACK_QUALITY_METRICS"
          | "RESPONSIBLE"
          | "FTS_METHODOLOGY_STATUS"
          | "ACTION_STATUS";
      };
      description: string;
    }[];
    ftsFunctionStep: {
      id: number;
      code: string;
      name: string;
      category:
        | "FTS_CENTRALIZATION"
        | "FTS_FUNCTION_NAME"
        | "FTS_FUNCTION_STEP"
        | "FTS_FUNCTION_CATEGORY"
        | "FTS_FUNCTION_MARKER"
        | "FTS_FUNCTION_COMPLEXITY"
        | "FTS_FUNCTION_EXECUTION_FREQUENCY"
        | "WHO_PERFORMS_ACTION"
        | "FTS_FUNCTION_ACTION_TYPE"
        | "FTS_FUNCTION_EFFECTIVENESS"
        | "FTS_COMPETENCY_CENTER"
        | "FTS_DTI"
        | "FTS_FUNCTION_RELATION_TYPE"
        | "TECHNOLOGICAL_SOLUTION"
        | "FEEDBACK_SOURCE"
        | "FEEDBACK_QUALITY_METRICS"
        | "RESPONSIBLE"
        | "FTS_METHODOLOGY_STATUS"
        | "ACTION_STATUS";
    };
    ftsFunctionCategory: {
      id: number;
      code: string;
      name: string;
      category:
        | "FTS_CENTRALIZATION"
        | "FTS_FUNCTION_NAME"
        | "FTS_FUNCTION_STEP"
        | "FTS_FUNCTION_CATEGORY"
        | "FTS_FUNCTION_MARKER"
        | "FTS_FUNCTION_COMPLEXITY"
        | "FTS_FUNCTION_EXECUTION_FREQUENCY"
        | "WHO_PERFORMS_ACTION"
        | "FTS_FUNCTION_ACTION_TYPE"
        | "FTS_FUNCTION_EFFECTIVENESS"
        | "FTS_COMPETENCY_CENTER"
        | "FTS_DTI"
        | "FTS_FUNCTION_RELATION_TYPE"
        | "TECHNOLOGICAL_SOLUTION"
        | "FEEDBACK_SOURCE"
        | "FEEDBACK_QUALITY_METRICS"
        | "RESPONSIBLE"
        | "FTS_METHODOLOGY_STATUS"
        | "ACTION_STATUS";
    } | null;
    ftsFunctionComplexity: {
      id: number;
      code: string;
      name: string;
      category:
        | "FTS_CENTRALIZATION"
        | "FTS_FUNCTION_NAME"
        | "FTS_FUNCTION_STEP"
        | "FTS_FUNCTION_CATEGORY"
        | "FTS_FUNCTION_MARKER"
        | "FTS_FUNCTION_COMPLEXITY"
        | "FTS_FUNCTION_EXECUTION_FREQUENCY"
        | "WHO_PERFORMS_ACTION"
        | "FTS_FUNCTION_ACTION_TYPE"
        | "FTS_FUNCTION_EFFECTIVENESS"
        | "FTS_COMPETENCY_CENTER"
        | "FTS_DTI"
        | "FTS_FUNCTION_RELATION_TYPE"
        | "TECHNOLOGICAL_SOLUTION"
        | "FEEDBACK_SOURCE"
        | "FEEDBACK_QUALITY_METRICS"
        | "RESPONSIBLE"
        | "FTS_METHODOLOGY_STATUS"
        | "ACTION_STATUS";
    } | null;
    ftsFunctionExecutionFrequency: {
      id: number;
      code: string;
      name: string;
      category:
        | "FTS_CENTRALIZATION"
        | "FTS_FUNCTION_NAME"
        | "FTS_FUNCTION_STEP"
        | "FTS_FUNCTION_CATEGORY"
        | "FTS_FUNCTION_MARKER"
        | "FTS_FUNCTION_COMPLEXITY"
        | "FTS_FUNCTION_EXECUTION_FREQUENCY"
        | "WHO_PERFORMS_ACTION"
        | "FTS_FUNCTION_ACTION_TYPE"
        | "FTS_FUNCTION_EFFECTIVENESS"
        | "FTS_COMPETENCY_CENTER"
        | "FTS_DTI"
        | "FTS_FUNCTION_RELATION_TYPE"
        | "TECHNOLOGICAL_SOLUTION"
        | "FEEDBACK_SOURCE"
        | "FEEDBACK_QUALITY_METRICS"
        | "RESPONSIBLE"
        | "FTS_METHODOLOGY_STATUS"
        | "ACTION_STATUS";
    } | null;
    whoPerformsAction: {
      id: number;
      code: string;
      name: string;
      category:
        | "FTS_CENTRALIZATION"
        | "FTS_FUNCTION_NAME"
        | "FTS_FUNCTION_STEP"
        | "FTS_FUNCTION_CATEGORY"
        | "FTS_FUNCTION_MARKER"
        | "FTS_FUNCTION_COMPLEXITY"
        | "FTS_FUNCTION_EXECUTION_FREQUENCY"
        | "WHO_PERFORMS_ACTION"
        | "FTS_FUNCTION_ACTION_TYPE"
        | "FTS_FUNCTION_EFFECTIVENESS"
        | "FTS_COMPETENCY_CENTER"
        | "FTS_DTI"
        | "FTS_FUNCTION_RELATION_TYPE"
        | "TECHNOLOGICAL_SOLUTION"
        | "FEEDBACK_SOURCE"
        | "FEEDBACK_QUALITY_METRICS"
        | "RESPONSIBLE"
        | "FTS_METHODOLOGY_STATUS"
        | "ACTION_STATUS";
    } | null;
    ftsFunctionActionType: {
      id: number;
      code: string;
      name: string;
      category:
        | "FTS_CENTRALIZATION"
        | "FTS_FUNCTION_NAME"
        | "FTS_FUNCTION_STEP"
        | "FTS_FUNCTION_CATEGORY"
        | "FTS_FUNCTION_MARKER"
        | "FTS_FUNCTION_COMPLEXITY"
        | "FTS_FUNCTION_EXECUTION_FREQUENCY"
        | "WHO_PERFORMS_ACTION"
        | "FTS_FUNCTION_ACTION_TYPE"
        | "FTS_FUNCTION_EFFECTIVENESS"
        | "FTS_COMPETENCY_CENTER"
        | "FTS_DTI"
        | "FTS_FUNCTION_RELATION_TYPE"
        | "TECHNOLOGICAL_SOLUTION"
        | "FEEDBACK_SOURCE"
        | "FEEDBACK_QUALITY_METRICS"
        | "RESPONSIBLE"
        | "FTS_METHODOLOGY_STATUS"
        | "ACTION_STATUS";
    } | null;
    ftsFunctionEffectiveness: {
      id: number;
      code: string;
      name: string;
      category:
        | "FTS_CENTRALIZATION"
        | "FTS_FUNCTION_NAME"
        | "FTS_FUNCTION_STEP"
        | "FTS_FUNCTION_CATEGORY"
        | "FTS_FUNCTION_MARKER"
        | "FTS_FUNCTION_COMPLEXITY"
        | "FTS_FUNCTION_EXECUTION_FREQUENCY"
        | "WHO_PERFORMS_ACTION"
        | "FTS_FUNCTION_ACTION_TYPE"
        | "FTS_FUNCTION_EFFECTIVENESS"
        | "FTS_COMPETENCY_CENTER"
        | "FTS_DTI"
        | "FTS_FUNCTION_RELATION_TYPE"
        | "TECHNOLOGICAL_SOLUTION"
        | "FEEDBACK_SOURCE"
        | "FEEDBACK_QUALITY_METRICS"
        | "RESPONSIBLE"
        | "FTS_METHODOLOGY_STATUS"
        | "ACTION_STATUS";
    } | null;
    technologicalSolution: {
      id: number;
      code: string;
      name: string;
      category:
        | "FTS_CENTRALIZATION"
        | "FTS_FUNCTION_NAME"
        | "FTS_FUNCTION_STEP"
        | "FTS_FUNCTION_CATEGORY"
        | "FTS_FUNCTION_MARKER"
        | "FTS_FUNCTION_COMPLEXITY"
        | "FTS_FUNCTION_EXECUTION_FREQUENCY"
        | "WHO_PERFORMS_ACTION"
        | "FTS_FUNCTION_ACTION_TYPE"
        | "FTS_FUNCTION_EFFECTIVENESS"
        | "FTS_COMPETENCY_CENTER"
        | "FTS_DTI"
        | "FTS_FUNCTION_RELATION_TYPE"
        | "TECHNOLOGICAL_SOLUTION"
        | "FEEDBACK_SOURCE"
        | "FEEDBACK_QUALITY_METRICS"
        | "RESPONSIBLE"
        | "FTS_METHODOLOGY_STATUS"
        | "ACTION_STATUS";
    } | null;
    responsible: {
      id: number;
      code: string;
      name: string;
      category:
        | "FTS_CENTRALIZATION"
        | "FTS_FUNCTION_NAME"
        | "FTS_FUNCTION_STEP"
        | "FTS_FUNCTION_CATEGORY"
        | "FTS_FUNCTION_MARKER"
        | "FTS_FUNCTION_COMPLEXITY"
        | "FTS_FUNCTION_EXECUTION_FREQUENCY"
        | "WHO_PERFORMS_ACTION"
        | "FTS_FUNCTION_ACTION_TYPE"
        | "FTS_FUNCTION_EFFECTIVENESS"
        | "FTS_COMPETENCY_CENTER"
        | "FTS_DTI"
        | "FTS_FUNCTION_RELATION_TYPE"
        | "TECHNOLOGICAL_SOLUTION"
        | "FEEDBACK_SOURCE"
        | "FEEDBACK_QUALITY_METRICS"
        | "RESPONSIBLE"
        | "FTS_METHODOLOGY_STATUS"
        | "ACTION_STATUS";
    } | null;
    parents: {
      parentFtsFunctionId: number;
      childFtsFunctionId: number;
      relationTypeId: number;
      createdAt: string;
      relationType: {
        id: number;
        code: string;
        name: string;
        category:
          | "FTS_CENTRALIZATION"
          | "FTS_FUNCTION_NAME"
          | "FTS_FUNCTION_STEP"
          | "FTS_FUNCTION_CATEGORY"
          | "FTS_FUNCTION_MARKER"
          | "FTS_FUNCTION_COMPLEXITY"
          | "FTS_FUNCTION_EXECUTION_FREQUENCY"
          | "WHO_PERFORMS_ACTION"
          | "FTS_FUNCTION_ACTION_TYPE"
          | "FTS_FUNCTION_EFFECTIVENESS"
          | "FTS_COMPETENCY_CENTER"
          | "FTS_DTI"
          | "FTS_FUNCTION_RELATION_TYPE"
          | "TECHNOLOGICAL_SOLUTION"
          | "FEEDBACK_SOURCE"
          | "FEEDBACK_QUALITY_METRICS"
          | "RESPONSIBLE"
          | "FTS_METHODOLOGY_STATUS"
          | "ACTION_STATUS";
      };
    }[];
    children: {
      parentFtsFunctionId: number;
      childFtsFunctionId: number;
      relationTypeId: number;
      createdAt: string;
      relationType: {
        id: number;
        code: string;
        name: string;
        category:
          | "FTS_CENTRALIZATION"
          | "FTS_FUNCTION_NAME"
          | "FTS_FUNCTION_STEP"
          | "FTS_FUNCTION_CATEGORY"
          | "FTS_FUNCTION_MARKER"
          | "FTS_FUNCTION_COMPLEXITY"
          | "FTS_FUNCTION_EXECUTION_FREQUENCY"
          | "WHO_PERFORMS_ACTION"
          | "FTS_FUNCTION_ACTION_TYPE"
          | "FTS_FUNCTION_EFFECTIVENESS"
          | "FTS_COMPETENCY_CENTER"
          | "FTS_DTI"
          | "FTS_FUNCTION_RELATION_TYPE"
          | "TECHNOLOGICAL_SOLUTION"
          | "FEEDBACK_SOURCE"
          | "FEEDBACK_QUALITY_METRICS"
          | "RESPONSIBLE"
          | "FTS_METHODOLOGY_STATUS"
          | "ACTION_STATUS";
      };
    }[];
  }[];
};
export type UpdateFtsFunctionDto = {
  ftsCentralizationId?: string | number;
  ftsFunctionNameId?: string | number;
  competencyCenterId?: string | number;
  ftsFunctionMarkerId?: string | number;
  curatorCentralOfficeId?: string | number;
  managerInterregionalInspectionId?: string | number;
  departmentHeadCentralOfficeId?: string | number;
  departmentHeadInterregionalInspectionId?: string | number;
};
export type FtsFunctionDetailDetailedResponseDto = {
  id: number;
  ftsFunctionId: number;
  ftsFunctionStepId: number;
  ftsFunctionCategoryId: number | null;
  ftsFunctionComplexityId: number | null;
  ftsFunctionExecutionFrequencyId: number | null;
  whoPerformsActionId: number | null;
  ftsFunctionActionTypeId: number | null;
  ftsFunctionEffectivenessId: number | null;
  technologicalSolutionId?: ((string | null) | (number | null)) | null;
  responsibleId?: ((string | null) | (number | null)) | null;
  ftsFunctionDetails: string | null;
  basis: string | null;
  artifact: string | null;
  artifactUsage: string | null;
  purpose: string | null;
  number?: string | null;
  algorithm?: string | null;
  createdAt: string;
  updatedAt: string;
  isDeleted: boolean;
  deletedAt: string | null;
  feedbacks?: {
    id: number;
    ftsFunctionDetailId: number;
    feedbackQualityMetricsId: number | null;
    ftsMethodologyStatusId: number | null;
    problemDescription: string | null;
    initiatorRequisites: string | null;
    initiatorAcceptance: string | null;
    deadline: string | null;
    isAccepted: boolean | null;
    ftsMethodologyStatus: {
      id: number;
      code: string;
      name: string;
      category:
        | "FTS_CENTRALIZATION"
        | "FTS_FUNCTION_NAME"
        | "FTS_FUNCTION_STEP"
        | "FTS_FUNCTION_CATEGORY"
        | "FTS_FUNCTION_MARKER"
        | "FTS_FUNCTION_COMPLEXITY"
        | "FTS_FUNCTION_EXECUTION_FREQUENCY"
        | "WHO_PERFORMS_ACTION"
        | "FTS_FUNCTION_ACTION_TYPE"
        | "FTS_FUNCTION_EFFECTIVENESS"
        | "FTS_COMPETENCY_CENTER"
        | "FTS_DTI"
        | "FTS_FUNCTION_RELATION_TYPE"
        | "TECHNOLOGICAL_SOLUTION"
        | "FEEDBACK_SOURCE"
        | "FEEDBACK_QUALITY_METRICS"
        | "RESPONSIBLE"
        | "FTS_METHODOLOGY_STATUS"
        | "ACTION_STATUS";
    } | null;
    feedbackQualityMetrics: {
      id: number;
      code: string;
      name: string;
      category:
        | "FTS_CENTRALIZATION"
        | "FTS_FUNCTION_NAME"
        | "FTS_FUNCTION_STEP"
        | "FTS_FUNCTION_CATEGORY"
        | "FTS_FUNCTION_MARKER"
        | "FTS_FUNCTION_COMPLEXITY"
        | "FTS_FUNCTION_EXECUTION_FREQUENCY"
        | "WHO_PERFORMS_ACTION"
        | "FTS_FUNCTION_ACTION_TYPE"
        | "FTS_FUNCTION_EFFECTIVENESS"
        | "FTS_COMPETENCY_CENTER"
        | "FTS_DTI"
        | "FTS_FUNCTION_RELATION_TYPE"
        | "TECHNOLOGICAL_SOLUTION"
        | "FEEDBACK_SOURCE"
        | "FEEDBACK_QUALITY_METRICS"
        | "RESPONSIBLE"
        | "FTS_METHODOLOGY_STATUS"
        | "ACTION_STATUS";
    } | null;
    feedbackSources: {
      feedbackSource: {
        id: number;
        code: string;
        name: string;
        category:
          | "FTS_CENTRALIZATION"
          | "FTS_FUNCTION_NAME"
          | "FTS_FUNCTION_STEP"
          | "FTS_FUNCTION_CATEGORY"
          | "FTS_FUNCTION_MARKER"
          | "FTS_FUNCTION_COMPLEXITY"
          | "FTS_FUNCTION_EXECUTION_FREQUENCY"
          | "WHO_PERFORMS_ACTION"
          | "FTS_FUNCTION_ACTION_TYPE"
          | "FTS_FUNCTION_EFFECTIVENESS"
          | "FTS_COMPETENCY_CENTER"
          | "FTS_DTI"
          | "FTS_FUNCTION_RELATION_TYPE"
          | "TECHNOLOGICAL_SOLUTION"
          | "FEEDBACK_SOURCE"
          | "FEEDBACK_QUALITY_METRICS"
          | "RESPONSIBLE"
          | "FTS_METHODOLOGY_STATUS"
          | "ACTION_STATUS";
      };
    }[];
    feedbackAgreementHistory: {
      id: number;
      feedbackId: number;
      fromStatus: string | null;
      toStatus: string;
      comment: string | null;
      createdAt: string;
    }[];
  }[];
  actions?: {
    status: {
      id: number;
      code: string;
      name: string;
      category:
        | "FTS_CENTRALIZATION"
        | "FTS_FUNCTION_NAME"
        | "FTS_FUNCTION_STEP"
        | "FTS_FUNCTION_CATEGORY"
        | "FTS_FUNCTION_MARKER"
        | "FTS_FUNCTION_COMPLEXITY"
        | "FTS_FUNCTION_EXECUTION_FREQUENCY"
        | "WHO_PERFORMS_ACTION"
        | "FTS_FUNCTION_ACTION_TYPE"
        | "FTS_FUNCTION_EFFECTIVENESS"
        | "FTS_COMPETENCY_CENTER"
        | "FTS_DTI"
        | "FTS_FUNCTION_RELATION_TYPE"
        | "TECHNOLOGICAL_SOLUTION"
        | "FEEDBACK_SOURCE"
        | "FEEDBACK_QUALITY_METRICS"
        | "RESPONSIBLE"
        | "FTS_METHODOLOGY_STATUS"
        | "ACTION_STATUS";
    };
    description: string;
  }[];
  ftsFunctionStep: {
    id: number;
    code: string;
    name: string;
    category:
      | "FTS_CENTRALIZATION"
      | "FTS_FUNCTION_NAME"
      | "FTS_FUNCTION_STEP"
      | "FTS_FUNCTION_CATEGORY"
      | "FTS_FUNCTION_MARKER"
      | "FTS_FUNCTION_COMPLEXITY"
      | "FTS_FUNCTION_EXECUTION_FREQUENCY"
      | "WHO_PERFORMS_ACTION"
      | "FTS_FUNCTION_ACTION_TYPE"
      | "FTS_FUNCTION_EFFECTIVENESS"
      | "FTS_COMPETENCY_CENTER"
      | "FTS_DTI"
      | "FTS_FUNCTION_RELATION_TYPE"
      | "TECHNOLOGICAL_SOLUTION"
      | "FEEDBACK_SOURCE"
      | "FEEDBACK_QUALITY_METRICS"
      | "RESPONSIBLE"
      | "FTS_METHODOLOGY_STATUS"
      | "ACTION_STATUS";
  };
  ftsFunctionCategory: {
    id: number;
    code: string;
    name: string;
    category:
      | "FTS_CENTRALIZATION"
      | "FTS_FUNCTION_NAME"
      | "FTS_FUNCTION_STEP"
      | "FTS_FUNCTION_CATEGORY"
      | "FTS_FUNCTION_MARKER"
      | "FTS_FUNCTION_COMPLEXITY"
      | "FTS_FUNCTION_EXECUTION_FREQUENCY"
      | "WHO_PERFORMS_ACTION"
      | "FTS_FUNCTION_ACTION_TYPE"
      | "FTS_FUNCTION_EFFECTIVENESS"
      | "FTS_COMPETENCY_CENTER"
      | "FTS_DTI"
      | "FTS_FUNCTION_RELATION_TYPE"
      | "TECHNOLOGICAL_SOLUTION"
      | "FEEDBACK_SOURCE"
      | "FEEDBACK_QUALITY_METRICS"
      | "RESPONSIBLE"
      | "FTS_METHODOLOGY_STATUS"
      | "ACTION_STATUS";
  } | null;
  ftsFunctionComplexity: {
    id: number;
    code: string;
    name: string;
    category:
      | "FTS_CENTRALIZATION"
      | "FTS_FUNCTION_NAME"
      | "FTS_FUNCTION_STEP"
      | "FTS_FUNCTION_CATEGORY"
      | "FTS_FUNCTION_MARKER"
      | "FTS_FUNCTION_COMPLEXITY"
      | "FTS_FUNCTION_EXECUTION_FREQUENCY"
      | "WHO_PERFORMS_ACTION"
      | "FTS_FUNCTION_ACTION_TYPE"
      | "FTS_FUNCTION_EFFECTIVENESS"
      | "FTS_COMPETENCY_CENTER"
      | "FTS_DTI"
      | "FTS_FUNCTION_RELATION_TYPE"
      | "TECHNOLOGICAL_SOLUTION"
      | "FEEDBACK_SOURCE"
      | "FEEDBACK_QUALITY_METRICS"
      | "RESPONSIBLE"
      | "FTS_METHODOLOGY_STATUS"
      | "ACTION_STATUS";
  } | null;
  ftsFunctionExecutionFrequency: {
    id: number;
    code: string;
    name: string;
    category:
      | "FTS_CENTRALIZATION"
      | "FTS_FUNCTION_NAME"
      | "FTS_FUNCTION_STEP"
      | "FTS_FUNCTION_CATEGORY"
      | "FTS_FUNCTION_MARKER"
      | "FTS_FUNCTION_COMPLEXITY"
      | "FTS_FUNCTION_EXECUTION_FREQUENCY"
      | "WHO_PERFORMS_ACTION"
      | "FTS_FUNCTION_ACTION_TYPE"
      | "FTS_FUNCTION_EFFECTIVENESS"
      | "FTS_COMPETENCY_CENTER"
      | "FTS_DTI"
      | "FTS_FUNCTION_RELATION_TYPE"
      | "TECHNOLOGICAL_SOLUTION"
      | "FEEDBACK_SOURCE"
      | "FEEDBACK_QUALITY_METRICS"
      | "RESPONSIBLE"
      | "FTS_METHODOLOGY_STATUS"
      | "ACTION_STATUS";
  } | null;
  whoPerformsAction: {
    id: number;
    code: string;
    name: string;
    category:
      | "FTS_CENTRALIZATION"
      | "FTS_FUNCTION_NAME"
      | "FTS_FUNCTION_STEP"
      | "FTS_FUNCTION_CATEGORY"
      | "FTS_FUNCTION_MARKER"
      | "FTS_FUNCTION_COMPLEXITY"
      | "FTS_FUNCTION_EXECUTION_FREQUENCY"
      | "WHO_PERFORMS_ACTION"
      | "FTS_FUNCTION_ACTION_TYPE"
      | "FTS_FUNCTION_EFFECTIVENESS"
      | "FTS_COMPETENCY_CENTER"
      | "FTS_DTI"
      | "FTS_FUNCTION_RELATION_TYPE"
      | "TECHNOLOGICAL_SOLUTION"
      | "FEEDBACK_SOURCE"
      | "FEEDBACK_QUALITY_METRICS"
      | "RESPONSIBLE"
      | "FTS_METHODOLOGY_STATUS"
      | "ACTION_STATUS";
  } | null;
  ftsFunctionActionType: {
    id: number;
    code: string;
    name: string;
    category:
      | "FTS_CENTRALIZATION"
      | "FTS_FUNCTION_NAME"
      | "FTS_FUNCTION_STEP"
      | "FTS_FUNCTION_CATEGORY"
      | "FTS_FUNCTION_MARKER"
      | "FTS_FUNCTION_COMPLEXITY"
      | "FTS_FUNCTION_EXECUTION_FREQUENCY"
      | "WHO_PERFORMS_ACTION"
      | "FTS_FUNCTION_ACTION_TYPE"
      | "FTS_FUNCTION_EFFECTIVENESS"
      | "FTS_COMPETENCY_CENTER"
      | "FTS_DTI"
      | "FTS_FUNCTION_RELATION_TYPE"
      | "TECHNOLOGICAL_SOLUTION"
      | "FEEDBACK_SOURCE"
      | "FEEDBACK_QUALITY_METRICS"
      | "RESPONSIBLE"
      | "FTS_METHODOLOGY_STATUS"
      | "ACTION_STATUS";
  } | null;
  ftsFunctionEffectiveness: {
    id: number;
    code: string;
    name: string;
    category:
      | "FTS_CENTRALIZATION"
      | "FTS_FUNCTION_NAME"
      | "FTS_FUNCTION_STEP"
      | "FTS_FUNCTION_CATEGORY"
      | "FTS_FUNCTION_MARKER"
      | "FTS_FUNCTION_COMPLEXITY"
      | "FTS_FUNCTION_EXECUTION_FREQUENCY"
      | "WHO_PERFORMS_ACTION"
      | "FTS_FUNCTION_ACTION_TYPE"
      | "FTS_FUNCTION_EFFECTIVENESS"
      | "FTS_COMPETENCY_CENTER"
      | "FTS_DTI"
      | "FTS_FUNCTION_RELATION_TYPE"
      | "TECHNOLOGICAL_SOLUTION"
      | "FEEDBACK_SOURCE"
      | "FEEDBACK_QUALITY_METRICS"
      | "RESPONSIBLE"
      | "FTS_METHODOLOGY_STATUS"
      | "ACTION_STATUS";
  } | null;
  technologicalSolution: {
    id: number;
    code: string;
    name: string;
    category:
      | "FTS_CENTRALIZATION"
      | "FTS_FUNCTION_NAME"
      | "FTS_FUNCTION_STEP"
      | "FTS_FUNCTION_CATEGORY"
      | "FTS_FUNCTION_MARKER"
      | "FTS_FUNCTION_COMPLEXITY"
      | "FTS_FUNCTION_EXECUTION_FREQUENCY"
      | "WHO_PERFORMS_ACTION"
      | "FTS_FUNCTION_ACTION_TYPE"
      | "FTS_FUNCTION_EFFECTIVENESS"
      | "FTS_COMPETENCY_CENTER"
      | "FTS_DTI"
      | "FTS_FUNCTION_RELATION_TYPE"
      | "TECHNOLOGICAL_SOLUTION"
      | "FEEDBACK_SOURCE"
      | "FEEDBACK_QUALITY_METRICS"
      | "RESPONSIBLE"
      | "FTS_METHODOLOGY_STATUS"
      | "ACTION_STATUS";
  } | null;
  responsible: {
    id: number;
    code: string;
    name: string;
    category:
      | "FTS_CENTRALIZATION"
      | "FTS_FUNCTION_NAME"
      | "FTS_FUNCTION_STEP"
      | "FTS_FUNCTION_CATEGORY"
      | "FTS_FUNCTION_MARKER"
      | "FTS_FUNCTION_COMPLEXITY"
      | "FTS_FUNCTION_EXECUTION_FREQUENCY"
      | "WHO_PERFORMS_ACTION"
      | "FTS_FUNCTION_ACTION_TYPE"
      | "FTS_FUNCTION_EFFECTIVENESS"
      | "FTS_COMPETENCY_CENTER"
      | "FTS_DTI"
      | "FTS_FUNCTION_RELATION_TYPE"
      | "TECHNOLOGICAL_SOLUTION"
      | "FEEDBACK_SOURCE"
      | "FEEDBACK_QUALITY_METRICS"
      | "RESPONSIBLE"
      | "FTS_METHODOLOGY_STATUS"
      | "ACTION_STATUS";
  } | null;
};
export type CreateFtsFunctionDetailDto = {
  ftsFunctionStepId: string | number;
  ftsFunctionCategoryId?: ((string | null) | (number | null)) | null;
  ftsFunctionComplexityId?: ((string | null) | (number | null)) | null;
  ftsFunctionExecutionFrequencyId?: ((string | null) | (number | null)) | null;
  whoPerformsActionId?: ((string | null) | (number | null)) | null;
  ftsFunctionActionTypeId?: ((string | null) | (number | null)) | null;
  ftsFunctionEffectivenessId?: ((string | null) | (number | null)) | null;
  technologicalSolutionId?: ((string | null) | (number | null)) | null;
  responsibleId?: ((string | null) | (number | null)) | null;
  ftsFunctionDetails?: string | null;
  basis?: string | null;
  artifact?: string | null;
  artifactUsage?: string | null;
  purpose?: string | null;
  number?: string | null;
  algorithm?: string | null;
};
export type UpdateFtsFunctionDetailDto = {
  ftsFunctionStepId?: string | number;
  ftsFunctionCategoryId?: ((string | null) | (number | null)) | null;
  ftsFunctionComplexityId?: ((string | null) | (number | null)) | null;
  ftsFunctionExecutionFrequencyId?: ((string | null) | (number | null)) | null;
  whoPerformsActionId?: ((string | null) | (number | null)) | null;
  ftsFunctionActionTypeId?: ((string | null) | (number | null)) | null;
  ftsFunctionEffectivenessId?: ((string | null) | (number | null)) | null;
  technologicalSolutionId?: ((string | null) | (number | null)) | null;
  responsibleId?: ((string | null) | (number | null)) | null;
  ftsFunctionDetails?: string | null;
  basis?: string | null;
  artifact?: string | null;
  artifactUsage?: string | null;
  purpose?: string | null;
  number?: string | null;
  algorithm?: string | null;
};
export type FeedbackResponseDto = {
  id: number;
  ftsFunctionDetailId: number;
  feedbackQualityMetricsId: number | null;
  ftsMethodologyStatusId: number | null;
  problemDescription: string | null;
  initiatorRequisites: string | null;
  initiatorAcceptance: string | null;
  deadline: string | null;
  isAccepted: boolean | null;
  ftsMethodologyStatus: {
    id: number;
    code: string;
    name: string;
    category:
      | "FTS_CENTRALIZATION"
      | "FTS_FUNCTION_NAME"
      | "FTS_FUNCTION_STEP"
      | "FTS_FUNCTION_CATEGORY"
      | "FTS_FUNCTION_MARKER"
      | "FTS_FUNCTION_COMPLEXITY"
      | "FTS_FUNCTION_EXECUTION_FREQUENCY"
      | "WHO_PERFORMS_ACTION"
      | "FTS_FUNCTION_ACTION_TYPE"
      | "FTS_FUNCTION_EFFECTIVENESS"
      | "FTS_COMPETENCY_CENTER"
      | "FTS_DTI"
      | "FTS_FUNCTION_RELATION_TYPE"
      | "TECHNOLOGICAL_SOLUTION"
      | "FEEDBACK_SOURCE"
      | "FEEDBACK_QUALITY_METRICS"
      | "RESPONSIBLE"
      | "FTS_METHODOLOGY_STATUS"
      | "ACTION_STATUS";
  } | null;
  feedbackQualityMetrics: {
    id: number;
    code: string;
    name: string;
    category:
      | "FTS_CENTRALIZATION"
      | "FTS_FUNCTION_NAME"
      | "FTS_FUNCTION_STEP"
      | "FTS_FUNCTION_CATEGORY"
      | "FTS_FUNCTION_MARKER"
      | "FTS_FUNCTION_COMPLEXITY"
      | "FTS_FUNCTION_EXECUTION_FREQUENCY"
      | "WHO_PERFORMS_ACTION"
      | "FTS_FUNCTION_ACTION_TYPE"
      | "FTS_FUNCTION_EFFECTIVENESS"
      | "FTS_COMPETENCY_CENTER"
      | "FTS_DTI"
      | "FTS_FUNCTION_RELATION_TYPE"
      | "TECHNOLOGICAL_SOLUTION"
      | "FEEDBACK_SOURCE"
      | "FEEDBACK_QUALITY_METRICS"
      | "RESPONSIBLE"
      | "FTS_METHODOLOGY_STATUS"
      | "ACTION_STATUS";
  } | null;
  feedbackSources: {
    feedbackSource: {
      id: number;
      code: string;
      name: string;
      category:
        | "FTS_CENTRALIZATION"
        | "FTS_FUNCTION_NAME"
        | "FTS_FUNCTION_STEP"
        | "FTS_FUNCTION_CATEGORY"
        | "FTS_FUNCTION_MARKER"
        | "FTS_FUNCTION_COMPLEXITY"
        | "FTS_FUNCTION_EXECUTION_FREQUENCY"
        | "WHO_PERFORMS_ACTION"
        | "FTS_FUNCTION_ACTION_TYPE"
        | "FTS_FUNCTION_EFFECTIVENESS"
        | "FTS_COMPETENCY_CENTER"
        | "FTS_DTI"
        | "FTS_FUNCTION_RELATION_TYPE"
        | "TECHNOLOGICAL_SOLUTION"
        | "FEEDBACK_SOURCE"
        | "FEEDBACK_QUALITY_METRICS"
        | "RESPONSIBLE"
        | "FTS_METHODOLOGY_STATUS"
        | "ACTION_STATUS";
    };
  }[];
  feedbackAgreementHistory: {
    id: number;
    feedbackId: number;
    fromStatus: string | null;
    toStatus: string;
    comment: string | null;
    createdAt: string;
  }[];
};
export type CreateFeedbackDto = {
  feedbackQualityMetricsId?: ((string | null) | (number | null)) | null;
  ftsMethodologyStatusId?: ((string | null) | (number | null)) | null;
  feedbackSourceIds?: (string | number)[];
  problemDescription?: string | null;
  initiatorRequisites?: string | null;
  initiatorAcceptance?: string | null;
  deadline?: ((string | null) | (string | null)) | null;
};
export type UpdateFeedbackDto = {
  feedbackQualityMetricsId?: ((string | null) | (number | null)) | null;
  ftsMethodologyStatusId?: ((string | null) | (number | null)) | null;
  feedbackSourceIds?: (string | number)[];
  problemDescription?: string | null;
  initiatorRequisites?: string | null;
  initiatorAcceptance?: string | null;
  deadline?: ((string | null) | (string | null)) | null;
};
export type AcceptFeedbackDto = {
  isAccepted: boolean;
  rejectComment?: string;
};
export type ActionResponseDto = {
  status: {
    id: number;
    code: string;
    name: string;
    category:
      | "FTS_CENTRALIZATION"
      | "FTS_FUNCTION_NAME"
      | "FTS_FUNCTION_STEP"
      | "FTS_FUNCTION_CATEGORY"
      | "FTS_FUNCTION_MARKER"
      | "FTS_FUNCTION_COMPLEXITY"
      | "FTS_FUNCTION_EXECUTION_FREQUENCY"
      | "WHO_PERFORMS_ACTION"
      | "FTS_FUNCTION_ACTION_TYPE"
      | "FTS_FUNCTION_EFFECTIVENESS"
      | "FTS_COMPETENCY_CENTER"
      | "FTS_DTI"
      | "FTS_FUNCTION_RELATION_TYPE"
      | "TECHNOLOGICAL_SOLUTION"
      | "FEEDBACK_SOURCE"
      | "FEEDBACK_QUALITY_METRICS"
      | "RESPONSIBLE"
      | "FTS_METHODOLOGY_STATUS"
      | "ACTION_STATUS";
  };
  description: string;
};
export type CreateActionDto = {
  statusId: string | number;
  description: string;
};
export type UpdateActionDto = {
  statusId?: string | number;
  description?: string;
};
export type FtsFunctionTreeResponseDto = {
  parentFtsFunctionId: number;
  childFtsFunctionId: number;
  relationTypeId: number;
  createdAt: string;
};
export type CreateFtsFunctionTreeDto = {
  parentFtsFunctionId: string | number;
  childFtsFunctionId: string | number;
  relationTypeId: string | number;
};
export type BatchAttachDtisRequestDto = {
  dtiIds: number[];
};
export type FtsFunctionToDtiResponseDto = {
  ftsFunctionId: number;
  dtiId: number;
  createdAt: string;
};
export const {
  useConstantControllerGetTypesV1Query,
  useConstantControllerCreateTypeV1Mutation,
  useConstantControllerUpdateTypeV1Mutation,
  useConstantControllerDeleteTypeV1Mutation,
  useConstantControllerGetUsersV1Query,
  useConstantControllerCreateUserV1Mutation,
  useConstantControllerUpdateUserV1Mutation,
  useConstantControllerDeleteUserV1Mutation,
  useFtsFunctionControllerListV1Query,
  useFtsFunctionControllerCreateV1Mutation,
  useFtsFunctionControllerGetByIdV1Query,
  useFtsFunctionControllerUpdateV1Mutation,
  useFtsFunctionControllerSoftDeleteV1Mutation,
  useFtsFunctionControllerCreateDetailV1Mutation,
  useFtsFunctionControllerUpdateDetailV1Mutation,
  useFtsFunctionControllerSoftDeleteDetailV1Mutation,
  useFtsFunctionControllerCreateFeedbackV1Mutation,
  useFtsFunctionControllerUpdateFeedbackV1Mutation,
  useFtsFunctionControllerDeleteFeedbackV1Mutation,
  useFtsFunctionControllerAcceptFeedbackV1Mutation,
  useFtsFunctionControllerCreatActionV1Mutation,
  useFtsFunctionControllerUpdateActionV1Mutation,
  useFtsFunctionControllerDeleteActionV1Mutation,
  useFtsFunctionControllerCreateTreeEdgeV1Mutation,
  useFtsFunctionControllerDeleteTreeEdgeV1Mutation,
  useFtsFunctionControllerBatchAttachDtisV1V1Mutation,
  useFtsFunctionControllerAttachDtiV1Mutation,
  useFtsFunctionControllerDetachDtiV1Mutation,
  useFtsFunctionControllerGetDownloadV1Query,
  useHealthControllerCheckV1Query,
} = injectedRtkApi;
