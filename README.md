# Trackros

**Macro & nutrient tracker** — log meals, hit daily goals, and browse history in a mobile-first Next.js app.

Trackros caches food lookups in Supabase, fills gaps with Gemini, and keeps day-to-day logging fast on a personal dashboard.

## Features

- **Dashboard** — macro rings (calories, protein, carbs, fat), remaining calories, and today’s meals by type
- **Meal Builder** — search foods, set portions, build meals, and reuse presets
- **Food Data** — browse, add, and edit foods in your personal database
- **Calendar** — review past days and nutrient totals
- **Settings** — daily goals, appearance (light/dark), and profile-based defaults
- **AI food lookup** — Gemini fills nutrient data when a food isn’t in the cache yet
- **Security** — HTTP Basic Auth gate, CSRF checks, CSP and security headers

### Nutrients tracked

| Macros | Micros |
|--------|--------|
| Calories, protein, carbs, fat | Fiber, sugar, sodium, saturated fat, trans fat, cholesterol, potassium, calcium, iron |

## Tech stack

| Layer | Choice |
|-------|--------|
| Framework | [Next.js](https://nextjs.org/) 15 (App Router) + React 19 |
| Language | TypeScript |
| Styling | Tailwind CSS 4 |
| State | Zustand |
| Database | [Supabase](https://supabase.com/) (Postgres, server-side via service role) |
| AI | [Google Gemini](https://ai.google.dev/) for food nutrient lookups |
| Validation | Zod |
| Tests | Vitest + Testing Library |

## Getting started

### Prerequisites

- Node.js 20+
- A [Supabase](https://supabase.com/) project
- A [Gemini API key](https://ai.google.dev/)

### 1. Clone and install

```bash
git clone https://github.com/Kael104/TrackRos.git
cd TrackRos
npm install
```

### 2. Configure environment

```bash
cp .env.example .env.local
```

Fill in the values (see [Environment variables](#environment-variables)).

### 3. Apply the database schema

In the Supabase dashboard → **SQL Editor**, run [`supabase/schema.sql`](supabase/schema.sql).

More detail: [`supabase/README.md`](supabase/README.md).

### 4. Run the app

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Environment variables

| Variable | Required | Description |
|----------|----------|-------------|
| `GEMINI_API_KEY` | Yes | Gemini API key for food nutrient lookups (server-only) |
| `SUPABASE_URL` | Yes | Supabase project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | Service role key (server-only — never expose to the browser) |
| `APP_BASIC_AUTH_USER` | Production | Basic Auth username |
| `APP_BASIC_AUTH_PASSWORD` | Production | Basic Auth password |
| `APP_ALLOWED_ORIGIN` | Production | Host only for CSRF / Server Actions (e.g. `trackros.vercel.app`) |

Copy from [`.env.example`](.env.example). Do not commit `.env` or `.env.local`.

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start Next.js with Turbopack |
| `npm run build` | Production build |
| `npm start` | Serve the production build |
| `npm run lint` | ESLint |
| `npm test` | Run Vitest once |
| `npm run test:watch` | Vitest in watch mode |
| `npm run audit` | `npm audit` at high severity |
| `npm run verify:deploy -- <url>` | Post-deploy security checks |
| `npm run gen:types` | Regenerate Supabase TypeScript types |

## Project structure

```
app/                 # Next.js App Router pages & API routes
components/          # UI (dashboard, meal builder, history, layout, …)
lib/                 # Shared logic (nutrients, validation, Supabase, CSRF, …)
store/               # Zustand stores
supabase/            # schema.sql and setup notes
types/               # Generated / shared TypeScript types
test/                # Vitest tests
docs/                # Deploy & ops checklists
```

## Pages

| Route | Purpose |
|-------|---------|
| `/` | Dashboard |
| `/meal-builder` | Build and log meals |
| `/food-data` | Manage the food database |
| `/calendar` | History calendar |
| `/settings` | Goals and appearance |

## Deploy

Designed for [Vercel](https://vercel.com/) (or any Node host that runs Next.js).

1. Set the environment variables in your host’s dashboard (Production and Preview as needed).
2. Set a strong `APP_BASIC_AUTH_PASSWORD` and `APP_ALLOWED_ORIGIN` for production.
3. Prefer separate Supabase projects for Preview vs Production.
4. After deploy, run:

```bash
npm run verify:deploy -- https://your-production-domain.vercel.app
```

Full checklist: [`docs/post-deploy-checklist.md`](docs/post-deploy-checklist.md).

## Security notes

- Secrets stay server-side (`GEMINI_API_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, Basic Auth).
- Supabase RLS is enabled with no public policies; the app uses the service role from the server only.
- Middleware enforces Basic Auth in production; CSRF helpers block cross-site API abuse.

## License

Private / unlicensed unless you add a `LICENSE` file.
