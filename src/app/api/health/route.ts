/**
 * Deployment health check.
 *
 * Reports whether the runtime configuration is complete. It names which
 * variables are missing but never their values, and is intentionally
 * unauthenticated so a platform probe can reach it before anyone signs in.
 *
 * Returning 503 on a misconfigured deploy is the point: a probe that only
 * checked that the process was listening would mark a broken release healthy,
 * because the login page renders fine right up until someone tries to log in.
 */
export async function GET() {
  const missing: string[] = [];

  const secret = process.env.SESSION_SECRET;
  if (!secret || secret.length < 32) missing.push("SESSION_SECRET");

  if (!process.env.AUTH_USERS?.trim()) missing.push("AUTH_USERS");

  if (missing.length > 0) {
    return Response.json({ ok: false, missing }, { status: 503 });
  }

  return Response.json({ ok: true });
}
