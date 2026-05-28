import type { ErrorResponse } from "@registry/shared/errors";

import { isRejectedWithValue, type Middleware } from "@reduxjs/toolkit";
import { I18N, i18n } from "src/shared/i18n";
import { showGlobalError } from "src/shared/ui/snackbar";

/**
 * Intercepts rejected RTK Query actions and surfaces a localized message via
 * the global snackbar.
 *
 * Expected backend response body shape — see {@link ErrorResponse}.
 */
export const rtkErrorMiddleware: Middleware = () => (next) => (action) => {
  if (isRejectedWithValue(action)) {
    const payload = (action as { payload?: unknown }).payload;
    const body = extractErrorBody(payload);
    const message = resolveMessage(body);
    if (message) showGlobalError(message);
  }
  return next(action);
};

function extractErrorBody(payload: unknown): ErrorResponse | null {
  if (!payload || typeof payload !== "object") return null;

  // fetchBaseQuery shape: { status, data }
  const direct = payload as { data?: unknown };
  const data = direct.data ?? payload;
  if (!data || typeof data !== "object") return null;

  const d = data as Partial<ErrorResponse>;
  if (typeof d.code !== "string") return null;
  return data as ErrorResponse;
}

function resolveMessage(body: ErrorResponse | null): string | null {
  if (!body) return null;

  const params =
    "params" in body && body.params && typeof body.params === "object"
      ? (body.params as Record<string, unknown>)
      : {};

  const translated = translateErrorCode(body.code, params);
  if (translated) return translated;

  if (typeof body.message === "string" && body.message.length > 0) {
    return body.message;
  }
  if (Array.isArray(body.message) && body.message.length > 0) {
    return body.message.map(stringifyMessagePart).filter(Boolean).join("; ");
  }

  return translateErrorCode("INTERNAL_SERVER_ERROR", {}) || null;
}

function translateErrorCode(
  code: string,
  params: Record<string, unknown>,
): string | null {
  const key = (I18N.errors as Record<string, string | undefined>)[code];
  if (!key) return null;
  const out = i18n.t(key, { ...params, defaultValue: "" });
  return typeof out === "string" && out.length > 0 ? out : null;
}

/** Converts one item from an array-shaped `body.message` into a readable string. */
function stringifyMessagePart(m: unknown): string {
  if (typeof m === "string") return m;
  if (m && typeof m === "object" && "message" in m) {
    return String((m as { message?: unknown }).message ?? "");
  }
  return JSON.stringify(m);
}
