# Going Live: Shared Database & Partner Logins

This turns the Food Network page from "saves in my browser" into a live
shared system: every partner signs in with their own email + password,
and every add or edit appears for all signed-in partners within a
second. The network is private — without a login, visitors see only a
sign-in screen; the map, directory, and all site data stay hidden.

It uses [Supabase](https://supabase.com) (a hosted database with
built-in logins; the free tier comfortably covers this network's scale).
Setup takes about 15 minutes, no coding required.

## 1. Create the database

1. Go to <https://supabase.com> and sign up (free).
2. Click **New project**. Name it `sfua-food-network`, choose a region
   (e.g. *West US*), and set a strong database password (you won't need
   it day-to-day — store it somewhere safe).
3. Wait a minute for the project to finish provisioning.

## 2. Create the table and security rules

1. In the left sidebar, open **SQL Editor** → **New query**.
2. Open the file `supabase/schema.sql` from this repository, copy its
   entire contents, paste it into the editor, and click **Run**.

That creates the `sites` table, the security rules (only signed-in
partners can view or write), live updates, and the placeholder entries
from the June 2026 convening.

## 3. Lock sign-ups to invite-only

1. Go to **Authentication → Sign In / Providers** (naming varies
   slightly by dashboard version).
2. Turn **off** "Allow new users to sign up". Now only accounts you
   create can log in.

## 4. Create one login per partner

For each partner organization:

1. Go to **Authentication → Users → Add user → Create new user**.
2. Enter the partner's email and a password, and check
   **Auto Confirm User**.
3. Send them the page link and their login (ask them to keep the
   password reasonably private — a login can edit any entry).

Suggested first accounts: Seeds of Hope, Hollywood Food Coalition,
Freedom Farms Collective, Food Access LA, Project Angel Food, LADPH,
plus your own.

## 5. Connect the website

1. Go to **Project Settings → API** (or **Data API**).
2. Copy the **Project URL** and the **anon / public** key.
3. Paste both into `assets/data/config.js` in this repository:

   ```js
   window.SFUA_CONFIG = {
     SUPABASE_URL: "https://YOURPROJECT.supabase.co",
     SUPABASE_ANON_KEY: "eyJ...the long key..."
   };
   ```

4. Commit and push. Once the site deploys, the page banner switches
   from "Prototype mode" to "Live network", and the Sign in button
   appears.

> The anon key is designed to be public — it can only do what the
> security rules in step 2 allow, and those require a login for every
> read and write. Don't publish the `service_role` key, which appears
> on the same settings page.

## 6. Verify

1. Open the page — you should see only the partner sign-in screen, with
   no map or site data.
2. Open it in two browser windows and sign in within both (any account).
3. Add a test site in one window and watch it appear in the other
   without a refresh, then delete it.

## A note on what "private" covers

Partner logins protect all the **data** — every site, capacity, and
contact detail lives only in the database and is unreadable without
signing in. The page itself (layout, wording, the placeholder file
`assets/data/sites.seed.js` from the convening) is part of this website
and repository, so it is as visible as the rest of the site. If you
want even that hidden while you build, keep the repository/preview
private too.

## Day-to-day

- **Add/remove a partner:** Authentication → Users.
- **Partners change their own passwords** on the page itself:
  **Account → Change your password** (top of the app once signed in).
  Encourage everyone to do this on first login.
- **If a partner is locked out** (forgot password): Authentication →
  Users → that user → Reset password (or create a fresh account).
- **Back up the data:** any visitor can use **Data & Sharing →
  Export (JSON)** on the page; that snapshot is also what powers
  network modeling and optimization analysis.
- **Bulk edits:** the Table Editor in Supabase edits rows directly,
  like a spreadsheet.
