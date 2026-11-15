# Sleep Monitor frontend

## Supabase setup

1. Create a project at https://supabase.com/dashboard and wait for provisioning.
2. In the project's **Connect** dialog or **Settings ? API Keys**, copy the project URL and **publishable key** (a legacy `anon` key also works).
3. Copy `.env.example` to `.env.local` in this directory and fill in those two values. Never use a secret/service-role key or database password in a `VITE_` variable: Vite puts these values into the browser bundle.
4. Open the project's **SQL Editor** and run the complete contents of `supabase/migrations/202611150001_accounts_sleep.sql` once. It creates profiles, account-owned sleep records, a signup profile trigger, and row-level security policies.
5. Under **Authentication ? Providers**, enable Email. Keep email confirmation enabled; set minimum password length to 12 or higher.
6. Under **Authentication ? URL Configuration**, set Site URL to your app's actual local URL and allow its `/login` URL as a redirect. For example, `http://localhost:5173` and `http://localhost:5173/login`. If using `127.0.0.1` or another port, add that exact origin and `/login` URL too. Add production URLs when deploying.
7. Start or restart the app:

```powershell
cd frontend
npm.cmd install
npm.cmd run dev
```

Use the URL printed by Vite. Guest preview works before configuring Supabase; account forms show a setup message until configured.

## Accounts and sleep data

- `/register` creates a Supabase Auth user with a full name. With email confirmation enabled, check your email before signing in. Supabase may deliberately return a generic confirmation response for an existing email.
- `/login` signs in. The SDK persists and refreshes the session in browser storage; sign-out clears it. This replaces the local HTTP-only cookie implementation.
- `/data` shows sample records for guests and **only personal database records for signed-in users**. Use **Add record** to save a night's sleep. Fresh accounts start empty. One record per account per date is allowed.
- The insert payload does not provide `user_id`: Postgres defaults it to `auth.uid()`. Row-level security independently enforces ownership for reads, inserts, updates, and deletes.
- Overview and ML charts still display sample data. They do not yet aggregate personal sleep records, and no sensor ingestion is connected.
- Password recovery UI is not implemented yet.

The old SQLite backend is no longer used. Existing local accounts are not migrated and must register with Supabase. Any existing `.data/accounts.sqlite` is preserved and ignored by Git.

## Validation

```powershell
npm.cmd run test:accounts
npm.cmd run build
npm.cmd run lint
```

The automated account tests exercise the adapter with a mock SDK, not a live Supabase project.
After configuring the project, verify registration and email confirmation, sign in, add a record, refresh,
sign out, and repeat with a second account. The second account must start with no records.
Run `supabase/tests/ownership.sql` in SQL Editor to check read/write ownership with two temporary users;
it rolls back all fixtures. Run it after applying the migration.

## Deployment

The app is a static Vite build backed by Supabase; no local API server is needed. Configure the same public environment variables at build time and rebuild. Serve over HTTPS and configure SPA fallback to `index.html` for direct links such as `/login`.

Official references: [Supabase Auth signup](https://supabase.com/docs/reference/javascript/auth-signup), [user profiles](https://supabase.com/docs/guides/auth/managing-user-data), [row-level security](https://supabase.com/docs/guides/database/postgres/row-level-security).
