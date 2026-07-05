# Supabase setup for Trackros

## 1. Create a project

1. Go to [supabase.com/dashboard](https://supabase.com/dashboard) and create a project.
2. Open **Settings → API** and copy:
   - **Project URL** → `SUPABASE_URL`
   - **service_role** secret key → `SUPABASE_SERVICE_ROLE_KEY` (server-only; never expose to the browser)
3. Open **Settings → General** and note the **Reference ID** (for type generation).

## 2. Apply the schema

Paste and run [`schema.sql`](./schema.sql) in **SQL Editor**.

This enables RLS with no public policies. The Next.js server accesses the database with the service role key.

## 3. Configure environment

Copy `.env.example` to `.env.local` and fill in:

- `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`
- `GEMINI_API_KEY`
- `APP_BASIC_AUTH_USER` and `APP_BASIC_AUTH_PASSWORD` (required in production)

## 4. Regenerate TypeScript types (after schema changes)

Install the Supabase CLI once:

```bash
npm install -g supabase
```

Log in and link your project:

```bash
supabase login
supabase link --project-ref YOUR_PROJECT_REF
```

Generate types into the repo:

```bash
npm run gen:types
```

Or manually:

```bash
npx supabase gen types typescript --project-id YOUR_PROJECT_REF --schema public > types/database.types.ts
```

The checked-in `types/database.types.ts` matches `schema.sql` and can be used until you connect a live project.
