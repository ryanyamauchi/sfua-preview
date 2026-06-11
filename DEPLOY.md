# Deploying to a Live URL

The Food Network is a static site — no build step, no server. Either
free host below works; both auto-redeploy every time the repo updates.
Config files for both are already in the repo (`netlify.toml`,
`vercel.json`), so deploying is just connecting the repo.

**First: make the GitHub repo private** (GitHub → Settings → General →
Danger Zone → Change visibility). Both hosts below deploy private
repos for free; GitHub Pages does not, which is why we're not using it.

## Option A — Netlify (recommended: simplest)

1. Go to <https://app.netlify.com> and sign up with your GitHub account.
2. **Add new site → Import an existing project → GitHub** → pick
   `sfua-preview`.
3. Leave every setting as-is (the repo's `netlify.toml` handles it) and
   click **Deploy**.
4. You'll get a URL like `https://something.netlify.app`. Rename it
   under **Site configuration → Site details → Change site name**
   (e.g. `sfua-foodnetwork.netlify.app`), or attach a domain you own
   (e.g. `network.sfua.org`) under **Domain management**.

Share `https://<your-site>/network.html` with partners.

## Option B — Vercel

1. Go to <https://vercel.com> and sign up with GitHub.
2. **Add New → Project** → import `sfua-preview`.
3. Framework preset: **Other**. Leave the rest default → **Deploy**.
4. Rename / add a domain under **Settings → Domains**.

## What "private" means once deployed

- All partner **data** is locked behind the logins (the Supabase rules
  require sign-in for every read and write).
- The **page itself** (layout, wording, the pre-filled baseline in
  `assets/data/sites.seed.js`) is reachable by anyone who has the URL.
  The URL isn't listed or indexed anywhere, but treat it as
  "unlisted", not secret. Password-protecting the whole page is a paid
  feature on both hosts; the partner-login gate covers the data, which
  is what matters.

## After deploying

1. Do the database setup if you haven't (`SETUP-LIVE-DATABASE.md`).
2. Paste the Supabase URL + anon key into `assets/data/config.js`,
   commit, push — the host redeploys automatically and the live site
   switches from prototype mode to the locked sign-in screen.
3. Open the live URL, sign in, and do your dry run.
