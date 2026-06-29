import type { GridFilterModel, GridSortModel } from "@mui/x-data-grid-pro";
import type { FtsFunctionControllerGetAllFtsFunctionsV1ApiArg } from "../../store/ftsFunctionRegistry";



type FtsFunctionFilterKey =
    | "ids"
    | "competencyCenterIds"
    | "ftsFunctionNameIds"
    | "ftsFunctionMarkerIds"
    | "ftsCentralizationIds"
    | "dtiIds"
    | "curatorCentralOfficeIds"
    | "managerInterregionalInspectionIds"
    | "departmentHeadCentralOfficeIds"
    | "departmentHeadInterregionalInspectionIds";

type FtsFunctionSortField =
    | "id"
    | "competencyCenterId"
    | "ftsFunctionNameId"
    | "ftsFunctionMarkerId"
    | "ftsCentralizationId"
    | "curatorCentralOfficeId"
    | "managerInterregionalInspectionId"
    | "departmentHeadCentralOfficeId"
    | "departmentHeadInterregionalInspectionId";

const COLUMN_FILTER_KEY: Record<string, FtsFunctionFilterKey> = {
    ftsFunctionName: "ftsFunctionNameIds",
    ftsFunctionMarker: "ftsFunctionMarkerIds",
    dtis: "dtiIds",
    ftsCentralization: "ftsCentralizationIds",
    competencyCenter: "competencyCenterIds",
    curatorCentralOffice: "curatorCentralOfficeIds",
    departmentHeadCentralOffice: "departmentHeadCentralOfficeIds",
    managerInterregionalInspection: "managerInterregionalInspectionIds",
    departmentHeadInterregionalInspection: "departmentHeadInterregionalInspectionIds",
};

const COLUMN_SORT_FIELD: Record<string, FtsFunctionSortField> = {
    id: "id",
    ftsFunctionName: "ftsFunctionNameId",
    ftsFunctionMarker: "ftsFunctionMarkerId",
    ftsCentralization: "ftsCentralizationId",
    competencyCenter: "competencyCenterId",
    curatorCentralOffice: "curatorCentralOfficeId",
    departmentHeadCentralOffice: "departmentHeadCentralOfficeId",
    managerInterregionalInspection: "managerInterregionalInspectionId",
    departmentHeadInterregionalInspection: "departmentHeadInterregionalInspectionId",
};



export function buildFtsFunctionQuery(
    filterModel: GridFilterModel,
    sortModel: GridSortModel,
): FtsFunctionControllerGetAllFtsFunctionsV1ApiArg {
    const filter: NonNullable<FtsFunctionControllerGetAllFtsFunctionsV1ApiArg["filter"]> = {};
    for (const item of filterModel.items) {
        const key = COLUMN_FILTER_KEY[item.field];
        if (!key) continue;
        const value = item.value;
        if (!Array.isArray(value) || value.length === 0) continue;
        filter[key] = value.map((v) => Number(v));
    }

    const sort: { field: FtsFunctionSortField; order: "asc" | "desc" }[] = [];
    for (const item of sortModel) {
        const field = COLUMN_SORT_FIELD[item.field];
        if (!field || !item.sort) continue;
        sort.push({ field, order: item.sort });
    }

    return {
        ...(Object.keys(filter).length > 0 ? { filter } : {}),
        ...(sort.length > 0 ? { sort } : {}),
    };
}