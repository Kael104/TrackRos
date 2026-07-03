# Supabase setup for Trackros

## 1. Create a project

1. Go to [supabase.com/dashboard](https://supabase.com/dashboard) and create a project.
2. Open **Settings → API** and copy:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public** key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
3. Open **Settings → General** and note the **Reference ID** (for type generation).

## 2. Apply the schema

Paste and run [`schema.sql`](./schema.sql) in **SQL Editor**.

## 3. Configure environment

Copy `.env.example` to `.env.local` and fill in your Supabase values (keep your existing `GEMINI_API_KEY`).

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
