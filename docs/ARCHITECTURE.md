# Architecture and matching

The project is an npm-workspaces TypeScript monorepo. `apps/web` is a Vite/React SPA, `apps/api` is an Express REST API, `packages/shared` holds shared public types, and `prisma` owns the PostgreSQL schema, migration, and explicitly fictional demo seed.

The API uses Prisma with its PostgreSQL driver adapter for domain persistence and Node scrypt (N=32768, r=8, p=1) for password hashes. This avoids native Prisma engine binaries on Android/Termux. Authentication is a server-managed, HTTP-only, same-site session cookie; the PostgreSQL session store uses a separate `http_sessions` table managed by `connect-pg-simple`. Role checks read the session, never request data. For cross-site deployment, use a same-site reverse-proxy origin or add a synchronizer CSRF token before relaxing cookie policy.

The initial matcher is deterministic. It adds relevance points for stated study level, field, country, preferred format, location, and interests. Conflicts are known mismatches against explicit requirements; unspecified requirements become missing information. “Confirmed” means only that the available fields do not conflict and required dimensions were present, not provider confirmation or guaranteed eligibility. Academic criteria are stored but not algorithmically interpreted yet. Scores are ranking guidance, never selection odds.

Ingestion is intentionally an interface boundary, not a scraper. Trusted APIs/feeds can normalize into `Opportunity` and `OpportunitySource`, retaining URL, authorization, retrieval and failure metadata. Admin review remains the publication gate. No external opportunity source or AI key is required to start the app.

The web shell uses fictional sample records when the API is unavailable. Authenticated profile, save, tracker, notification, account deletion, and admin review actions call the REST API; server permissions are required for private and admin operations.
