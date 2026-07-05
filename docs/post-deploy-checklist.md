# Post-deploy security checklist

Run this checklist after every production deployment (and after major Preview changes that touch auth, env vars, or API routes).

## Quick automated verification

```bash
npm run verify:deploy -- https://your-production-domain.vercel.app
```

Or:

```bash
DEPLOY_URL=https://your-production-domain.vercel.app npm run verify:deploy
```

The script exits non-zero on failure and checks HTTPS redirect, security headers, Basic Auth gate, CORS/CSRF behavior, generic error responses, and local source env hygiene.

---

## 1. Environment variables (Vercel dashboard)

| Step | Action | How to verify |
|------|--------|---------------|
| [ ] | Set all required vars in **Production** (and separate values for **Preview** if applicable) | Vercel → Project → Settings → Environment Variables |
| [ ] | Confirm **Expose to Browser** is **disabled** for server secrets | `GEMINI_API_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `APP_BASIC_AUTH_*`, `APP_ALLOWED_ORIGIN` |
| [ ] | Set `APP_ALLOWED_ORIGIN` to your production host (host only, e.g. `trackros.vercel.app`) | Matches deployment hostname |
| [ ] | Use a strong, unique `APP_BASIC_AUTH_PASSWORD` | Not a default or predictable value |
| [ ] | Use separate Supabase projects for Preview vs Production (recommended) | Preview must not point at production data |
| [ ] | No secrets committed to git | `.env.local` untracked; only `.env.example` in repo |

**CLI reference (optional):**

```bash
vercel env ls
```

**Automated:** `npm run verify:deploy` scans source for accidental `NEXT_PUBLIC_*` secret prefixes and hardcoded key patterns.

---

## 2. HTTPS enforcement

| Step | Action | How to verify |
|------|--------|---------------|
| [ ] | Production URL uses HTTPS | Browser shows padlock; `http://` redirects to `https://` |
| [ ] | Custom domain (if used) has valid TLS certificate | Vercel → Domains shows valid cert |
| [ ] | HSTS header present | `Strict-Transport-Security` with `max-age` |

**Automated:** `npm run verify:deploy` checks HTTP→HTTPS redirect and HSTS header.

**Manual spot-check:**

```bash
curl -sI http://your-domain.vercel.app | grep -i location
curl -sI https://your-domain.vercel.app | grep -i strict-transport-security
```

---

## 3. CORS and CSRF

| Step | Action | How to verify |
|------|--------|---------------|
| [ ] | API routes do not reflect or wildcard `Access-Control-Allow-Origin` | No `Access-Control-Allow-Origin: *` or reflected evil origin |
| [ ] | Cross-site browser requests to API routes return **403** | `Sec-Fetch-Site: cross-site` blocked by `lib/csrf.ts` |
| [ ] | Server Actions `allowedOrigins` includes production host | `APP_ALLOWED_ORIGIN` set; see `next.config.ts` |
| [ ] | Basic Auth gate active on all non-static routes | Unauthenticated requests return **401** |

**Automated:** `npm run verify:deploy` sends cross-origin and cross-site requests to `/api/food/search`.

**Manual spot-check:**

```bash
curl -sI -H "Origin: https://evil.example" "https://your-domain.vercel.app/api/food/search?q=apple"
curl -sI -H "Sec-Fetch-Site: cross-site" "https://your-domain.vercel.app/api/food/search?q=apple"
```

---

## 4. Generic error pages (no stack trace leakage)

| Step | Action | How to verify |
|------|--------|---------------|
| [ ] | Global error page shows generic message only | `app/global-error.tsx` — no raw `error.message` |
| [ ] | API errors return sanitized JSON messages | No Postgres/Gemini internals in responses |
| [ ] | 404 and validation errors do not expose stack traces | No `at Function.`, file paths, or `node_modules` in HTML/JSON |

**Automated:** `npm run verify:deploy` fetches a 404 path and an invalid API query and scans for stack-trace markers.

**Manual spot-check:**

```bash
curl -s "https://your-domain.vercel.app/does-not-exist" | head
curl -s "https://your-domain.vercel.app/api/food/search?q=" | head
```

---

## 5. Additional production hygiene

| Step | Action |
|------|--------|
| [ ] | Re-apply RLS section from `supabase/schema.sql` on live Supabase (if not already done) |
| [ ] | Rotate Supabase service-role and Gemini keys if they may have been exposed |
| [ ] | Consider **Vercel Deployment Protection** for Preview and/or Production |
| [ ] | Run `npm run audit` — zero high/critical vulnerabilities |
| [ ] | Run `npm test` — all tests pass |

---

## Sign-off

| Field | Value |
|-------|-------|
| Deploy URL | |
| Deploy date | |
| Verified by | |
| `verify:deploy` result | PASS / FAIL |
| Notes | |

---

*See also: [`.cursor/security-plan.md`](../.cursor/security-plan.md) for the full security posture and prioritized backlog.*
