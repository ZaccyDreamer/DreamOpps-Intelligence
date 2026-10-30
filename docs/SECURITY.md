# Security notes

- Passwords are hashed with scrypt (N=32768, r=8, p=1); register/login are rate limited.
- Sessions are server-managed in PostgreSQL, with HTTP-only and same-site cookies; production secure-cookie behavior is enabled via `NODE_ENV=production` or `COOKIE_SECURE=true`.
- Helmet headers, explicit credentialed CORS origin, bounded JSON body size, Zod validation, and server-side role/object ownership checks are enabled.
- Secrets belong in an ignored `.env`, never in source control or `VITE_` variables. Change the example session secret before deployment.
- The default session secret is development-only; production startup should be configured to reject it. Database-backed session storage is configured when `DATABASE_URL` exists.
- Session cookies use SameSite Strict and JSON requests. If deployment changes the origin/cookie arrangement, add explicit CSRF token validation and review CORS/cookie settings.
- Account deletion cascades through profile, saved items, applications, preferences and sessions. Configure database backups and retention for the deployment environment.
- Do not collect passport documents, bank information, or other unnecessary sensitive data. Review privacy/security obligations jurisdiction by jurisdiction; this project does not claim global legal compliance.
- No verified listings are included. Demo records use `example.invalid` source URLs and are clearly fictional.
