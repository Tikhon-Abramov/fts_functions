import { test } from "@playwright/test";

/**
 * End-to-end auth flow: register → mock email-link visit → verify → login.
 *
 * This spec is FIXMED until a separate test fixture lands that handles:
 *   1. A real or mocked Resend stub so we can capture the verification token
 *      sent by `POST /v1/auth/register` (`ResendEmailService` falls back to a
 *      console-stub when `RESEND_API_KEY` is empty — but the token is only
 *      visible in stdout, not over an API).
 *   2. A test database seeded fresh per spec (`db:reset` is destructive at
 *      the project scope; we want a per-spec sandbox).
 *
 * When the email-capture fixture is ready, replace `test.fixme` with `test`
 * and follow the outline below.
 */
test.fixme("register → verify (via captured email link) → login → see registry home", async ({
  page,
}) => {
  // Outline:
  //   1. Navigate to /register and submit a brand-new email.
  //   2. Read the verification token from the email-capture fixture.
  //   3. Navigate to /verify-email?token=<captured>.
  //   4. Expect "Email подтверждён" success.
  //   5. Navigate to /login and submit the same credentials.
  //   6. Expect to land on `/` (registry home).

  await page.goto("/register");
  // ... TODO once email-capture fixture exists.
});
