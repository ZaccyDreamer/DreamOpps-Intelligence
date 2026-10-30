# REST API

Base path: `/api`. JSON errors use `{ "error": { "code": "...", "message": "..." } }`. Authenticated routes use the `dreamopps.sid` HTTP-only same-site session cookie. Admin routes require the server-side `ADMIN` role.

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/health` | Service and database readiness |
| POST | `/auth/register`, `/auth/login` | Create account / establish session |
| POST | `/auth/logout` | Destroy session |
| GET | `/auth/me` | Current user and profile |
| GET | `/opportunities` | Search, filters and pagination (`q`, `category`, `country`, `format`, `studyLevel`, `field`, `deadline`, `sort`, `page`, `limit`) |
| GET | `/opportunities/:slug` | Published opportunity details and source history |
| GET/PUT | `/profile` | Read and update current student's profile |
| GET | `/opportunities/:id/match` | Explainable match and eligibility assessment |
| GET | `/recommendations` | Ranked explainable matches |
| GET/PUT/DELETE | `/saved`, `/saved/:opportunityId` | Current student's saved opportunities |
| GET/POST/PATCH/DELETE | `/applications`, `/applications/:id` | Application tracker |
| GET/PUT | `/notifications/preferences` | Reminder preferences |
| DELETE | `/account` | Delete current account and cascaded data |
| GET/POST | `/admin/opportunities` | Review queue and create a draft |
| PUT | `/admin/opportunities/:id` | Edit listing |
| POST | `/admin/opportunities/:id/source` | Record source check and provenance |
| PATCH | `/admin/opportunities/:id/status` | Publish/archive/expire/flag and record event |
| GET | `/admin/opportunities/:id/history` | Verification event history |

Inputs are validated with Zod. Public listing APIs never expose drafts. No public admin account is provisioned; a trusted operator must promote a user using a secure database administration workflow.
