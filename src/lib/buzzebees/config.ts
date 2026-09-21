import "server-only";

/**
 * Buzzebees API access.
 *
 * SECURITY: these credentials are hardcoded by request. They are readable by
 * anyone with access to this repository and stay in git history even if they
 * are later removed, so treat them as compromised the moment they need
 * rotating. To move them out, replace the values below with `process.env.*`
 * reads and add the variables to `.env.local` / the deployment environment —
 * nothing else in the codebase has to change.
 *
 * `server-only` keeps this module out of any client bundle, so the password is
 * never shipped to the browser.
 */

/** Hosts `POST /merchant/login`. */
export const MERCHANT_BASE_URL = "https://api1servicewallet.buzzebees.com";

/** Hosts `GET /pos/profile`. */
export const STAMP_WALLET_BASE_URL = "https://stampwalletmodule.buzzebees.com";

export const BUZZEBEES_APP_ID = "2377666859112635";

/** Sent as multipart/form-data fields to `POST /merchant/login`. */
export const MERCHANT_CREDENTIALS = {
  username: "admin-buz",
  password: "1234@Ssk",
  terminalid: "0000001",
  branchid: "344067",
  brandid: "0077245",
} as const;

/** Field names whose values must never reach a log or an error message. */
export const SECRET_FIELDS: readonly string[] = ["password"];
