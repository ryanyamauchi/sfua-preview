-- ============================================================
-- SFUA — LA Regional Food Network
-- Supabase database setup
--
-- Run this once in your Supabase project:
-- Dashboard → SQL Editor → New query → paste this file → Run.
--
-- It creates the sites table, security rules (private network:
-- only signed-in partners can view or edit), live updates, and
-- the placeholder entries from the June 2026 convening.
-- ============================================================

create table if not exists public.sites (
  id                   uuid primary key default gen_random_uuid(),
  org                  text not null,
  site_name            text not null,
  type                 text not null,
  address              text,
  lat                  double precision,
  lng                  double precision,
  products             text,
  capacity             text,
  cold_storage         boolean not null default false,
  cold_storage_details text,
  transport            text,
  schedule             text,
  contracts            text,
  needs_served         text,
  offers_needs         text,
  contact_name         text,
  contact_email        text,
  notes                text,
  verified             boolean not null default false,
  created_by           text,
  updated_by           text,
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now()
);

-- Keep updated_at current on every edit
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

drop trigger if exists sites_updated_at on public.sites;
create trigger sites_updated_at
  before update on public.sites
  for each row execute function public.set_updated_at();

-- Security: private network — every read and write requires a
-- signed-in partner account.
alter table public.sites enable row level security;

drop policy if exists "Anyone can view sites" on public.sites;
drop policy if exists "Partners can view sites" on public.sites;
create policy "Partners can view sites"
  on public.sites for select to authenticated using (true);

drop policy if exists "Partners can add sites" on public.sites;
create policy "Partners can add sites"
  on public.sites for insert to authenticated with check (true);

drop policy if exists "Partners can edit sites" on public.sites;
create policy "Partners can edit sites"
  on public.sites for update to authenticated using (true);

drop policy if exists "Partners can remove sites" on public.sites;
create policy "Partners can remove sites"
  on public.sites for delete to authenticated using (true);

-- Live updates: broadcast changes to every open browser
alter publication supabase_realtime add table public.sites;

-- ------------------------------------------------------------
-- Baseline entries, pre-filled June 2026 from each partner's
-- public website and press coverage so organizations verify
-- and correct instead of starting blank. All verified=false;
-- coordinates approximate (placed from published addresses).
-- ------------------------------------------------------------
insert into public.sites
  (org, site_name, type, address, lat, lng, products, capacity, cold_storage, cold_storage_details, transport, schedule, contracts, needs_served, notes, verified)
values
  ('Seeds of Hope (Episcopal Diocese of LA)',
   'Seeds of Hope — Network Hub (St. Paul''s Commons)',
   'distribution',
   '840 Echo Park Ave, Los Angeles, CA 90026', 34.0779, -118.2602,
   'Fresh produce and food distributed through diocesan gardens, pantries, and meal programs',
   'Network-wide: ~5 million lbs/year across ~92 urban farms, ~75 pantries, ~70 meal programs; food distributed at ~80 sites monthly (per diocesela.org)',
   false, null, null, null, null,
   'Food pantries and feeding programs across the six-county diocese',
   'Pre-filled from seedsofhopela.org and diocesela.org (Jun 2026). Full distribution list at seedsofhopela.org/food-distributions.html — Seeds of Hope to verify and add remaining sites (incl. planned St. Simon''s food hub, San Fernando).',
   false),

  ('Seeds of Hope (Episcopal Diocese of LA)',
   'Saint Barnabas Episcopal Church — Food Distribution (Eagle Rock)',
   'market',
   '2109 Chickasaw Ave, Los Angeles, CA 90041', 34.1390, -118.2105,
   'Food distribution', null,
   false, null, null,
   'Thursdays 8:30–10:30am',
   null,
   'Eagle Rock neighbors',
   'Pre-filled from seedsofhopela.org food distributions (Jun 2026) — verify details and pin location.',
   false),

  ('Seeds of Hope (Episcopal Diocese of LA)',
   'St. Mary''s Episcopal Church — Food Distribution (Koreatown)',
   'market',
   '961 S Mariposa Ave, Los Angeles, CA 90006', 34.0526, -118.2986,
   'Food bags: shelf-stable items, rice, milk, fresh produce', null,
   false, null, null,
   '2nd & 4th Wednesday, 11am–1pm',
   'LA Regional Food Bank partner agency',
   'Koreatown neighbors',
   'Pre-filled from seedsofhopela.org food distributions (Jun 2026) — verify details and pin location.',
   false),

  ('Seeds of Hope (Episcopal Diocese of LA)',
   'St. James'' in-the-City — Pantry & Soup Kitchen (Wilshire)',
   'kitchen',
   '3903 Wilshire Blvd, Los Angeles, CA 90010', 34.0616, -118.3091,
   'Food distribution and prepared meals', null,
   false, null, null,
   'Distribution Thu 8–9am; soup kitchen Tue 4:30–6:30pm, Fri 3–5pm, Sat 10am–1pm',
   null,
   'Mid-Wilshire / Koreatown neighbors',
   'Pre-filled from seedsofhopela.org food distributions (Jun 2026) — verify details and pin location.',
   false),

  ('Hollywood Food Coalition',
   'HoFoCo Community Dinner (Salvation Army campus)',
   'kitchen',
   '5939 Hollywood Blvd, Los Angeles, CA 90028', 34.1016, -118.3206,
   'Hot meals served nightly', null,
   false, null, null,
   'Weekday dinner 6:30–8:00pm',
   null,
   'Unhoused and food-insecure neighbors in Hollywood',
   'Pre-filled from hofoco.org (Jun 2026) — HoFoCo to verify.',
   false),

  ('Hollywood Food Coalition',
   'HoFoCo Community Exchange & Wellness (Glassell Park)',
   'aggregator',
   '3056 Roswell St, Los Angeles, CA 90065', 34.1086, -118.2448,
   'Rescued surplus food from grocers, restaurants, caterers — redistributed',
   'Tens of thousands of lbs rescued; distributes to a network of 200+ community-based organizations across LA (per hofoco.org)',
   true, 'Cold storage assumed for food rescue operation — capacity to be confirmed by HoFoCo',
   null, null, null,
   '200+ partner CBOs serving food-insecure Angelenos',
   'Pre-filled from hofoco.org Community Exchange pages (Jun 2026) — HoFoCo to verify.',
   false),

  ('Project Angel Food',
   'Project Angel Food — Kitchen & Headquarters',
   'kitchen',
   '922 Vine St, Los Angeles, CA 90038', 34.0880, -118.3266,
   'Medically tailored meals, prepared and delivered countywide',
   '~10,000 meals prepared, packaged & delivered weekly; 7,157 clients served FY2025 (per angelfood.org)',
   true, 'Commercial kitchen cold storage — capacity to be confirmed',
   'Delivery operation covering the majority of LA County — fleet details to be confirmed',
   null,
   'Medically tailored meal programs (e.g., health plan partnerships) — to be confirmed',
   'Clients with serious illness across LA County; largest service areas South LA and Metro LA',
   'Pre-filled from angelfood.org (Jun 2026) — Project Angel Food to verify.',
   false),

  ('Food Access LA',
   'Hollywood Farmers'' Market',
   'market',
   '1600 Ivar Ave (Ivar & Selma), Los Angeles, CA 90028', 34.0993, -118.3289,
   'Regional farm produce; flagship market; market-wide "eat!" CSA boxes from 5–7 farms', null,
   false, null, null,
   'Sundays 8am–1pm',
   'CalFresh EBT / WIC accepted; Market Match nutrition incentives',
   'Hollywood-area shoppers; participating regional farmers',
   'Pre-filled from foodaccessla.org (Jun 2026) — Food Access LA to verify.',
   false),

  ('Food Access LA',
   'LA River Farmers'' Market (LA State Historic Park)',
   'market',
   '1245 N Spring St, Los Angeles, CA 90012', 34.0654, -118.2317,
   '25+ vendors including 7 California small farms', null,
   false, null, null,
   'Thursdays 3pm–7:30pm',
   'CalFresh EBT / WIC; Market Match',
   'Chinatown, Lincoln Heights & downtown-adjacent shoppers; participating farmers',
   'Pre-filled from foodaccessla.org (Jun 2026) — verify.',
   false),

  ('Food Access LA',
   'Central Ave Farmers'' Market (Constituent Services Center)',
   'market',
   '4301 S Central Ave, Los Angeles, CA 90011', 33.9988, -118.2562,
   'Regional farm produce; 20+ years serving the corridor', null,
   false, null, null,
   'Thursdays 9am–2pm, rain or shine',
   'CalFresh/SNAP with Market Match vouchers',
   'South Central LA residents along the Central Ave corridor',
   'Pre-filled from foodaccessla.org and LA City CD9 (Jun 2026) — verify.',
   false),

  ('Food Access LA',
   'Compton College Farmers'' Market (The Village, on campus)',
   'market',
   '1111 E Artesia Blvd, Compton, CA 90221', 33.8876, -118.2055,
   'Regional farm produce', null,
   false, null, null,
   'Wednesdays 3pm–7:30pm',
   'CalFresh EBT / Market Match; enrolled students get $20/week in vouchers',
   'Compton College students & faculty and the greater Compton community',
   'Pre-filled from foodaccessla.org and compton.edu (Jun 2026) — verify.',
   false),

  ('Food Access LA',
   'Atwater Village Farmers'' Market',
   'market',
   'Public parking lot #646, 3528 Larga Ave, Los Angeles, CA 90039', 34.1232, -118.2620,
   'Regional farm produce and prepared foods', null,
   false, null, null,
   'Sundays 9am–2pm',
   'CalFresh EBT / Market Match',
   'Atwater Village & northeast LA shoppers; participating farmers',
   'Pre-filled from foodaccessla.org (Jun 2026) — verify.',
   false),

  ('Food Access LA',
   'Echo Park Farmers'' Market',
   'market',
   'Sunset Blvd & Logan St, Los Angeles, CA 90026', 34.0772, -118.2563,
   'Regional farm produce and prepared foods', null,
   false, null, null,
   'Fridays 3pm–7:30pm',
   'CalFresh EBT / Market Match',
   'Echo Park shoppers; participating farmers',
   'Pre-filled from foodaccessla.org (Jun 2026) — verify.',
   false),

  ('Food Access LA',
   'Crenshaw Farmers'' Market (Fire Station #54 lot)',
   'market',
   '5730 Crenshaw Blvd, Los Angeles, CA 90043', 33.9893, -118.3350,
   'Regional farm produce, sprouts, breads, nuts, baked goods, prepared food', null,
   false, null, null,
   'Saturdays 10am–3pm',
   'CalFresh EBT / WIC; Market Match doubles CalFresh up to $20/day',
   'South LA: Angeles Mesa, Hyde Park, Leimert Park, View Park/Windsor Hills, Baldwin Hills',
   'Pre-filled from foodaccessla.org (Jun 2026) — verify.',
   false),

  ('Food Access LA',
   'Watts–Willowbrook Farmers'' Market (MLK medical campus)',
   'market',
   'MLK medical campus, 1680 E 120th St, Los Angeles, CA 90059', 33.9230, -118.2424,
   'Regional farm produce', null,
   false, null, null,
   'Recently reopened — schedule to be confirmed',
   'CalFresh EBT / Market Match',
   'Watts & Willowbrook residents; MLK campus patients and staff',
   'Pre-filled from foodaccessla.org and press coverage (Jun 2026) — verify location pin and schedule.',
   false),

  ('Freedom Farms Collective',
   'Freedom Farms — Anchor (McCarty Memorial Christian Church)',
   'producer',
   '4101 W Adams Blvd, Los Angeles, CA 90018', 34.0324, -118.3329,
   'Locally grown produce across a network of urban farms (backyards, alleys, rooftops, church land)',
   'Network goal: 37 urban farms across South & West LA; ~15 created (per partnershipforgrowthla.org / press, 2023)',
   false, null, null, null, null,
   'South and West LA communities',
   'Pre-filled from partnershipforgrowthla.org, freedom-farms.co, and press (Jun 2026) — collective to verify and add each growing site.',
   false),

  ('Freedom Farms Collective',
   'Epworth Farm (Saint Mark United Methodist Church)',
   'producer',
   'South Los Angeles — address to be confirmed', null, null,
   'Produce grown on a 9,500 sq ft church property',
   '9,500 sq ft growing space (per USC Annenberg Media, 2023)',
   false, null, null, null, null, null,
   'Pre-filled from press coverage (Jun 2026) — needs address and map pin from the collective.',
   false),

  ('Freedom Farms Collective',
   'Boden St. Community Garden',
   'producer',
   'Boden St, Los Angeles, CA 90016 (approximate)', 34.0246, -118.3577,
   'Squash, rainbow chard, and other garden produce', null,
   false, null, null, null, null,
   'West Adams neighbors',
   'Pre-filled from USC Annenberg Media coverage (Jun 2026) — pin is approximate; collective to confirm exact location.',
   false),

  ('LA County Department of Public Health',
   'LADPH — Nutrition & Food Security (convening partner)',
   'partner',
   '313 N Figueroa St, Los Angeles, CA 90012', 34.0601, -118.2461,
   null, null, false, null, null, null, null,
   'Countywide food and nutrition security programs, data, and policy support',
   'Convening and public-health data partner; not a physical food site.',
   false);
