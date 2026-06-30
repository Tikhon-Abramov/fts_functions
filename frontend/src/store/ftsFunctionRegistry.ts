import { baseApi as api } from "./baseApi";
export const addTagTypes = [
  "Auth",
  "Constant",
  "FtsFunction",
  "FtsFunctionDetail",
  "Feedback",
  "Action",
  "File",
  "Export",
] as const;
const injectedRtkApi = api
  .enhanceEndpoints({
    addTagTypes,
  })
  .injectEndpoints({
    endpoints: (build) => ({
      authControllerLoginV1: build.mutation<
        AuthControllerLoginV1ApiResponse,
        AuthControllerLoginV1ApiArg
      >({
        query: (queryArg) => ({
          url: `/v1/login`,
          method: "POST",
          body: queryArg.loginDto,
        }),
        invalidatesTags: ["Auth"],
      }),
      authControllerLogoutV1: build.mutation<
        AuthControllerLogoutV1ApiResponse,
        AuthControllerLogoutV1ApiArg
      >({
        query: () => ({ url: `/v1/logout`, method: "POST" }),
        invalidatesTags: ["Auth"],
      }),
      authControllerRefreshV1: build.mutation<
        AuthControllerRefreshV1ApiResponse,
        AuthControllerRefreshV1ApiArg
      >({
        query: () => ({ url: `/v1/token`, method: "POST" }),
        invalidatesTags: ["Auth"],
      }),
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
      ftsFunctionControllerGetAllFtsFunctionsV1: build.query<
        FtsFunctionControllerGetAllFtsFunctionsV1ApiResponse,
        FtsFunctionControllerGetAllFtsFunctionsV1ApiArg
      >({
        query: (queryArg) => ({
          url: `/v1/fts-functions`,
          params: {
            filter: queryArg.filter,
            sort: queryArg.sort,
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
      ftsFunctionControllerGetFtsFunctionByIdV1: build.query<
        FtsFunctionControllerGetFtsFunctionByIdV1ApiResponse,
        FtsFunctionControllerGetFtsFunctionByIdV1ApiArg
      >({
        query: (queryArg) => ({ url: `/v1/fts-functions/info/${queryArg.id}` }),
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
      ftsFunctionControllerDeleteV1: build.mutation<
        FtsFunctionControllerDeleteV1ApiResponse,
        FtsFunctionControllerDeleteV1ApiArg
      >({
        query: (queryArg) => ({
          url: `/v1/fts-functions/delete/${queryArg.id}`,
          method: "PATCH",
        }),
        invalidatesTags: ["FtsFunction"],
      }),
      ftsFunctionDetailControllerGetAllFtsFunctionDetailsV1: build.query<
        FtsFunctionDetailControllerGetAllFtsFunctionDetailsV1ApiResponse,
        FtsFunctionDetailControllerGetAllFtsFunctionDetailsV1ApiArg
      >({
        query: (queryArg) => ({
          url: `/v1/fts-function-details/${queryArg.ftsFunctionId}`,
        }),
        providesTags: ["FtsFunctionDetail"],
      }),
      ftsFunctionDetailControllerGetFtsFunctionDetailByIdV1: build.query<
        FtsFunctionDetailControllerGetFtsFunctionDetailByIdV1ApiResponse,
        FtsFunctionDetailControllerGetFtsFunctionDetailByIdV1ApiArg
      >({
        query: (queryArg) => ({
          url: `/v1/fts-function-details/info/${queryArg.id}`,
        }),
        providesTags: ["FtsFunctionDetail"],
      }),
      ftsFunctionDetailControllerCreateV1: build.mutation<
        FtsFunctionDetailControllerCreateV1ApiResponse,
        FtsFunctionDetailControllerCreateV1ApiArg
      >({
        query: (queryArg) => ({
          url: `/v1/fts-function-details`,
          method: "POST",
          body: queryArg.createFtsFunctionDetailDto,
        }),
        invalidatesTags: ["FtsFunctionDetail"],
      }),
      ftsFunctionDetailControllerUpdateV1: build.mutation<
        FtsFunctionDetailControllerUpdateV1ApiResponse,
        FtsFunctionDetailControllerUpdateV1ApiArg
      >({
        query: (queryArg) => ({
          url: `/v1/fts-function-details/${queryArg.id}`,
          method: "PATCH",
          body: queryArg.updateFtsFunctionDetailDto,
        }),
        invalidatesTags: ["FtsFunctionDetail"],
      }),
      ftsFunctionDetailControllerDeleteV1: build.mutation<
        FtsFunctionDetailControllerDeleteV1ApiResponse,
        FtsFunctionDetailControllerDeleteV1ApiArg
      >({
        query: (queryArg) => ({
          url: `/v1/fts-function-details/delete/${queryArg.id}`,
          method: "PATCH",
        }),
        invalidatesTags: ["FtsFunctionDetail"],
      }),
      ftsFunctionDetailControllerReorderFtsFunctionDetailsV1: build.mutation<
        FtsFunctionDetailControllerReorderFtsFunctionDetailsV1ApiResponse,
        FtsFunctionDetailControllerReorderFtsFunctionDetailsV1ApiArg
      >({
        query: (queryArg) => ({
          url: `/v1/fts-function-details/reorder/${queryArg.ftsFunctionId}`,
          method: "PATCH",
          body: queryArg.reorderFtsFunctionDetailDto,
        }),
        invalidatesTags: ["FtsFunctionDetail"],
      }),
      ftsFunctionDetailControllerGetRelationsV1: build.query<
        FtsFunctionDetailControllerGetRelationsV1ApiResponse,
        FtsFunctionDetailControllerGetRelationsV1ApiArg
      >({
        query: (queryArg) => ({
          url: `/v1/fts-function-details/relations`,
          params: {
            type: queryArg["type"],
            ftsFunctionId: queryArg.ftsFunctionId,
            ftsFunctionDetailId: queryArg.ftsFunctionDetailId,
            ftsFunctionStepId: queryArg.ftsFunctionStepId,
            relationTypeId: queryArg.relationTypeId,
            search: queryArg.search,
          },
        }),
        providesTags: ["FtsFunctionDetail"],
      }),
      ftsFunctionDetailControllerCreateRelationV1: build.mutation<
        FtsFunctionDetailControllerCreateRelationV1ApiResponse,
        FtsFunctionDetailControllerCreateRelationV1ApiArg
      >({
        query: (queryArg) => ({
          url: `/v1/fts-function-details/relations`,
          method: "POST",
          body: queryArg.createFtsFunctionDetailsRelationDto,
        }),
        invalidatesTags: ["FtsFunctionDetail"],
      }),
      ftsFunctionDetailControllerDeleteRelationV1: build.mutation<
        FtsFunctionDetailControllerDeleteRelationV1ApiResponse,
        FtsFunctionDetailControllerDeleteRelationV1ApiArg
      >({
        query: (queryArg) => ({
          url: `/v1/fts-function-details/relations`,
          method: "DELETE",
          params: {
            parentFtsFunctionId: queryArg.parentFtsFunctionId,
            childFtsFunctionId: queryArg.childFtsFunctionId,
          },
        }),
        invalidatesTags: ["FtsFunctionDetail"],
      }),
      feedbackControllerGetAllFeedbacksV1: build.query<
        FeedbackControllerGetAllFeedbacksV1ApiResponse,
        FeedbackControllerGetAllFeedbacksV1ApiArg
      >({
        query: (queryArg) => ({
          url: `/v1/feedbacks/${queryArg.ftsFunctionDetailId}`,
        }),
        providesTags: ["Feedback"],
      }),
      feedbackControllerGetFeedbackByIdV1: build.query<
        FeedbackControllerGetFeedbackByIdV1ApiResponse,
        FeedbackControllerGetFeedbackByIdV1ApiArg
      >({
        query: (queryArg) => ({ url: `/v1/feedbacks/info/${queryArg.id}` }),
        providesTags: ["Feedback"],
      }),
      feedbackControllerCreateV1: build.mutation<
        FeedbackControllerCreateV1ApiResponse,
        FeedbackControllerCreateV1ApiArg
      >({
        query: (queryArg) => ({
          url: `/v1/feedbacks`,
          method: "POST",
          body: queryArg.createFeedbackDto,
        }),
        invalidatesTags: ["Feedback", "FtsFunctionDetail"],
      }),
      feedbackControllerUpdateV1: build.mutation<
        FeedbackControllerUpdateV1ApiResponse,
        FeedbackControllerUpdateV1ApiArg
      >({
        query: (queryArg) => ({
          url: `/v1/feedbacks/${queryArg.id}`,
          method: "PATCH",
          body: queryArg.updateFeedbackDto,
        }),
        invalidatesTags: ["Feedback", "FtsFunctionDetail"],
      }),
      feedbackControllerDeleteV1: build.mutation<
        FeedbackControllerDeleteV1ApiResponse,
        FeedbackControllerDeleteV1ApiArg
      >({
        query: (queryArg) => ({
          url: `/v1/feedbacks/delete/${queryArg.id}`,
          method: "PATCH",
        }),
        invalidatesTags: ["Feedback", "FtsFunctionDetail"],
      }),
      feedbackControllerAcceptV1: build.mutation<
        FeedbackControllerAcceptV1ApiResponse,
        FeedbackControllerAcceptV1ApiArg
      >({
        query: (queryArg) => ({
          url: `/v1/feedbacks/accept/${queryArg.id}`,
          method: "PATCH",
          body: queryArg.acceptFeedbackDto,
        }),
        invalidatesTags: ["Feedback", "FtsFunctionDetail"],
      }),
      feedbackControllerReorderFeedbacksV1: build.mutation<
        FeedbackControllerReorderFeedbacksV1ApiResponse,
        FeedbackControllerReorderFeedbacksV1ApiArg
      >({
        query: (queryArg) => ({
          url: `/v1/feedbacks/reorder/${queryArg.ftsFunctionDetailId}`,
          method: "PATCH",
          body: queryArg.reorderFeedbacksDto,
        }),
        invalidatesTags: ["Feedback"],
      }),
      actionControllerGetGeneralInfoActionsV1: build.query<
        ActionControllerGetGeneralInfoActionsV1ApiResponse,
        ActionControllerGetGeneralInfoActionsV1ApiArg
      >({
        query: (queryArg) => ({
          url: `/v1/actions/action-info/${queryArg.ftsFunctionDetailId}`,
        }),
        providesTags: ["Action"],
      }),
      actionControllerUpdateGeneralInfoActionsV1: build.mutation<
        ActionControllerUpdateGeneralInfoActionsV1ApiResponse,
        ActionControllerUpdateGeneralInfoActionsV1ApiArg
      >({
        query: (queryArg) => ({
          url: `/v1/actions/action-info/${queryArg.ftsFunctionDetailId}`,
          method: "PATCH",
          body: queryArg.updateGeneralInfoActionsDto,
        }),
        invalidatesTags: ["Action"],
      }),
      actionControllerGetAllActionsV1: build.query<
        ActionControllerGetAllActionsV1ApiResponse,
        ActionControllerGetAllActionsV1ApiArg
      >({
        query: (queryArg) => ({
          url: `/v1/actions/${queryArg.ftsFunctionDetailId}`,
        }),
        providesTags: ["Action"],
      }),
      actionControllerGetActionByIdV1: build.query<
        ActionControllerGetActionByIdV1ApiResponse,
        ActionControllerGetActionByIdV1ApiArg
      >({
        query: (queryArg) => ({ url: `/v1/actions/info/${queryArg.id}` }),
        providesTags: ["Action"],
      }),
      actionControllerCreateV1: build.mutation<
        ActionControllerCreateV1ApiResponse,
        ActionControllerCreateV1ApiArg
      >({
        query: (queryArg) => ({
          url: `/v1/actions`,
          method: "POST",
          body: queryArg.createActionDto,
        }),
        invalidatesTags: ["Action"],
      }),
      actionControllerUpdateV1: build.mutation<
        ActionControllerUpdateV1ApiResponse,
        ActionControllerUpdateV1ApiArg
      >({
        query: (queryArg) => ({
          url: `/v1/actions/${queryArg.id}`,
          method: "PATCH",
          body: queryArg.updateActionDto,
        }),
        invalidatesTags: ["Action"],
      }),
      actionControllerDeleteV1: build.mutation<
        ActionControllerDeleteV1ApiResponse,
        ActionControllerDeleteV1ApiArg
      >({
        query: (queryArg) => ({
          url: `/v1/actions/delete/${queryArg.id}`,
          method: "PATCH",
        }),
        invalidatesTags: ["Action"],
      }),
      actionControllerCreateFeedbackV1: build.mutation<
        ActionControllerCreateFeedbackV1ApiResponse,
        ActionControllerCreateFeedbackV1ApiArg
      >({
        query: (queryArg) => ({
          url: `/v1/actions/feedback/create/${queryArg.id}`,
          method: "PATCH",
          body: queryArg.createActionsFeedbackDto,
        }),
        invalidatesTags: ["Action"],
      }),
      actionControllerUpdateFeedbackV1: build.mutation<
        ActionControllerUpdateFeedbackV1ApiResponse,
        ActionControllerUpdateFeedbackV1ApiArg
      >({
        query: (queryArg) => ({
          url: `/v1/actions/feedback/update/${queryArg.id}`,
          method: "PATCH",
          body: queryArg.updateActionsFeedbackDto,
        }),
        invalidatesTags: ["Action"],
      }),
      actionControllerDeleteFeedbackV1: build.mutation<
        ActionControllerDeleteFeedbackV1ApiResponse,
        ActionControllerDeleteFeedbackV1ApiArg
      >({
        query: (queryArg) => ({
          url: `/v1/actions/feedback/delete/${queryArg.id}`,
          method: "PATCH",
        }),
        invalidatesTags: ["Action"],
      }),
      actionControllerReorderActionsV1: build.mutation<
        ActionControllerReorderActionsV1ApiResponse,
        ActionControllerReorderActionsV1ApiArg
      >({
        query: (queryArg) => ({
          url: `/v1/actions/reorder/${queryArg.ftsFunctionDetailId}`,
          method: "PATCH",
          body: queryArg.reorderActionsDto,
        }),
        invalidatesTags: ["Action"],
      }),
      fileControllerGetUploadUrlV1: build.mutation<
        FileControllerGetUploadUrlV1ApiResponse,
        FileControllerGetUploadUrlV1ApiArg
      >({
        query: (queryArg) => ({
          url: `/v1/files/upload-url`,
          method: "POST",
          body: queryArg.initUploadDto,
        }),
        invalidatesTags: ["File"],
      }),
      fileControllerConfirmUploadV1: build.mutation<
        FileControllerConfirmUploadV1ApiResponse,
        FileControllerConfirmUploadV1ApiArg
      >({
        query: (queryArg) => ({
          url: `/v1/files/confirm`,
          method: "POST",
          body: queryArg.confirmUploadDto,
        }),
        invalidatesTags: ["File", "FtsFunctionDetail"],
      }),
      fileControllerGetDownloadUrlV1: build.mutation<
        FileControllerGetDownloadUrlV1ApiResponse,
        FileControllerGetDownloadUrlV1ApiArg
      >({
        query: (queryArg) => ({
          url: `/v1/files/download-url/${queryArg.id}`,
          method: "POST",
        }),
        invalidatesTags: ["File"],
      }),
      fileControllerGetFileInfoV1: build.query<
        FileControllerGetFileInfoV1ApiResponse,
        FileControllerGetFileInfoV1ApiArg
      >({
        query: (queryArg) => ({ url: `/v1/files/${queryArg.id}` }),
        providesTags: ["File"],
      }),
      fileControllerDeleteFileV1: build.mutation<
        FileControllerDeleteFileV1ApiResponse,
        FileControllerDeleteFileV1ApiArg
      >({
        query: (queryArg) => ({
          url: `/v1/files/${queryArg.id}`,
          method: "DELETE",
        }),
        invalidatesTags: ["File", "FtsFunctionDetail"],
      }),
      fileControllerGetFilesByFtsFunctionDetailV1: build.query<
        FileControllerGetFilesByFtsFunctionDetailV1ApiResponse,
        FileControllerGetFilesByFtsFunctionDetailV1ApiArg
      >({
        query: (queryArg) => ({
          url: `/v1/files`,
          params: {
            ftsFunctionDetailId: queryArg.ftsFunctionDetailId,
          },
        }),
        providesTags: ["File"],
      }),
      exportControllerGetDownloadV1: build.query<
        ExportControllerGetDownloadV1ApiResponse,
        ExportControllerGetDownloadV1ApiArg
      >({
        query: () => ({ url: `/v1/fts-functions/download` }),
        providesTags: ["Export"],
      }),
    }),
    overrideExisting: false,
  });
export { injectedRtkApi as ftsFunctionRegistry };
export type AuthControllerLoginV1ApiResponse =
  /** status 201 Успешный вход */ LoginResponseDto;
export type AuthControllerLoginV1ApiArg = {
  loginDto: LoginDto;
};
export type AuthControllerLogoutV1ApiResponse =
  /** status 201 Выход выполнен успешно */ LogoutResponseDto;
export type AuthControllerLogoutV1ApiArg = void;
export type AuthControllerRefreshV1ApiResponse =
  /** status 201 Данные успешно обновлены */ RefreshResponseDto;
export type AuthControllerRefreshV1ApiArg = void;
export type ConstantControllerGetTypesV1ApiResponse =
  /** status 200 Ресурс успешно найден */ TypeResponseDto[];
export type ConstantControllerGetTypesV1ApiArg = {
  codes?: string[];
  categories?: (
    | "token_status"
    | "token_rotation_event"
    | "ACTION_HISTORY_TYPE"
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
    | "FEEDBACK_ACCEPT_STATUS"
    | "RESPONSIBLE"
    | "FTS_METHODOLOGY_STATUS"
    | "ACTION_STATUS"
    | "PRIORITY_ACTION"
  )[];
  supertypeIds?: number[];
};
export type ConstantControllerGetUsersV1ApiResponse =
  /** status 200 Ресурс успешно найден */ UserResponseDto[];
export type ConstantControllerGetUsersV1ApiArg = {
  roles?: ("ADMIN" | "USER")[];
  ftsPositionRoles?: ("DEPUTY_CHIEF" | "CHIEF")[];
  ftsFunctionRoles?: ("CURATOR" | "MANAGER")[];
  ftsBranchTypes?: (
    | "CENTRAL_OFFICE"
    | "INTERREGIONAL_INSPECTION"
    | "COMPETENCY_CENTER"
    | "TERRITORIAL_OFFICE"
    | "TERRITORIAL_ADMINISTRATION"
  )[];
};
export type FtsFunctionControllerGetAllFtsFunctionsV1ApiResponse =
  /** status 200 Ресурс успешно найден */ FtsFunctionItemsResponseDto;
export type FtsFunctionControllerGetAllFtsFunctionsV1ApiArg = {
  filter?: {
    ids?: string | number | (string | number)[];
    ftsFunctionNameIds?: string | number | (string | number)[];
    competencyCenterIds?: string | number | (string | number)[];
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
  };
  sort?:
    | string
    | {
        field:
          | "id"
          | "competencyCenterId"
          | "ftsFunctionNameId"
          | "ftsFunctionMarkerId"
          | "ftsCentralizationId"
          | "curatorCentralOfficeId"
          | "managerInterregionalInspectionId"
          | "departmentHeadCentralOfficeId"
          | "departmentHeadInterregionalInspectionId";
        order?: "asc" | "desc";
      }[]
    | {
        field:
          | "id"
          | "competencyCenterId"
          | "ftsFunctionNameId"
          | "ftsFunctionMarkerId"
          | "ftsCentralizationId"
          | "curatorCentralOfficeId"
          | "managerInterregionalInspectionId"
          | "departmentHeadCentralOfficeId"
          | "departmentHeadInterregionalInspectionId";
        order?: "asc" | "desc";
      };
};
export type FtsFunctionControllerCreateV1ApiResponse =
  /** status 201 Ресурс успешно создан */ FtsFunctionBaseResponseDto;
export type FtsFunctionControllerCreateV1ApiArg = {
  createFtsFunctionDto: CreateFtsFunctionDto;
};
export type FtsFunctionControllerGetFtsFunctionByIdV1ApiResponse =
  /** status 200 Ресурс успешно найден */ FtsFunctionBaseResponseDto;
export type FtsFunctionControllerGetFtsFunctionByIdV1ApiArg = {
  id: string;
};
export type FtsFunctionControllerUpdateV1ApiResponse =
  /** status 200 Ресурс успешно обновлен */ FtsFunctionBaseResponseDto;
export type FtsFunctionControllerUpdateV1ApiArg = {
  id: string;
  updateFtsFunctionDto: UpdateFtsFunctionDto;
};
export type FtsFunctionControllerDeleteV1ApiResponse =
  /** status 200 Ресурс успешно удален */ FtsFunctionBaseResponseDto;
export type FtsFunctionControllerDeleteV1ApiArg = {
  id: string;
};
export type FtsFunctionDetailControllerGetAllFtsFunctionDetailsV1ApiResponse =
  /** status 200 Ресурс успешно найден */ FtsFunctionDetailItemsResponseDto;
export type FtsFunctionDetailControllerGetAllFtsFunctionDetailsV1ApiArg = {
  ftsFunctionId: string | number;
};
export type FtsFunctionDetailControllerGetFtsFunctionDetailByIdV1ApiResponse =
  /** status 200 Ресурс успешно найден */ FtsFunctionDetailBaseResponseDto;
export type FtsFunctionDetailControllerGetFtsFunctionDetailByIdV1ApiArg = {
  id: string;
};
export type FtsFunctionDetailControllerCreateV1ApiResponse =
  /** status 201 Ресурс успешно создан */ FtsFunctionDetailBaseResponseDto;
export type FtsFunctionDetailControllerCreateV1ApiArg = {
  createFtsFunctionDetailDto: CreateFtsFunctionDetailDto;
};
export type FtsFunctionDetailControllerUpdateV1ApiResponse =
  /** status 200 Ресурс успешно обновлен */ FtsFunctionDetailBaseResponseDto;
export type FtsFunctionDetailControllerUpdateV1ApiArg = {
  id: string;
  updateFtsFunctionDetailDto: UpdateFtsFunctionDetailDto;
};
export type FtsFunctionDetailControllerDeleteV1ApiResponse =
  /** status 200 Ресурс успешно удален */ FtsFunctionDetailBaseResponseDto;
export type FtsFunctionDetailControllerDeleteV1ApiArg = {
  id: string;
};
export type FtsFunctionDetailControllerReorderFtsFunctionDetailsV1ApiResponse =
  /** status 200 Ресурс успешно обновлен */ FtsFunctionDetailItemsResponseDto;
export type FtsFunctionDetailControllerReorderFtsFunctionDetailsV1ApiArg = {
  ftsFunctionId: string | number;
  reorderFtsFunctionDetailDto: ReorderFtsFunctionDetailDto;
};
export type FtsFunctionDetailControllerGetRelationsV1ApiResponse =
  /** status 200 Ресурс успешно найден */ FtsFunctionDetailsRelationResponseDto;
export type FtsFunctionDetailControllerGetRelationsV1ApiArg = {
  type: "UNRELATED" | "RELATED";
  ftsFunctionId: string | number;
  ftsFunctionDetailId: string | number;
  ftsFunctionStepId?: string | number;
  relationTypeId?: string | number;
  search?: string;
};
export type FtsFunctionDetailControllerCreateRelationV1ApiResponse = unknown;
export type FtsFunctionDetailControllerCreateRelationV1ApiArg = {
  createFtsFunctionDetailsRelationDto: CreateFtsFunctionDetailsRelationDto;
};
export type FtsFunctionDetailControllerDeleteRelationV1ApiResponse = unknown;
export type FtsFunctionDetailControllerDeleteRelationV1ApiArg = {
  parentFtsFunctionId: string | number;
  childFtsFunctionId: string | number;
};
export type FeedbackControllerGetAllFeedbacksV1ApiResponse =
  /** status 200 Ресурс успешно найден */ FeedbackItemsResponseDto;
export type FeedbackControllerGetAllFeedbacksV1ApiArg = {
  ftsFunctionDetailId: string | number;
};
export type FeedbackControllerGetFeedbackByIdV1ApiResponse =
  /** status 200 Ресурс успешно найден */ FeedbackBaseResponseDto;
export type FeedbackControllerGetFeedbackByIdV1ApiArg = {
  id: string;
};
export type FeedbackControllerCreateV1ApiResponse =
  /** status 201 Ресурс успешно создан */ FeedbackBaseResponseDto;
export type FeedbackControllerCreateV1ApiArg = {
  createFeedbackDto: CreateFeedbackDto;
};
export type FeedbackControllerUpdateV1ApiResponse =
  /** status 200 Ресурс успешно обновлен */ FeedbackBaseResponseDto;
export type FeedbackControllerUpdateV1ApiArg = {
  id: string;
  updateFeedbackDto: UpdateFeedbackDto;
};
export type FeedbackControllerDeleteV1ApiResponse =
  /** status 200 Ресурс успешно удален */ FeedbackBaseResponseDto;
export type FeedbackControllerDeleteV1ApiArg = {
  id: string;
};
export type FeedbackControllerAcceptV1ApiResponse =
  /** status 200 Ресурс успешно обновлен */ FeedbackBaseResponseDto;
export type FeedbackControllerAcceptV1ApiArg = {
  id: string;
  acceptFeedbackDto: AcceptFeedbackDto;
};
export type FeedbackControllerReorderFeedbacksV1ApiResponse =
  /** status 200 Ресурс успешно обновлен */ FeedbackItemsResponseDto;
export type FeedbackControllerReorderFeedbacksV1ApiArg = {
  ftsFunctionDetailId: string | number;
  reorderFeedbacksDto: ReorderFeedbacksDto;
};
export type ActionControllerGetGeneralInfoActionsV1ApiResponse =
  /** status 200 Ресурс успешно найден */ GeneralInfoActionsResponseDto;
export type ActionControllerGetGeneralInfoActionsV1ApiArg = {
  ftsFunctionDetailId: string | number;
};
export type ActionControllerUpdateGeneralInfoActionsV1ApiResponse =
  /** status 200 Ресурс успешно обновлен */ GeneralInfoActionsResponseDto;
export type ActionControllerUpdateGeneralInfoActionsV1ApiArg = {
  ftsFunctionDetailId: string | number;
  updateGeneralInfoActionsDto: UpdateGeneralInfoActionsDto;
};
export type ActionControllerGetAllActionsV1ApiResponse =
  /** status 200 Ресурс успешно найден */ ActionItemsResponseDto;
export type ActionControllerGetAllActionsV1ApiArg = {
  ftsFunctionDetailId: string | number;
};
export type ActionControllerGetActionByIdV1ApiResponse =
  /** status 200 Ресурс успешно найден */ ActionBaseResponseDto;
export type ActionControllerGetActionByIdV1ApiArg = {
  id: string;
};
export type ActionControllerCreateV1ApiResponse =
  /** status 201 Ресурс успешно создан */ ActionBaseResponseDto;
export type ActionControllerCreateV1ApiArg = {
  createActionDto: CreateActionDto;
};
export type ActionControllerUpdateV1ApiResponse =
  /** status 200 Ресурс успешно обновлен */ ActionBaseResponseDto;
export type ActionControllerUpdateV1ApiArg = {
  id: string;
  updateActionDto: UpdateActionDto;
};
export type ActionControllerDeleteV1ApiResponse =
  /** status 200 Ресурс успешно удален */ ActionBaseResponseDto;
export type ActionControllerDeleteV1ApiArg = {
  id: string;
};
export type ActionControllerCreateFeedbackV1ApiResponse =
  /** status 200 Ресурс успешно создан */ ActionBaseResponseDto;
export type ActionControllerCreateFeedbackV1ApiArg = {
  id: string;
  createActionsFeedbackDto: CreateActionsFeedbackDto;
};
export type ActionControllerUpdateFeedbackV1ApiResponse =
  /** status 200 Ресурс успешно обновлен */ ActionBaseResponseDto;
export type ActionControllerUpdateFeedbackV1ApiArg = {
  id: string;
  updateActionsFeedbackDto: UpdateActionsFeedbackDto;
};
export type ActionControllerDeleteFeedbackV1ApiResponse =
  /** status 200 Ресурс успешно удален */ ActionBaseResponseDto;
export type ActionControllerDeleteFeedbackV1ApiArg = {
  id: string;
};
export type ActionControllerReorderActionsV1ApiResponse =
  /** status 200 Ресурс успешно обновлен */ ActionItemsResponseDto;
export type ActionControllerReorderActionsV1ApiArg = {
  ftsFunctionDetailId: string | number;
  reorderActionsDto: ReorderActionsDto;
};
export type FileControllerGetUploadUrlV1ApiResponse =
  /** status 201 Ресурс успешно создан */ UploadDataResponseDto;
export type FileControllerGetUploadUrlV1ApiArg = {
  initUploadDto: InitUploadDto;
};
export type FileControllerConfirmUploadV1ApiResponse =
  /** status 201 Ресурс успешно создан */ FileResponseDto;
export type FileControllerConfirmUploadV1ApiArg = {
  confirmUploadDto: ConfirmUploadDto;
};
export type FileControllerGetDownloadUrlV1ApiResponse =
  /** status 200 Ресурс успешно найден */ PresignedUrlResponseDto;
export type FileControllerGetDownloadUrlV1ApiArg = {
  id: string;
};
export type FileControllerGetFileInfoV1ApiResponse =
  /** status 200 Ресурс успешно найден */ FileResponseDto;
export type FileControllerGetFileInfoV1ApiArg = {
  id: string;
};
export type FileControllerDeleteFileV1ApiResponse =
  /** status 200 Ресурс успешно удален */ DeleteFileResponseDto;
export type FileControllerDeleteFileV1ApiArg = {
  id: string;
};
export type FileControllerGetFilesByFtsFunctionDetailV1ApiResponse =
  /** status 200 Ресурс успешно найден */ FilesListResponseDto;
export type FileControllerGetFilesByFtsFunctionDetailV1ApiArg = {
  ftsFunctionDetailId: number;
};
export type ExportControllerGetDownloadV1ApiResponse =
  /** status 200 Файл успешно выгружен */ Blob;
export type ExportControllerGetDownloadV1ApiArg = void;
export type LoginResponseDto = {
  message: string;
  user: {
    id: number;
    ftsInteractionUsersId: number | null;
    role: "ADMIN" | "USER";
    ftsPositionRole: ("DEPUTY_CHIEF" | "CHIEF") | null;
    ftsFunctionRole: ("CURATOR" | "MANAGER") | null;
    ftsBranchType:
      | "CENTRAL_OFFICE"
      | "INTERREGIONAL_INSPECTION"
      | "COMPETENCY_CENTER"
      | "TERRITORIAL_OFFICE"
      | "TERRITORIAL_ADMINISTRATION";
    fullName: string | null;
    shortName: string | null;
    description: string | null;
    isDeleted: boolean;
    lastLogin: string | null;
    createdAt: string;
    updatedAt: string;
  };
  accessToken: string;
  refreshToken: string;
};
export type ErrorResponseDto = {
  statusCode: number;
  message: string | string[] | any[];
  timestamp: string;
};
export type LoginDto = {
  username: string;
  password: string;
};
export type LogoutResponseDto = {
  message: string;
};
export type RefreshResponseDto = {
  message: string;
  user: {
    id: number;
    ftsInteractionUsersId: number | null;
    role: "ADMIN" | "USER";
    ftsPositionRole: ("DEPUTY_CHIEF" | "CHIEF") | null;
    ftsFunctionRole: ("CURATOR" | "MANAGER") | null;
    ftsBranchType:
      | "CENTRAL_OFFICE"
      | "INTERREGIONAL_INSPECTION"
      | "COMPETENCY_CENTER"
      | "TERRITORIAL_OFFICE"
      | "TERRITORIAL_ADMINISTRATION";
    fullName: string | null;
    shortName: string | null;
    description: string | null;
    isDeleted: boolean;
    lastLogin: string | null;
    createdAt: string;
    updatedAt: string;
  };
  accessToken: string;
  refreshToken: string;
};
export type TypeResponseDto = {
  id: number;
  code: string;
  name: string;
  description: string | null;
  supertypeId: number | null;
};
export type UserResponseDto = {
  id: number;
  firstName: string;
  lastName: string;
  patronymic: string | null;
  fullName: string | null;
  shortName: string | null;
  description: string | null;
};
export type FtsFunctionItemsResponseDto = {
  message: string;
  data: {
    items: {
      id: string | number;
      ftsCentralization: {
        id: number;
        code: string;
        name: string;
        description: string | null;
        supertypeId: number | null;
      };
      ftsFunctionName: {
        id: number;
        code: string;
        name: string;
        description: string | null;
        supertypeId: number | null;
      };
      ftsFunctionMarker: {
        id: number;
        code: string;
        name: string;
        description: string | null;
        supertypeId: number | null;
      };
      competencyCenter: {
        id: number;
        code: string;
        name: string;
        description: string | null;
        supertypeId: number | null;
      };
      dtis: {
        type: {
          id: number;
          code: string;
          name: string;
          description: string | null;
          supertypeId: number | null;
        };
      }[];
      curatorCentralOffice: {
        id: number;
        firstName: string;
        lastName: string;
        patronymic: string | null;
        fullName: string | null;
        shortName: string | null;
        description: string | null;
      };
      managerInterregionalInspection: {
        id: number;
        firstName: string;
        lastName: string;
        patronymic: string | null;
        fullName: string | null;
        shortName: string | null;
        description: string | null;
      };
      departmentHeadCentralOffice: {
        id: number;
        firstName: string;
        lastName: string;
        patronymic: string | null;
        fullName: string | null;
        shortName: string | null;
        description: string | null;
      };
      departmentHeadInterregionalInspection: {
        id: number;
        firstName: string;
        lastName: string;
        patronymic: string | null;
        fullName: string | null;
        shortName: string | null;
        description: string | null;
      };
      createdAt: string;
      updatedAt: string;
    }[];
    meta: {
      total: number;
      filteredTotal: number;
    };
  };
};
export type FtsFunctionBaseResponseDto = {
  message: string;
  data: {
    id: string | number;
    ftsCentralization: {
      id: number;
      code: string;
      name: string;
      description: string | null;
      supertypeId: number | null;
    };
    ftsFunctionName: {
      id: number;
      code: string;
      name: string;
      description: string | null;
      supertypeId: number | null;
    };
    ftsFunctionMarker: {
      id: number;
      code: string;
      name: string;
      description: string | null;
      supertypeId: number | null;
    };
    competencyCenter: {
      id: number;
      code: string;
      name: string;
      description: string | null;
      supertypeId: number | null;
    };
    dtis: {
      type: {
        id: number;
        code: string;
        name: string;
        description: string | null;
        supertypeId: number | null;
      };
    }[];
    curatorCentralOffice: {
      id: number;
      firstName: string;
      lastName: string;
      patronymic: string | null;
      fullName: string | null;
      shortName: string | null;
      description: string | null;
    };
    managerInterregionalInspection: {
      id: number;
      firstName: string;
      lastName: string;
      patronymic: string | null;
      fullName: string | null;
      shortName: string | null;
      description: string | null;
    };
    departmentHeadCentralOffice: {
      id: number;
      firstName: string;
      lastName: string;
      patronymic: string | null;
      fullName: string | null;
      shortName: string | null;
      description: string | null;
    };
    departmentHeadInterregionalInspection: {
      id: number;
      firstName: string;
      lastName: string;
      patronymic: string | null;
      fullName: string | null;
      shortName: string | null;
      description: string | null;
    };
    createdAt: string;
    updatedAt: string;
  };
};
export type CreateFtsFunctionDto = {
  ftsCentralizationId: string | number;
  ftsFunctionNameId: string | number;
  ftsFunctionMarkerId: string | number;
  competencyCenterId: string | number;
  curatorCentralOfficeId: string | number;
  managerInterregionalInspectionId: string | number;
  departmentHeadCentralOfficeId: string | number;
  departmentHeadInterregionalInspectionId: string | number;
  dtiIds?: (string | number)[];
};
export type UpdateFtsFunctionDto = {
  ftsCentralizationId?: string | number;
  ftsFunctionNameId?: string | number;
  ftsFunctionMarkerId?: string | number;
  competencyCenterId?: string | number;
  curatorCentralOfficeId?: string | number;
  managerInterregionalInspectionId?: string | number;
  departmentHeadCentralOfficeId?: string | number;
  departmentHeadInterregionalInspectionId?: string | number;
  dtiIds?: (string | number)[];
};
export type FtsFunctionDetailItemsResponseDto = {
  message: string;
  data: {
    itemsByCategory: {
      methodology: {
        itemsByStep: {
          objectSelection: {
            id: string | number;
            ftsFunctionDetails: string;
            ftsFunctionStep: {
              id: number;
              code: string;
              name: string;
              description: string | null;
              supertypeId: number | null;
            };
            ftsFunctionCategory: {
              id: number;
              code: string;
              name: string;
              description: string | null;
              supertypeId: number | null;
            };
            whoPerformsAction: {
              id: number;
              code: string;
              name: string;
              description: string | null;
              supertypeId: number | null;
            } | null;
            feedbacks: {
              acceptStatus: {
                id: number;
                code: string;
                name: string;
                description: string | null;
                supertypeId: number | null;
              };
            }[];
            parents: {
              parentFtsFunctionId: number;
            }[];
            children: {
              childFtsFunctionId: number;
            }[];
          }[];
          clusteringImpact: {
            id: string | number;
            ftsFunctionDetails: string;
            ftsFunctionStep: {
              id: number;
              code: string;
              name: string;
              description: string | null;
              supertypeId: number | null;
            };
            ftsFunctionCategory: {
              id: number;
              code: string;
              name: string;
              description: string | null;
              supertypeId: number | null;
            };
            whoPerformsAction: {
              id: number;
              code: string;
              name: string;
              description: string | null;
              supertypeId: number | null;
            } | null;
            feedbacks: {
              acceptStatus: {
                id: number;
                code: string;
                name: string;
                description: string | null;
                supertypeId: number | null;
              };
            }[];
            parents: {
              parentFtsFunctionId: number;
            }[];
            children: {
              childFtsFunctionId: number;
            }[];
          }[];
        };
        meta: {
          stepOne: number;
          stepTwo: number;
          countRelations?: number;
        };
      };
      actualAction: {
        itemsByStep: {
          objectSelection: {
            id: string | number;
            ftsFunctionDetails: string;
            ftsFunctionStep: {
              id: number;
              code: string;
              name: string;
              description: string | null;
              supertypeId: number | null;
            };
            ftsFunctionCategory: {
              id: number;
              code: string;
              name: string;
              description: string | null;
              supertypeId: number | null;
            };
            whoPerformsAction: {
              id: number;
              code: string;
              name: string;
              description: string | null;
              supertypeId: number | null;
            } | null;
            feedbacks: {
              acceptStatus: {
                id: number;
                code: string;
                name: string;
                description: string | null;
                supertypeId: number | null;
              };
            }[];
            parents: {
              parentFtsFunctionId: number;
            }[];
            children: {
              childFtsFunctionId: number;
            }[];
          }[];
          clusteringImpact: {
            id: string | number;
            ftsFunctionDetails: string;
            ftsFunctionStep: {
              id: number;
              code: string;
              name: string;
              description: string | null;
              supertypeId: number | null;
            };
            ftsFunctionCategory: {
              id: number;
              code: string;
              name: string;
              description: string | null;
              supertypeId: number | null;
            };
            whoPerformsAction: {
              id: number;
              code: string;
              name: string;
              description: string | null;
              supertypeId: number | null;
            } | null;
            feedbacks: {
              acceptStatus: {
                id: number;
                code: string;
                name: string;
                description: string | null;
                supertypeId: number | null;
              };
            }[];
            parents: {
              parentFtsFunctionId: number;
            }[];
            children: {
              childFtsFunctionId: number;
            }[];
          }[];
        };
        meta: {
          stepOne: number;
          stepTwo: number;
          countRelations?: number;
        };
      };
      controlAnalytics: {
        itemsByStep: {
          objectSelection: {
            id: string | number;
            ftsFunctionDetails: string;
            ftsFunctionStep: {
              id: number;
              code: string;
              name: string;
              description: string | null;
              supertypeId: number | null;
            };
            ftsFunctionCategory: {
              id: number;
              code: string;
              name: string;
              description: string | null;
              supertypeId: number | null;
            };
            whoPerformsAction: {
              id: number;
              code: string;
              name: string;
              description: string | null;
              supertypeId: number | null;
            } | null;
            feedbacks: {
              acceptStatus: {
                id: number;
                code: string;
                name: string;
                description: string | null;
                supertypeId: number | null;
              };
            }[];
            parents: {
              parentFtsFunctionId: number;
            }[];
            children: {
              childFtsFunctionId: number;
            }[];
          }[];
          clusteringImpact: {
            id: string | number;
            ftsFunctionDetails: string;
            ftsFunctionStep: {
              id: number;
              code: string;
              name: string;
              description: string | null;
              supertypeId: number | null;
            };
            ftsFunctionCategory: {
              id: number;
              code: string;
              name: string;
              description: string | null;
              supertypeId: number | null;
            };
            whoPerformsAction: {
              id: number;
              code: string;
              name: string;
              description: string | null;
              supertypeId: number | null;
            } | null;
            feedbacks: {
              acceptStatus: {
                id: number;
                code: string;
                name: string;
                description: string | null;
                supertypeId: number | null;
              };
            }[];
            parents: {
              parentFtsFunctionId: number;
            }[];
            children: {
              childFtsFunctionId: number;
            }[];
          }[];
        };
        meta: {
          stepOne: number;
          stepTwo: number;
          countRelations?: number;
        };
      };
    };
    meta: {
      stepOne: number;
      stepTwo: number;
      countRelations?: number;
    };
  };
};
export type FtsFunctionDetailBaseResponseDto = {
  message: string;
  data: {
    id: string | number;
    ftsFunctionStep: {
      id: number;
      code: string;
      name: string;
      description: string | null;
      supertypeId: number | null;
    };
    ftsFunctionCategory: {
      id: number;
      code: string;
      name: string;
      description: string | null;
      supertypeId: number | null;
    };
    ftsFunctionComplexity: {
      id: number;
      code: string;
      name: string;
      description: string | null;
      supertypeId: number | null;
    } | null;
    ftsFunctionExecutionFrequency: {
      id: number;
      code: string;
      name: string;
      description: string | null;
      supertypeId: number | null;
    } | null;
    whoPerformsAction: {
      id: number;
      code: string;
      name: string;
      description: string | null;
      supertypeId: number | null;
    } | null;
    technologicalSolution: {
      id: number;
      code: string;
      name: string;
      description: string | null;
      supertypeId: number | null;
    } | null;
    responsible: {
      id: number;
      code: string;
      name: string;
      description: string | null;
      supertypeId: number | null;
    } | null;
    ftsFunctionDetails: string;
    actionsСompleteness: string | null;
    actionsEffectiveness: string | null;
    basis: string | null;
    artifact: string | null;
    artifactUsage: string | null;
    number: string | null;
    algorithm: string | null;
    createdAt: string;
    updatedAt: string;
    algorithmFiles: {
      id: number;
      objectKey: string;
      originalName: string | null;
      mimeType: string | null;
      size: number | null;
    }[];
  };
};
export type CreateFtsFunctionDetailDto = {
  ftsFunctionId: string | number;
  ftsFunctionStepId: string | number;
  ftsFunctionCategoryId: string | number;
  ftsFunctionComplexityId?: ((string | null) | (number | null)) | null;
  ftsFunctionExecutionFrequencyId?: ((string | null) | (number | null)) | null;
  whoPerformsActionId?: ((string | null) | (number | null)) | null;
  technologicalSolutionId?: ((string | null) | (number | null)) | null;
  responsibleId?: ((string | null) | (number | null)) | null;
  ftsFunctionDetails: string;
  actionsСompleteness?: string | null;
  actionsEffectiveness?: string | null;
  basis?: string | null;
  artifact?: string | null;
  artifactUsage?: string | null;
  number?: string | null;
  algorithm?: string | null;
};
export type UpdateFtsFunctionDetailDto = {
  ftsFunctionId?: string | number;
  ftsFunctionStepId?: string | number;
  ftsFunctionCategoryId?: string | number;
  ftsFunctionComplexityId?: ((string | null) | (number | null)) | null;
  ftsFunctionExecutionFrequencyId?: ((string | null) | (number | null)) | null;
  whoPerformsActionId?: ((string | null) | (number | null)) | null;
  technologicalSolutionId?: ((string | null) | (number | null)) | null;
  responsibleId?: ((string | null) | (number | null)) | null;
  ftsFunctionDetails?: string;
  actionsСompleteness?: string | null;
  actionsEffectiveness?: string | null;
  basis?: string | null;
  artifact?: string | null;
  artifactUsage?: string | null;
  number?: string | null;
  algorithm?: string | null;
};
export type ReorderFtsFunctionDetailDto = {
  orderedIds: (string | number)[];
};
export type FtsFunctionDetailsRelationResponseDto = {
  message: string;
  data: {
    methodology: {
      id: string | number;
      ftsFunctionDetails: string;
      ftsFunctionStep: {
        id: number;
        code: string;
        name: string;
        description: string | null;
        supertypeId: number | null;
      };
      ftsFunctionCategory: {
        id: number;
        code: string;
        name: string;
        description: string | null;
        supertypeId: number | null;
      };
      whoPerformsAction: {
        id: number;
        code: string;
        name: string;
        description: string | null;
        supertypeId: number | null;
      } | null;
      feedbacks: {
        acceptStatus: {
          id: number;
          code: string;
          name: string;
          description: string | null;
          supertypeId: number | null;
        };
      }[];
      parents: {
        relationType: {
          id: number;
          code: string;
          name: string;
          description: string | null;
          supertypeId: number | null;
        };
      }[];
      children: {
        relationType: {
          id: number;
          code: string;
          name: string;
          description: string | null;
          supertypeId: number | null;
        };
      }[];
    }[];
    actualAction: {
      id: string | number;
      ftsFunctionDetails: string;
      ftsFunctionStep: {
        id: number;
        code: string;
        name: string;
        description: string | null;
        supertypeId: number | null;
      };
      ftsFunctionCategory: {
        id: number;
        code: string;
        name: string;
        description: string | null;
        supertypeId: number | null;
      };
      whoPerformsAction: {
        id: number;
        code: string;
        name: string;
        description: string | null;
        supertypeId: number | null;
      } | null;
      feedbacks: {
        acceptStatus: {
          id: number;
          code: string;
          name: string;
          description: string | null;
          supertypeId: number | null;
        };
      }[];
      parents: {
        relationType: {
          id: number;
          code: string;
          name: string;
          description: string | null;
          supertypeId: number | null;
        };
      }[];
      children: {
        relationType: {
          id: number;
          code: string;
          name: string;
          description: string | null;
          supertypeId: number | null;
        };
      }[];
    }[];
    controlAnalytics: {
      id: string | number;
      ftsFunctionDetails: string;
      ftsFunctionStep: {
        id: number;
        code: string;
        name: string;
        description: string | null;
        supertypeId: number | null;
      };
      ftsFunctionCategory: {
        id: number;
        code: string;
        name: string;
        description: string | null;
        supertypeId: number | null;
      };
      whoPerformsAction: {
        id: number;
        code: string;
        name: string;
        description: string | null;
        supertypeId: number | null;
      } | null;
      feedbacks: {
        acceptStatus: {
          id: number;
          code: string;
          name: string;
          description: string | null;
          supertypeId: number | null;
        };
      }[];
      parents: {
        relationType: {
          id: number;
          code: string;
          name: string;
          description: string | null;
          supertypeId: number | null;
        };
      }[];
      children: {
        relationType: {
          id: number;
          code: string;
          name: string;
          description: string | null;
          supertypeId: number | null;
        };
      }[];
    }[];
  };
};
export type CreateFtsFunctionDetailsRelationDto = {
  parentFtsFunctionId: number;
  childFtsFunctionId: number;
  relationTypeId: number;
}[];
export type FeedbackItemsResponseDto = {
  message: string;
  data: {
    id: string | number;
    problemDescription: string | null;
    feedbackQualityMetrics: {
      id: number;
      code: string;
      name: string;
      description: string | null;
      supertypeId: number | null;
    } | null;
    initiatorAcceptance: string | null;
    acceptStatus: {
      id: number;
      code: string;
      name: string;
      description: string | null;
      supertypeId: number | null;
    } | null;
    deadline: string | null;
  }[];
};
export type FeedbackBaseResponseDto = {
  message: string;
  data: {
    id: string | number;
    feedbackQualityMetrics: {
      id: number;
      code: string;
      name: string;
      description: string | null;
      supertypeId: number | null;
    } | null;
    ftsMethodologyStatus: {
      id: number;
      code: string;
      name: string;
      description: string | null;
      supertypeId: number | null;
    } | null;
    acceptStatus: {
      id: number;
      code: string;
      name: string;
      description: string | null;
      supertypeId: number | null;
    };
    problemDescription: string | null;
    initiatorRequisites: string | null;
    initiatorAcceptance: string | null;
    feedbackSources: {
      type: {
        id: number;
        code: string;
        name: string;
        description: string | null;
        supertypeId: number | null;
      };
    }[];
    deadline: string | null;
    acceptedAt: string | null;
    agreementHistory: {
      acceptStatus: {
        id: number;
        code: string;
        name: string;
        description: string | null;
        supertypeId: number | null;
      };
      comment: string | null;
      createdAt: string;
    }[];
    createdAt: string;
    updatedAt: string;
  };
};
export type CreateFeedbackDto = {
  ftsFunctionDetailId: string | number;
  feedbackQualityMetricsId: string | number;
  ftsMethodologyStatusId: string | number;
  problemDescription: string;
  initiatorRequisites: string;
  initiatorAcceptance: string;
  feedbackSourceIds: (string | number)[];
  deadline: string;
};
export type UpdateFeedbackDto = {
  ftsFunctionDetailId?: string | number;
  feedbackQualityMetricsId?: string | number;
  ftsMethodologyStatusId?: string | number;
  problemDescription?: string;
  initiatorRequisites?: string;
  initiatorAcceptance?: string;
  feedbackSourceIds?: (string | number)[];
  deadline?: string;
};
export type AcceptFeedbackDto = {
  acceptStatusId: string | number;
  comment?: string;
};
export type ReorderFeedbacksDto = {
  orderedIds: (string | number)[];
};
export type GeneralInfoActionsResponseDto = {
  message: string;
  data: {
    actionsInput: string | null;
    actionsOutput: string | null;
  };
};
export type UpdateGeneralInfoActionsDto = {
  actionsInput: string;
  actionsOutput: string;
};
export type ActionItemsResponseDto = {
  message: string;
  data: {
    id: string | number;
    status: {
      id: number;
      code: string;
      name: string;
      description: string | null;
      supertypeId: number | null;
    };
    priorityAction: {
      id: number;
      code: string;
      name: string;
      description: string | null;
      supertypeId: number | null;
    } | null;
    description: string;
    feedbackQualityMetricsId: ((string | null) | (number | null)) | null;
  }[];
};
export type ActionBaseResponseDto = {
  message: string;
  data: {
    id: string | number;
    status: {
      id: number;
      code: string;
      name: string;
      description: string | null;
      supertypeId: number | null;
    };
    priorityAction: {
      id: number;
      code: string;
      name: string;
      description: string | null;
      supertypeId: number | null;
    } | null;
    description: string;
    feedbackQualityMetrics: {
      id: number;
      code: string;
      name: string;
      description: string | null;
      supertypeId: number | null;
    } | null;
    ftsMethodologyStatus: {
      id: number;
      code: string;
      name: string;
      description: string | null;
      supertypeId: number | null;
    } | null;
    problemDescription: string | null;
    initiatorRequisites: string | null;
    initiatorAcceptance: string | null;
    feedbackSources: {
      type: {
        id: number;
        code: string;
        name: string;
        description: string | null;
        supertypeId: number | null;
      };
    }[];
    deadline: string | null;
    createdAt: string;
    updatedAt: string;
  };
};
export type CreateActionDto = {
  ftsFunctionDetailId: string | number;
  statusId: string | number;
  priorityActionId: string | number;
  description: string;
};
export type UpdateActionDto = {
  ftsFunctionDetailId?: string | number;
  statusId?: string | number;
  priorityActionId?: string | number;
  description?: string;
};
export type CreateActionsFeedbackDto = {
  feedbackQualityMetricsId: string | number;
  ftsMethodologyStatusId: string | number;
  priorityActionId: string | number;
  problemDescription: string;
  initiatorRequisites: string;
  initiatorAcceptance: string;
  feedbackSourceIds: (string | number)[];
  deadline: string;
};
export type UpdateActionsFeedbackDto = {
  feedbackQualityMetricsId?: string | number;
  ftsMethodologyStatusId?: string | number;
  priorityActionId?: string | number;
  problemDescription?: string;
  initiatorRequisites?: string;
  initiatorAcceptance?: string;
  feedbackSourceIds?: (string | number)[];
  deadline?: string;
};
export type ReorderActionsDto = {
  orderedIds: (string | number)[];
};
export type UploadDataResponseDto = {
  message: string;
  data: {
    objectKey: string;
    url: string;
    expiresAt: string;
    fileName: string;
    fileSize: number;
    mimeType: string;
  };
};
export type InitUploadDto = {
  fileName: string;
  fileSize: number;
  mimeType?: string;
};
export type FileResponseDto = {
  message: string;
  data: {
    id: number;
    objectKey: string;
    originalName: string | null;
    mimeType: string | null;
    size: number | null;
    createdAt: string;
  };
};
export type ConfirmUploadDto = {
  objectKey: string;
  ftsFunctionDetailId: number;
  originalName: string;
  fileSize: number;
  mimeType?: string;
};
export type PresignedUrlResponseDto = {
  message: string;
  data: {
    url: string;
    expiresAt: string;
  };
};
export type DeleteFileResponseDto = {
  message: string;
  data?: {
    success: boolean;
    objectKey: string;
    deletedAt?: string;
  };
};
export type FilesListResponseDto = {
  message: string;
  data: {
    id: number;
    objectKey: string;
    originalName: string | null;
    mimeType: string | null;
    size: number | null;
    createdAt: string;
  }[];
};
export const {
  useAuthControllerLoginV1Mutation,
  useAuthControllerLogoutV1Mutation,
  useAuthControllerRefreshV1Mutation,
  useConstantControllerGetTypesV1Query,
  useConstantControllerGetUsersV1Query,
  useFtsFunctionControllerGetAllFtsFunctionsV1Query,
  useFtsFunctionControllerCreateV1Mutation,
  useFtsFunctionControllerGetFtsFunctionByIdV1Query,
  useFtsFunctionControllerUpdateV1Mutation,
  useFtsFunctionControllerDeleteV1Mutation,
  useFtsFunctionDetailControllerGetAllFtsFunctionDetailsV1Query,
  useFtsFunctionDetailControllerGetFtsFunctionDetailByIdV1Query,
  useFtsFunctionDetailControllerCreateV1Mutation,
  useFtsFunctionDetailControllerUpdateV1Mutation,
  useFtsFunctionDetailControllerDeleteV1Mutation,
  useFtsFunctionDetailControllerReorderFtsFunctionDetailsV1Mutation,
  useFtsFunctionDetailControllerGetRelationsV1Query,
  useFtsFunctionDetailControllerCreateRelationV1Mutation,
  useFtsFunctionDetailControllerDeleteRelationV1Mutation,
  useFeedbackControllerGetAllFeedbacksV1Query,
  useFeedbackControllerGetFeedbackByIdV1Query,
  useFeedbackControllerCreateV1Mutation,
  useFeedbackControllerUpdateV1Mutation,
  useFeedbackControllerDeleteV1Mutation,
  useFeedbackControllerAcceptV1Mutation,
  useFeedbackControllerReorderFeedbacksV1Mutation,
  useActionControllerGetGeneralInfoActionsV1Query,
  useActionControllerUpdateGeneralInfoActionsV1Mutation,
  useActionControllerGetAllActionsV1Query,
  useActionControllerGetActionByIdV1Query,
  useActionControllerCreateV1Mutation,
  useActionControllerUpdateV1Mutation,
  useActionControllerDeleteV1Mutation,
  useActionControllerCreateFeedbackV1Mutation,
  useActionControllerUpdateFeedbackV1Mutation,
  useActionControllerDeleteFeedbackV1Mutation,
  useActionControllerReorderActionsV1Mutation,
  useFileControllerGetUploadUrlV1Mutation,
  useFileControllerConfirmUploadV1Mutation,
  useFileControllerGetDownloadUrlV1Mutation,
  useFileControllerGetFileInfoV1Query,
  useFileControllerDeleteFileV1Mutation,
  useFileControllerGetFilesByFtsFunctionDetailV1Query,
  useExportControllerGetDownloadV1Query,
} = injectedRtkApi;
