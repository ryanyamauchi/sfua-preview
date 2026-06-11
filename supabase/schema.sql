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
-- Placeholder entries from the June 2026 convening.
-- Each organization replaces these with verified data.
-- ------------------------------------------------------------
insert into public.sites
  (org, site_name, type, address, lat, lng, products, cold_storage, cold_storage_details, transport, schedule, contracts, needs_served, notes, verified)
values
  ('Seeds of Hope (Episcopal Diocese of LA)',
   'Seeds of Hope — Network Hub (Cathedral Center)',
   'distribution',
   '840 Echo Park Ave, Los Angeles, CA 90026', 34.0779, -118.2602,
   'Fresh produce from diocesan gardens and farms across LA County',
   false, null, null, null, null,
   'Food pantries and feeding programs across the diocese',
   'Placeholder from the June 2026 convening. Seeds of Hope operates many garden, farm, and pantry sites — each should be entered as its own site.',
   false),

  ('Hollywood Food Coalition',
   'HoFoCo Community Exchange (food recovery & redistribution)',
   'aggregator',
   '5939 Hollywood Blvd, Los Angeles, CA 90028', 34.1016, -118.3206,
   'Recovered/donated food redistributed to partner nonprofits',
   true, 'Cold storage on site — capacity to be confirmed by HoFoCo', null, null, null,
   'Partner nonprofits across Hollywood and central LA',
   'Placeholder from the June 2026 convening — HoFoCo to confirm details.',
   false),

  ('Hollywood Food Coalition',
   'HoFoCo Nightly Community Dinner',
   'kitchen',
   '1760 N Gower St, Los Angeles, CA 90028', 34.1041, -118.3219,
   'Hot meals served nightly',
   false, null, null, 'Nightly dinner service', null,
   'Unhoused and food-insecure neighbors in Hollywood',
   'Placeholder from the June 2026 convening — HoFoCo to confirm details.',
   false),

  ('Project Angel Food',
   'Project Angel Food Kitchen & Headquarters',
   'kitchen',
   '922 Vine St, Los Angeles, CA 90038', 34.0880, -118.3266,
   'Medically tailored meals, prepared and delivered countywide',
   true, 'Commercial kitchen cold storage — capacity to be confirmed',
   'Delivery fleet serving LA County — details to be confirmed', null,
   'Medically tailored meal contracts (e.g., health plan partnerships) — to be confirmed',
   'Clients with serious illness across LA County',
   'Placeholder from the June 2026 convening — Project Angel Food to confirm details.',
   false),

  ('Food Access LA',
   'Crenshaw Farmers'' Market',
   'market',
   '3650 W Martin Luther King Jr Blvd, Los Angeles, CA 90008', 34.0107, -118.3340,
   'Local farm produce; CSA and market-match programs',
   false, null, null, 'Weekly market — schedule to be confirmed', null,
   'South LA residents; nutrition-incentive shoppers',
   'Placeholder from the June 2026 convening. Food Access LA operates multiple markets and CSA programs — each should be entered as its own site.',
   false),

  ('Freedom Farms Collective',
   'Freedom Farms Collective — Growing Sites (location TBD)',
   'producer',
   'South Los Angeles (exact sites to be entered by the collective)', 33.9580, -118.2480,
   'Locally grown produce',
   false, null, null, null, null, null,
   'Placeholder pin only — Freedom Farms Collective to enter each growing site with real locations and capacity.',
   false),

  ('LA County Department of Public Health',
   'LADPH — Nutrition & Food Security (convening partner)',
   'partner',
   '313 N Figueroa St, Los Angeles, CA 90012', 34.0601, -118.2461,
   null, false, null, null, null, null,
   'Countywide food and nutrition security programs, data, and policy support',
   'Convening and public-health data partner; not a physical food site. Placeholder from the June 2026 convening.',
   false);
