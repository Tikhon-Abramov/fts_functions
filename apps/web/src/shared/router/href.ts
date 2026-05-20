/**
 * `href(path)` — prefix an in-app path with Vite's `BASE_URL` so
 * `<a href={...}>` and `<MuiLink href={...}>` navigate within the SPA's
 * deploy prefix (e.g. `/dev/19/`). Without this, an absolute href like
 * `/login` would escape the SPA and hit nginx's other locations.
 *
 * In dev (`BASE_URL = "/"`) this is a no-op; in prod the prefix is
 * pinned by `vite.config.ts`.
 */
export function href(path: string): string {
  const base = import.meta.env.BASE_URL.replace(/\/$/, "");
  if (!path.startsWith("/")) return `${base}/${path}`;
  return `${base}${path}`;
}
