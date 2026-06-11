/* ============================================================
   SFUA — LA Regional Food Network
   Shared baseline dataset

   This file is the network's shared source of truth. When a
   partner organization exports their site data from the Data &
   Sharing tab, merge it here (or replace the array with the
   merged export) and commit, so every partner loads the same
   baseline.

   All entries below are PLACEHOLDERS drafted after the June 2026
   convening (Paula Daniels, Seeds of Hope, LADPH, Hollywood Food
   Coalition, Freedom Farms Collective, Food Access LA, Project
   Angel Food, Kayla de la Haye). Addresses and coordinates are
   approximate public locations; capacities, contracts, and needs
   must be entered by each organization. verified:false until the
   organization confirms its own entry.
   ============================================================ */

window.SFUA_SEED_SITES = [
  {
    id: "seed-seeds-of-hope-hq",
    org: "Seeds of Hope (Episcopal Diocese of LA)",
    siteName: "Seeds of Hope — Network Hub (Cathedral Center)",
    type: "distribution",
    address: "840 Echo Park Ave, Los Angeles, CA 90026",
    lat: 34.0779, lng: -118.2602,
    products: "Fresh produce from diocesan gardens and farms across LA County",
    capacity: "",
    coldStorage: false, coldStorageDetails: "",
    transport: "",
    schedule: "",
    contracts: "",
    needsServed: "Food pantries and feeding programs across the diocese",
    offersNeeds: "",
    contactName: "", contactEmail: "",
    notes: "Placeholder from the June 2026 convening. Seeds of Hope operates many garden, farm, and pantry sites — each should be entered as its own site.",
    verified: false,
    updatedAt: "2026-06-11"
  },
  {
    id: "seed-hofoco-exchange",
    org: "Hollywood Food Coalition",
    siteName: "HoFoCo Community Exchange (food recovery & redistribution)",
    type: "aggregator",
    address: "5939 Hollywood Blvd, Los Angeles, CA 90028",
    lat: 34.1016, lng: -118.3206,
    products: "Recovered/donated food redistributed to partner nonprofits",
    capacity: "",
    coldStorage: true, coldStorageDetails: "Cold storage on site — capacity to be confirmed by HoFoCo",
    transport: "",
    schedule: "",
    contracts: "",
    needsServed: "Partner nonprofits across Hollywood and central LA",
    offersNeeds: "",
    contactName: "", contactEmail: "",
    notes: "Placeholder from the June 2026 convening — HoFoCo to confirm details.",
    verified: false,
    updatedAt: "2026-06-11"
  },
  {
    id: "seed-hofoco-dinner",
    org: "Hollywood Food Coalition",
    siteName: "HoFoCo Nightly Community Dinner",
    type: "kitchen",
    address: "1760 N Gower St, Los Angeles, CA 90028",
    lat: 34.1041, lng: -118.3219,
    products: "Hot meals served nightly",
    capacity: "",
    coldStorage: false, coldStorageDetails: "",
    transport: "",
    schedule: "Nightly dinner service",
    contracts: "",
    needsServed: "Unhoused and food-insecure neighbors in Hollywood",
    offersNeeds: "",
    contactName: "", contactEmail: "",
    notes: "Placeholder from the June 2026 convening — HoFoCo to confirm details.",
    verified: false,
    updatedAt: "2026-06-11"
  },
  {
    id: "seed-project-angel-food",
    org: "Project Angel Food",
    siteName: "Project Angel Food Kitchen & Headquarters",
    type: "kitchen",
    address: "922 Vine St, Los Angeles, CA 90038",
    lat: 34.0880, lng: -118.3266,
    products: "Medically tailored meals, prepared and delivered countywide",
    capacity: "",
    coldStorage: true, coldStorageDetails: "Commercial kitchen cold storage — capacity to be confirmed",
    transport: "Delivery fleet serving LA County — details to be confirmed",
    schedule: "",
    contracts: "Medically tailored meal contracts (e.g., health plan partnerships) — to be confirmed",
    needsServed: "Clients with serious illness across LA County",
    offersNeeds: "",
    contactName: "", contactEmail: "",
    notes: "Placeholder from the June 2026 convening — Project Angel Food to confirm details.",
    verified: false,
    updatedAt: "2026-06-11"
  },
  {
    id: "seed-food-access-la",
    org: "Food Access LA",
    siteName: "Crenshaw Farmers' Market",
    type: "market",
    address: "3650 W Martin Luther King Jr Blvd, Los Angeles, CA 90008",
    lat: 34.0107, lng: -118.3340,
    products: "Local farm produce; CSA and market-match programs",
    capacity: "",
    coldStorage: false, coldStorageDetails: "",
    transport: "",
    schedule: "Weekly market — schedule to be confirmed",
    contracts: "",
    needsServed: "South LA residents; nutrition-incentive shoppers",
    offersNeeds: "",
    contactName: "", contactEmail: "",
    notes: "Placeholder from the June 2026 convening. Food Access LA operates multiple markets and CSA programs — each should be entered as its own site.",
    verified: false,
    updatedAt: "2026-06-11"
  },
  {
    id: "seed-freedom-farms",
    org: "Freedom Farms Collective",
    siteName: "Freedom Farms Collective — Growing Sites (location TBD)",
    type: "producer",
    address: "South Los Angeles (exact sites to be entered by the collective)",
    lat: 33.9580, lng: -118.2480,
    products: "Locally grown produce",
    capacity: "",
    coldStorage: false, coldStorageDetails: "",
    transport: "",
    schedule: "",
    contracts: "",
    needsServed: "",
    offersNeeds: "",
    contactName: "", contactEmail: "",
    notes: "Placeholder pin only — Freedom Farms Collective to enter each growing site with real locations and capacity.",
    verified: false,
    updatedAt: "2026-06-11"
  },
  {
    id: "seed-ladph",
    org: "LA County Department of Public Health",
    siteName: "LADPH — Nutrition & Food Security (convening partner)",
    type: "partner",
    address: "313 N Figueroa St, Los Angeles, CA 90012",
    lat: 34.0601, lng: -118.2461,
    products: "",
    capacity: "",
    coldStorage: false, coldStorageDetails: "",
    transport: "",
    schedule: "",
    contracts: "",
    needsServed: "Countywide food and nutrition security programs, data, and policy support",
    offersNeeds: "",
    contactName: "", contactEmail: "",
    notes: "Convening and public-health data partner; not a physical food site. Placeholder from the June 2026 convening.",
    verified: false,
    updatedAt: "2026-06-11"
  }
];
