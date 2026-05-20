/**
 * Format an ISO timestamp as `dd.mm.yyyy hh:mm` in the local timezone.
 *
 * Returns the input unchanged when it cannot be parsed, so a malformed
 * `createdAt` from the backend stays visible instead of silently turning
 * into `Invalid Date` or an empty string.
 */
export function formatAuditTimestamp(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = d.getFullYear();
  const hh = String(d.getHours()).padStart(2, "0");
  const mi = String(d.getMinutes()).padStart(2, "0");
  return `${dd}.${mm}.${yyyy} ${hh}:${mi}`;
}
