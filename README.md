# DreamOpps Intelligence

**Discover opportunities. Match your potential. Make your next move.**

DreamOpps helps university and college students discover scholarships, internships, graduate roles, fellowships, competitions and grants with useful eligibility, deadline, source and next-step context.

## What is included

- Responsive React/Vite experience: landing, searchable discovery, opportunity details, sign-up/login, dashboard, preferences, explainable recommendations, saved items, application tracker, notifications/settings, admin review workflow, methodology, privacy and terms.
- Express REST API with validation, server-managed sessions, scrypt (N=32768, r=8, p=1) password hashing, student ownership checks and admin-only listing workflows.
- PostgreSQL/Prisma schema, migration, and clearly fictional demonstration records.
- Deterministic matching that distinguishes conflicts from missing information.
- No live AI/source credentials required. No genuine opportunity data is included.

## Architecture

See [architecture notes](docs/ARCHITECTURE.md), [API reference](docs/API.md), and [security notes](docs/SECURITY.md).

## Requirements and local setup

Node.js 22.12+ and npm 10+. PostgreSQL 14+ is needed for persistent API flows. Docker Compose is optional if Docker is installed.

```sh
cd Projects/DreamOpps-Intelligence
npm install
cp .env.example .env
```

Edit `DATABASE_URL` for your local PostgreSQL. To use the included compose service, run `docker compose up -d postgres` and keep the example URL. Then initialize and start:

```sh
npm run db:generate
npm run db:migrate
npm run db:seed
npm run dev
```

Web: <http://localhost:5173>; API: <http://localhost:4000/api>; health: <http://localhost:4000/api/health>.

## Install DreamOpps as an app

The web client is also an installable Progressive Web App (PWA). Deploy it over HTTPS, open it in Chrome on Android, then use the browser menu and choose **Install app** (or **Add to Home screen**, depending on the Chrome version). On desktop browsers, use the install icon in the address bar when available. Localhost is treated as a secure origin for development. The offline app shell and already downloaded static assets can open without a connection; API requests and account data are never cached for offline use.

For a local Android phone on the same Wi-Fi network, replace `192.168.1.20` below with the computer's LAN address. Both servers bind to `0.0.0.0`; allow ports 4000 and 5173 through the local firewall. The API and web client must be reachable from the phone. Production installs require HTTPS and a deployed API/database; the demo fallback is browse-only.

```sh
VITE_API_URL=http://192.168.1.20:4000/api WEB_ORIGIN=http://192.168.1.20:5173 npm run dev
```

## Environment

| Variable         | Purpose                                         |
| ---------------- | ----------------------------------------------- |
| `DATABASE_URL`   | PostgreSQL connection string                    |
| `SESSION_SECRET` | Random secret of at least 32 characters         |
| `WEB_ORIGIN`     | Exact allowed browser origin                    |
| `API_PORT`       | API listener (default 4000)                     |
| `NODE_ENV`       | Use `production` for production cookie behavior |
| `COOKIE_SECURE`  | Force Secure cookie (`true` behind HTTPS)       |

Do not put server secrets in Vite variables. The UI uses `http://localhost:4000/api` by default; set `VITE_API_URL` at web build time only when changing the public API base URL.

## Useful commands

```sh
npm run dev            # API and web
npm run build          # workspace production builds
npm run typecheck      # TypeScript checks
npm test               # workspace tests
npm run lint           # lint workspaces
npm run db:generate    # Prisma client
npm run db:migrate     # development migration
npm run db:deploy      # apply committed migrations
npm run db:seed        # fictional demonstration records
```

## Data and integrity

The seed records are fictional and carry `demo=true`, `UNKNOWN` credibility, `UNCHECKED` verification, and `example.invalid` provenance. They are never evidence of an active opening. Source credibility and current verification are separate fields. An import does not verify a listing. Admins must review before publishing. Any future feed connector must respect its authorization, terms, rate limits, and provenance requirements.

The browser displays clearly labelled sample records only when the API is unavailable. With the API and PostgreSQL configured, registration, profiles, saves, recommendations, application tracking, account deletion, notification preferences, and admin source review use persistent API routes and server-managed sessions. Private pages validate the session with the API; local storage is not treated as proof of sign-in. Failed API actions show errors instead of claiming they saved. Marking a record verified requires a recorded source URL and a specific administrator review note.

## Production guidance and limitations

Use TLS, a managed PostgreSQL service, strong secret management, backups and monitoring. Configure `WEB_ORIGIN` exactly. Do not deploy with the development session secret. Restrict database access and establish retention/deletion operations. Review CSRF settings if changing the same-site deployment model. Admin role provisioning should happen through a trusted database operator; there is no default admin credential or public admin signup.

This MVP has no real source integration, email delivery, or reminder scheduler. Admin promotion is a trusted database operator action documented in docs/admin-provisioning.md. Legal/privacy language needs jurisdiction-specific review. See docs for matcher limitations and security notes.

## Development status

Vitest covers explainable eligibility matching, the frontend smoke flow, API readiness and structured errors. Database-backed registration, sessions, student/admin separation, filtering, saves, applications and source-verification checks run as integration tests when `DATABASE_URL` points to a migrated PostgreSQL database. GitHub Actions starts PostgreSQL and runs those integration tests with lint, typecheck and production build checks. A local PostgreSQL instance is required to validate migrations and the persisted user journey.
