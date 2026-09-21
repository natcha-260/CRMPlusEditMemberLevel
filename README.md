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

## Member data

`src/lib/members/store.ts` is a **placeholder in-memory data source** with
three fictional sample members. The real Buzzebees CRM API is not wired up
yet; `src/lib/members/service.ts` is the interface the UI depends on and the
single place to swap in the live integration. State resets when the server
restarts.

Sample numbers to try: `0900000001`, `0900000002`, `0900000003`.

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
    members/        # Domain types, levels, data source
  proxy.ts          # Route gate (Next.js 16's renamed middleware)
```
