# Provisioning the first administrator

There is no public admin signup or default admin credential. First register a trusted operator using the normal registration endpoint, then have a trusted database operator promote that account through an authenticated database connection:

```sql
UPDATE "User"
SET "role" = 'ADMIN', "updatedAt" = CURRENT_TIMESTAMP
WHERE "email" = 'trusted.operator@example.org';
```

Verify exactly one row was updated. Have the operator log out and log in again so the new role is reflected in a fresh server-side session. Restrict database access, audit the change, and use an organization-managed email address. Do not run this statement with values copied from untrusted requests.
