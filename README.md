# CRM Plus — Edit Member Level

Internal web tool for looking up a customer by phone number and changing their
member level, with an audit trail of every change.

It replaces the Google Apps Script version and is **gated behind a
username/password login** — nobody can search or change a level without
signing in first.

## Stack

- [Next.js](https://nextjs.org) 16 (App Router)
- React 19
- TypeScript
- Tailwind CSS 4
- [`jose`](https://github.com/panva/jose) for signed session cookies

## Getting started

Requires Node.js 20 or newer.

```bash
npm install
cp .env.example .env.local
```

Fill in `.env.local` (see [Authentication](#authentication)), then:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). You will land on the login
page.

## Authentication

Two environment variables drive the login.

### `SESSION_SECRET`

Signs the session cookie. At least 32 characters; the app refuses to start a
session without it.

```bash
openssl rand -base64 48
```

### `AUTH_USERS`

The operators allowed to sign in. Entries are separated by `;` or a newline,
fields by `|`:

```
<username>|<display name>|<password hash>
```

Passwords are never stored in plain text. Generate a hash with:

```bash
npm run auth:hash -- somchai "Somchai J."
```

The script prompts for the password on stdin (so it stays out of your shell
history), then prints a line to paste into `AUTH_USERS`. Minimum password
length is 12 characters.

```
AUTH_USERS="somchai|Somchai J.|scrypt:16384:8:1:<salt>:<hash>;malee|Malee S.|scrypt:..."
```

### How it works

| Concern | Where |
| --- | --- |
| Password hashing | scrypt (`N=16384, r=8, p=1`), per-user random salt, constant-time compare — `src/lib/auth/users.ts` |
| Session | HS256 JWT in an `HttpOnly`, `SameSite=Lax` cookie, 8-hour expiry, `Secure` in production — `src/lib/auth/session.ts` |
| Route gating | `src/proxy.ts` verifies the cookie signature and redirects to `/login` |
| Authoritative check | `requireSession()` re-checks in every page and Server Action — `src/lib/auth/dal.ts` |
| Brute-force throttle | 5 failed attempts per username per 10 minutes — `src/lib/auth/rate-limit.ts` |

The proxy is a redirect convenience, not the security boundary: every Server
Action calls `requireSession()` itself, per the Next.js guidance that Proxy
should not be the only line of defence.

Two things to know before deploying:

- The login throttle is **in-memory**, so it resets on restart and is per
  instance. Move it to Redis (or similar) before running more than one
  instance.
- Sessions are stateless. Rotating `SESSION_SECRET` signs everyone out, but
  there is no way to revoke a single session before it expires.

## Deploying

The app builds to a Docker image via the root `Dockerfile` — a multi-stage
build that emits Next.js' `standalone` output, so the runtime image carries
only the traced dependencies and runs as a non-root user.

```bash
docker build -t crmplus-edit-member-level .
docker run --rm -p 3000:3000 \
  -e SESSION_SECRET="$(openssl rand -base64 48)" \
  -e AUTH_USERS='somchai|Somchai J.|scrypt:...' \
  crmplus-edit-member-level
```

The server reads `PORT` and `HOSTNAME` at startup; the image defaults to
`0.0.0.0:3000` and a platform that injects `PORT` overrides it.

### Railway

`railway.json` pins the Dockerfile builder and points the healthcheck at
`/api/health`. Connect the repository and set two service variables:

| Variable | |
| --- | --- |
| `SESSION_SECRET` | Random, 32+ characters |
| `AUTH_USERS` | Operator entries — see [Authentication](#authentication) |

Neither is needed at build time: every route that reads them is rendered on
demand, so the image itself holds no secrets.

`/api/health` is unauthenticated and returns 503 listing any missing variable,
so a misconfigured deploy fails its healthcheck instead of coming up broken.

## Buzzebees integration

Server-side only — `src/lib/buzzebees/` is marked `server-only`, so no
credential or token reaches the browser.

| Module | Purpose |
| --- | --- |
| `config.ts` | Base URLs, `app-id`, merchant credentials |
| `auth.ts` | `POST /merchant/login` (multipart), token cache, single-flight |
| `client.ts` | Authorized fetch, retries once on 401 with a fresh token |
| `profile.ts` | `GET /pos/profile?contactNumber=…` |

The token is sent as `Authorization: token <access_token>` — the scheme is the
literal word `token`, not `Bearer`.

> **Credentials are hardcoded** in `src/lib/buzzebees/config.ts` by request.
> They are visible to anyone with repository access and remain in git history
> after removal, so rotate them if that ever stops being acceptable. Moving
> them to `process.env.*` is a change to that one file; nothing else depends
> on how they are sourced.

### Verifying the connection

The endpoints are unreachable from some networks, so there is a diagnostic
route. Sign in first — it requires an app session and never returns the token.

```bash
# login only
curl -b cookies.txt http://localhost:3000/api/buzzebees/health

# login + customer lookup
curl -b cookies.txt 'http://localhost:3000/api/buzzebees/health?contactNumber=0901614282'
```

## Member data

`src/lib/members/store.ts` is still a **placeholder in-memory data source**
with three fictional sample members, and it is what the UI reads today.
Wiring the UI to `/pos/profile` needs the live response field names, which
the diagnostic route above reports. `src/lib/members/service.ts` is the
interface to map them onto.

Sample numbers for the placeholder store: `0900000001`, `0900000002`,
`0900000003`.

## Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Start the development server |
| `npm run build` | Create a production build |
| `npm run start` | Serve the production build |
| `npm run lint` | Lint the project |
| `npm run auth:hash -- <username> [name]` | Generate an `AUTH_USERS` entry |

## Project layout

```
src/
  app/
    actions/        # Server Actions (auth, member lookup and level change)
    login/          # Login page and form
    layout.tsx      # Root layout, fonts and metadata
    page.tsx        # The console, behind requireSession()
  components/       # UI: tabs, member card, history, modals
  lib/
    auth/           # Sessions, user store, rate limiting, access checks
    buzzebees/      # Buzzebees API: credentials, merchant login, profile
    members/        # Domain types, levels, data source
  proxy.ts          # Route gate (Next.js 16's renamed middleware)
```
