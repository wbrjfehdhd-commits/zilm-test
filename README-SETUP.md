# Deploying the Admin/Owner system on Vercel

## 1. Push this folder to a GitHub repo, then import it in Vercel
(vercel.com → Add New → Project → import the repo). Framework preset: "Other" — no build step needed.

## 2. Add an Upstash Redis database
Two ways to do this — pick whichever is easier for you:

- **Via Vercel Marketplace (recommended):** in the Vercel project → **Storage** tab → **Create Database** → choose **Upstash** → **Redis**. This auto-adds `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` to your project's env vars — you don't set those by hand.
- **Directly on upstash.com:** create a free Redis database there, then copy its `REST URL` and `REST TOKEN` into Vercel → Project Settings → Environment Variables as `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN`.

## 3. Set your Owner account
On **your own machine** (not in any chat or ticket), pick a real password and run:

```
npm install
node scripts/hash-password.mjs "your-new-password"
```

It prints a salt + hash. In Vercel → Project Settings → **Environment Variables**, add:

- `OWNER_USERNAME` — whatever username you want to log in with
- `OWNER_PASSWORD_SALT` — from the script output
- `OWNER_PASSWORD_HASH` — from the script output
- `SESSION_SECRET` — any long random string, e.g. generate one with:
  `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`

## 4. Redeploy
Env var changes need a redeploy to take effect (Vercel → Deployments → ⋯ → Redeploy).

## 5. Try it
- Visit `/staff-login.html` and sign in with your Owner username/password.
- You'll land on `/owner.html` — add your first Admin account there (its password is hashed
  the instant it hits the server; you never see or store it in plain text again).
- That admin can now sign in at `/staff-login.html` and lands on `/admin.html`, where they can
  see and update everything submitted through `/report.html` and `/unban.html`.

## What's actually protecting things
- Passwords are hashed with `scrypt` (Node's built-in, no external dependency) — plaintext is
  never stored.
- Sessions are signed cookies (HMAC-SHA256 with `SESSION_SECRET`), `HttpOnly` + `Secure`, so
  they can't be read or forged from the browser.
- Every admin/owner API route re-checks the session server-side on each request — the
  dashboards don't just hide buttons with CSS, the data itself is refused to unauthenticated requests.

## Known limitation
`admin.html` and `owner.html` are static files, so the page *shell* (header, layout, no data)
loads before the JS checks your session and redirects if you're not signed in. No real report
data or admin data is ever sent to an unauthenticated browser — the API refuses it — but if you
want the HTML itself to never even reach a logged-out visitor, that requires moving this to a
framework Vercel can server-render (e.g. Next.js) with Edge Middleware. Happy to help with that
migration if you want it later.
