/**
 * Direct-to-backend helpers. Used for test setup/teardown where driving the UI would
 * be slow or brittle. Do NOT use these to assert UI behavior — those assertions
 * belong to the Playwright page object.
 *
 * The backend lives at http://127.0.0.1:3000 (NestJS + Fastify).
 */

export const API_BASE = "http://127.0.0.1:3000";

export type ApiFtsFunction = {
  id: number;
  ftsCentralizationId: number;
  ftsFunctionNameId: number;
  competencyCenterId: number;
  ftsFunctionMarkerId: number;
  curatorCentralOfficeId: number;
  managerInterregionalInspectionId: number;
  departmentHeadCentralOfficeId: number;
  departmentHeadInterregionalInspectionId: number;
  isDeleted: boolean;
  deletedAt: string | null;
};

export type ApiTypeRef = {
  id: number;
  code: string;
  name: string;
  description: string | null;
  supertypeId: number | null;
};

export type ApiUser = {
  id: number;
  firstName: string;
  lastName: string;
  shortName: string | null;
  fullName: string | null;
  description: string | null;
};

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  // The backend's rate limiter trips easily when several tests kick off in
  // short succession. Retry on 429 with an exponential-ish backoff up to 4
  // attempts before surfacing the error.
  const maxAttempts = 4;
  let lastStatus = 0;
  let lastBody = "";
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const res = await fetch(`${API_BASE}${path}`, {
      ...init,
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        ...(init.headers ?? {}),
      },
    });
    if (res.ok) {
      if (res.status === 204) return undefined as unknown as T;
      return (await res.json()) as T;
    }
    if (res.status === 429 && attempt < maxAttempts) {
      await new Promise((r) => setTimeout(r, 500 * attempt));
      continue;
    }
    lastStatus = res.status;
    lastBody = await res.text().catch(() => "");
    break;
  }
  throw new Error(
    `API ${init.method ?? "GET"} ${path} failed ${lastStatus}: ${lastBody}`,
  );
}

export async function listFtsFunctions(
  params: { includeDeleted?: boolean } = {},
): Promise<{
  items: ApiFtsFunction[];
  total: number;
  filteredTotal: number;
  overallTotal: number;
}> {
  const q = new URLSearchParams();
  if (params.includeDeleted !== undefined)
    q.set("includeDeleted", String(params.includeDeleted));
  const qs = q.toString();
  const resp = await request<{
    items: ApiFtsFunction[];
    filteredTotal: number;
    overallTotal: number;
  }>(`/v1/fts-functions${qs ? `?${qs}` : ""}`);
  return {
    items: resp.items,
    total: resp.overallTotal,
    filteredTotal: resp.filteredTotal,
    overallTotal: resp.overallTotal,
  };
}

export async function getFtsFunctionById(
  id: number,
): Promise<ApiFtsFunction & { details?: unknown; treeEdges?: unknown }> {
  return request(`/v1/fts-functions/${id}`);
}

export async function getTypesByCategory(
  category: string,
): Promise<ApiTypeRef[]> {
  return request(
    `/v1/constants/type?categories[]=${encodeURIComponent(category)}`,
  );
}

export async function getUsers(
  params: {
    ftsFunctionRoles?: ("CURATOR" | "MANAGER")[];
    ftsPositionRoles?: ("CHIEF" | "DEPUTY_CHIEF")[];
    ftsBranchTypes?: ("CENTRAL_OFFICE" | "INTERREGIONAL_INSPECTION")[];
  } = {},
): Promise<ApiUser[]> {
  const q = new URLSearchParams();
  (params.ftsFunctionRoles ?? []).forEach((r) =>
    q.append("ftsFunctionRoles[]", r),
  );
  (params.ftsPositionRoles ?? []).forEach((r) =>
    q.append("ftsPositionRoles[]", r),
  );
  (params.ftsBranchTypes ?? []).forEach((r) => q.append("ftsBranchTypes[]", r));
  const qs = q.toString();
  return request(`/v1/constants/user${qs ? `?${qs}` : ""}`);
}

/**
 * Create a test fts_function using existing seeded references. Picks the first
 * available id in each required category so the created row is valid with
 * respect to the backend's TYPE_CATEGORY_MISMATCH / USER_ROLE_MISMATCH rules.
 */
export async function createTestFtsFunction(
  overrides: Partial<Record<keyof CreateFtsFunctionBody, number>> = {},
): Promise<ApiFtsFunction> {
  // Sequential — the backend's rate limiter is strict on bursts.
  const centralizations = await getTypesByCategory("FTS_CENTRALIZATION");
  const names = await getTypesByCategory("FTS_FUNCTION_NAME");
  const centers = await getTypesByCategory("FTS_COMPETENCY_CENTER");
  const markers = await getTypesByCategory("FTS_FUNCTION_MARKER");
  const curators = await getUsers({
    ftsFunctionRoles: ["CURATOR"],
    ftsBranchTypes: ["CENTRAL_OFFICE"],
  });
  const managers = await getUsers({
    ftsFunctionRoles: ["MANAGER"],
    ftsBranchTypes: ["INTERREGIONAL_INSPECTION"],
  });
  const chiefs = await getUsers({
    ftsPositionRoles: ["CHIEF"],
    ftsBranchTypes: ["CENTRAL_OFFICE"],
  });
  const deputies = await getUsers({
    ftsPositionRoles: ["DEPUTY_CHIEF"],
    ftsBranchTypes: ["INTERREGIONAL_INSPECTION"],
  });

  const body: CreateFtsFunctionBody = {
    ftsCentralizationId:
      overrides.ftsCentralizationId ?? centralizations[0]!.id,
    ftsFunctionNameId: overrides.ftsFunctionNameId ?? names[0]!.id,
    competencyCenterId: overrides.competencyCenterId ?? centers[0]!.id,
    ftsFunctionMarkerId: overrides.ftsFunctionMarkerId ?? markers[0]!.id,
    curatorCentralOfficeId: overrides.curatorCentralOfficeId ?? curators[0]!.id,
    managerInterregionalInspectionId:
      overrides.managerInterregionalInspectionId ?? managers[0]!.id,
    departmentHeadCentralOfficeId:
      overrides.departmentHeadCentralOfficeId ?? chiefs[0]!.id,
    departmentHeadInterregionalInspectionId:
      overrides.departmentHeadInterregionalInspectionId ?? deputies[0]!.id,
  };

  return request(`/v1/fts-functions`, {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export type CreateFtsFunctionBody = {
  ftsCentralizationId: number;
  ftsFunctionNameId: number;
  competencyCenterId: number;
  ftsFunctionMarkerId: number;
  curatorCentralOfficeId: number;
  managerInterregionalInspectionId: number;
  departmentHeadCentralOfficeId: number;
  departmentHeadInterregionalInspectionId: number;
};

export async function softDeleteFtsFunction(id: number): Promise<void> {
  const res = await fetch(`${API_BASE}/v1/fts-functions/${id}`, {
    method: "DELETE",
  });
  // 2xx or 404 is acceptable for cleanup — the function may already be deleted.
  if (!res.ok && res.status !== 404) {
    const body = await res.text().catch(() => "");
    throw new Error(
      `DELETE /v1/fts-functions/${id} failed ${res.status}: ${body}`,
    );
  }
}

/**
 * Best-effort "clean up any functions created in this test run".
 * Accepts an array of ids and issues soft-deletes for each.
 */
export async function cleanupFtsFunctions(ids: number[]): Promise<void> {
  await Promise.allSettled(ids.map((id) => softDeleteFtsFunction(id)));
}
