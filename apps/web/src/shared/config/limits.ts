/** Business rules enforced on the client (complement to backend validation). */
// prettier-ignore
export const LIMITS = {
  /** Max detail rows per function (client-side hint; backend doesn't enforce). */
  DETAILS_PER_FUNCTION:  50,
  /** Max DTI attachments per function. */
  DTIS_PER_FUNCTION:     30,
  /** Max characters in a free-text field (name, basis, purpose). */
  TEXT_FIELD_MAX:       512,
} as const;
