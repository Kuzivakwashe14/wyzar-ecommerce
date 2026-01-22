# WyZar E-commerce — Repository Notes

Developer scripts that interact with the database have been moved to `backend/scripts/`.

- `backend/scripts/list_users.js` — lists users from the database.
- `backend/scripts/make_admin.js` — sets a user's role to `ADMIN`. Pass an email as the first argument to target a different user, e.g. `node backend/scripts/make_admin.js user@example.com`.

Important: these scripts run against the backend database and require the backend environment (DB connection env vars and the Prisma client). Do NOT run them against production unless you intend to modify production data.

To run (from repository root):

```powershell
node backend/scripts/list_users.js
node backend/scripts/make_admin.js user@example.com
```
