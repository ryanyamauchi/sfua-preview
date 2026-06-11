/* ============================================================
   SFUA — LA Regional Food Network
   Front-end app.

   Two data modes, detected at load:
   - LIVE: assets/data/config.js has Supabase credentials.
     Sites live in a shared database; anyone can view, signed-in
     partners can add/edit, and changes sync to every open
     browser in real time.
   - LOCAL (prototype fallback): no credentials configured.
     Sites save in this browser's localStorage, starting from
     the shared baseline in assets/data/sites.seed.js, with
     JSON export/import for sharing.
   ============================================================ */
(function () {
  "use strict";

  var STORE_KEY = "sfua-network-sites-v3";

  var TYPES = {
    producer:     { label: "Producer (farm / garden / grower)", color: "#3DF0A4" },
    aggregator:   { label: "Supplier / aggregator / food recovery", color: "#FFB454" },
    storage:      { label: "Storage (cold / dry)",               color: "#5EB3FF" },
    distribution: { label: "Distribution hub",                   color: "#FF8A5E" },
    kitchen:      { label: "Kitchen / meal provider",            color: "#FF6B8A" },
    market:       { label: "Market / pantry / food access program", color: "#C99CFF" },
    partner:      { label: "Agency / convening partner",         color: "#8A95A1" },
    other:        { label: "Other",                              color: "#E9EDF1" }
  };

  var TILE_URL = "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png";
  var TILE_ATTR = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>';

  var LA_CENTER = [34.02, -118.28];

  /* ---------------- data layer ---------------- */

  var cfg = window.SFUA_CONFIG || {};
  var live = !!(cfg.SUPABASE_URL && cfg.SUPABASE_ANON_KEY && window.supabase);
  var sb = live ? window.supabase.createClient(cfg.SUPABASE_URL, cfg.SUPABASE_ANON_KEY) : null;
  var user = null;
  var sites = live ? [] : loadLocal();

  function loadLocal() {
    try {
      var raw = localStorage.getItem(STORE_KEY);
      if (raw) return JSON.parse(raw);
    } catch (e) { /* corrupted store — fall back to baseline */ }
    return (window.SFUA_SEED_SITES || []).slice();
  }

  function persistLocal() {
    if (live) return;
    try { localStorage.setItem(STORE_KEY, JSON.stringify(sites)); } catch (e) {}
  }

  function canEdit() { return !live || !!user; }

  function fromRow(r) {
    return {
      id: r.id, org: r.org, siteName: r.site_name, type: r.type,
      address: r.address, lat: r.lat, lng: r.lng,
      products: r.products, capacity: r.capacity,
      coldStorage: !!r.cold_storage, coldStorageDetails: r.cold_storage_details,
      transport: r.transport, schedule: r.schedule,
      contracts: r.contracts, needsServed: r.needs_served, offersNeeds: r.offers_needs,
      contactName: r.contact_name, contactEmail: r.contact_email,
      notes: r.notes, verified: !!r.verified,
      updatedBy: r.updated_by,
      updatedAt: (r.updated_at || "").slice(0, 10)
    };
  }

  function toRow(s) {
    return {
      org: s.org, site_name: s.siteName, type: s.type,
      address: s.address || null, lat: s.lat, lng: s.lng,
      products: s.products || null, capacity: s.capacity || null,
      cold_storage: !!s.coldStorage, cold_storage_details: s.coldStorageDetails || null,
      transport: s.transport || null, schedule: s.schedule || null,
      contracts: s.contracts || null, needs_served: s.needsServed || null,
      offers_needs: s.offersNeeds || null,
      contact_name: s.contactName || null, contact_email: s.contactEmail || null,
      notes: s.notes || null, verified: !!s.verified
    };
  }

  function fetchSites() {
    return sb.from("sites").select("*").order("org").then(function (res) {
      if (res.error) {
        authNotice("Couldn't reach the live database (" + res.error.message + "). Showing nothing until it reconnects.");
        return;
      }
      sites = res.data.map(fromRow);
    });
  }

  function subscribeRealtime() {
    return sb.channel("sites-live")
      .on("postgres_changes", { event: "*", schema: "public", table: "sites" }, function (p) {
        if (p.eventType === "DELETE") {
          sites = sites.filter(function (s) { return s.id !== p.old.id; });
        } else {
          var s = fromRow(p.new), found = false;
          for (var i = 0; i < sites.length; i++) {
            if (sites[i].id === s.id) { sites[i] = s; found = true; break; }
          }
          if (!found) sites.push(s);
        }
        renderAll();
      })
      .subscribe();
  }

  function uid() {
    return "site-" + Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 7);
  }

  function typeInfo(t) { return TYPES[t] || TYPES.other; }

  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  function milesBetween(a, b) {
    var R = 3958.8, rad = Math.PI / 180;
    var dLat = (b.lat - a.lat) * rad, dLng = (b.lng - a.lng) * rad;
    var s = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(a.lat * rad) * Math.cos(b.lat * rad) *
            Math.sin(dLng / 2) * Math.sin(dLng / 2);
    return R * 2 * Math.atan2(Math.sqrt(s), Math.sqrt(1 - s));
  }

  function hasCoords(s) { return typeof s.lat === "number" && typeof s.lng === "number"; }

  /* ---------------- auth bar ---------------- */

  var authBar = document.getElementById("nw-authbar");

  function renderAuthBar() {
    if (!live) {
      authBar.innerHTML =
        '<div class="nw-auth nw-auth--local">' +
        "<span><strong>Prototype mode</strong> — entries save in this browser only. " +
        "Live shared logins aren't connected yet (see <code>SETUP-LIVE-DATABASE.md</code>).</span></div>";
      return;
    }
    if (user) {
      authBar.innerHTML =
        '<div class="nw-auth nw-auth--in">' +
        '<span><span class="nw-live-dot" aria-hidden="true"></span><strong>Live network</strong> — signed in as ' +
        "<strong>" + esc(user.email) + "</strong>. Your changes appear for all partners instantly.</span>" +
        '<button class="btn btn--outline nw-btn-sm" id="nw-signout">Sign out</button></div>';
      document.getElementById("nw-signout").addEventListener("click", function () {
        sb.auth.signOut();
      });
      return;
    }
    authBar.innerHTML =
      '<div class="nw-auth nw-auth--out">' +
      '<span><span class="nw-live-dot" aria-hidden="true"></span><strong>Private partner network</strong> — ' +
      "sign in below to view and edit.</span></div>";
  }

  function renderLock() {
    var locked = live && !user;
    document.getElementById("nw-app-body").hidden = locked;
    document.getElementById("nw-locked").hidden = !locked;
  }

  function authNotice(text) {
    var el = document.createElement("div");
    el.className = "nw-auth nw-auth--local";
    el.innerHTML = "<span>" + esc(text) + "</span>";
    authBar.appendChild(el);
  }

  /* ---------------- tabs ---------------- */

  var tabs = document.querySelectorAll(".nw-tab");

  function showView(name) {
    tabs.forEach(function (t) {
      var on = t.dataset.view === name;
      t.classList.toggle("is-active", on);
      t.setAttribute("aria-selected", on ? "true" : "false");
    });
    document.querySelectorAll(".nw-view").forEach(function (v) {
      var on = v.id === "view-" + name;
      v.classList.toggle("is-active", on);
      v.hidden = !on;
    });
    if (name === "map") initMainMap();
    if (name === "add") initFormMap();
    if (name === "regional") {
      // load the external dashboard only when first viewed
      var frame = document.getElementById("nw-regional-frame");
      if (frame && !frame.src) frame.src = frame.dataset.src;
    }
  }

  tabs.forEach(function (t) {
    t.addEventListener("click", function () { showView(t.dataset.view); });
  });

  document.querySelectorAll(".nw-jump-add").forEach(function (a) {
    a.addEventListener("click", function (e) { e.preventDefault(); showView("add"); scrollToApp(); });
  });
  document.querySelectorAll(".nw-jump-map").forEach(function (a) {
    a.addEventListener("click", function (e) { e.preventDefault(); showView("map"); scrollToApp(); });
  });
  document.querySelectorAll("[data-jump]").forEach(function (a) {
    a.addEventListener("click", function (e) { e.preventDefault(); showView(a.dataset.jump); scrollToApp(); });
  });

  function scrollToApp() {
    document.querySelector(".nw-app-section").scrollIntoView({ behavior: "smooth" });
  }

  /* ---------------- dashboard ---------------- */

  function renderDashboard() {
    var byType = {}, orgs = {}, cold = 0, verified = 0;
    sites.forEach(function (s) {
      byType[s.type] = (byType[s.type] || 0) + 1;
      orgs[s.org] = (orgs[s.org] || 0) + 1;
      if (s.coldStorage) cold++;
      if (s.verified) verified++;
    });

    var stats = [
      { n: sites.length, label: "Sites in the network" },
      { n: Object.keys(orgs).length, label: "Organizations" },
      { n: cold, label: "Sites with cold storage" },
      { n: verified + " / " + sites.length, label: "Entries verified" }
    ];
    document.getElementById("nw-stats").innerHTML = stats.map(function (s) {
      return '<div class="nw-stat"><span class="nw-stat-n">' + esc(s.n) +
             '</span><span class="nw-stat-label">' + esc(s.label) + "</span></div>";
    }).join("");

    document.getElementById("nw-org-breakdown").innerHTML =
      Object.keys(orgs).sort().map(function (org) {
        var rows = sites.filter(function (s) { return s.org === org; });
        return '<div class="nw-org-row"><strong>' + esc(org) + "</strong>" +
          '<span class="nw-org-types">' + rows.map(function (s) {
            return '<span class="nw-chip" style="--chip:' + typeInfo(s.type).color + '">' +
                   esc(typeInfo(s.type).label.split(" (")[0]) + "</span>";
          }).join("") + "</span></div>";
      }).join("");

    renderInsights();
  }

  function renderInsights() {
    var out = [];
    var producers = sites.filter(function (s) { return s.type === "producer" && hasCoords(s); });
    var coldSites = sites.filter(function (s) { return s.coldStorage && hasCoords(s); });
    var demand = sites.filter(function (s) {
      return (s.type === "kitchen" || s.type === "market" || s.type === "distribution") && hasCoords(s);
    });

    producers.forEach(function (p) {
      var nc = nearest(p, coldSites), nd = nearest(p, demand);
      if (nc) {
        out.push((nc.d > 8 ? "⚠️ " : "") + "<strong>" + esc(p.siteName) + "</strong> — nearest cold storage is <strong>" +
          esc(nc.site.siteName) + "</strong> (" + nc.d.toFixed(1) + " mi)" +
          (nc.d > 8 ? ". A storage gap worth discussing." : "."));
      } else {
        out.push("⚠️ <strong>" + esc(p.siteName) + "</strong> has no cold storage anywhere in the network yet.");
      }
      if (nd) {
        out.push("<strong>" + esc(p.siteName) + "</strong> could reach <strong>" + esc(nd.site.siteName) +
          "</strong> (" + esc(nd.site.org) + ") just " + nd.d.toFixed(1) + " mi away — a candidate local-producer-to-local-buyer link.");
      }
    });

    demand.forEach(function (d) {
      var np = nearest(d, producers);
      if (!np) {
        out.push("⚠️ <strong>" + esc(d.siteName) + "</strong> has no producer in the network yet — local sourcing here depends on recruiting growers.");
      } else if (np.d > 12) {
        out.push("⚠️ <strong>" + esc(d.siteName) + "</strong>'s nearest network producer is " + np.d.toFixed(1) +
          " mi away (" + esc(np.site.siteName) + ") — a sourcing gap to fill.");
      }
    });

    if (!producers.length) {
      out.push("No producer sites entered yet — the picture sharpens as growers add their locations and seasonal volumes.");
    }

    document.getElementById("nw-insights").innerHTML = out.length
      ? '<ul class="nw-insight-list">' + out.map(function (i) { return "<li>" + i + "</li>"; }).join("") + "</ul>"
      : '<p class="nw-muted">Add sites to generate signals.</p>';
  }

  function nearest(from, list) {
    var best = null;
    list.forEach(function (s) {
      if (s.id === from.id) return;
      var d = milesBetween(from, s);
      if (!best || d < best.d) best = { site: s, d: d };
    });
    return best;
  }

  /* ---------------- main map ---------------- */

  var mainMap = null, markerLayer = null;
  var activeTypes = {};
  Object.keys(TYPES).forEach(function (t) { activeTypes[t] = true; });

  function initMainMap() {
    if (!window.L) return;
    if (!mainMap) {
      mainMap = L.map("nw-map").setView(LA_CENTER, 10);
      L.tileLayer(TILE_URL, { maxZoom: 19, attribution: TILE_ATTR }).addTo(mainMap);
      markerLayer = L.layerGroup().addTo(mainMap);
      renderMapFilters();
    }
    setTimeout(function () { mainMap.invalidateSize(); }, 50);
    renderMarkers();
  }

  function renderMapFilters() {
    var wrap = document.getElementById("nw-map-filters");
    wrap.innerHTML = Object.keys(TYPES).map(function (t) {
      return '<label class="nw-filter" style="--chip:' + TYPES[t].color + '">' +
        '<input type="checkbox" data-type="' + t + '" checked /> ' +
        esc(TYPES[t].label.split(" (")[0]) + "</label>";
    }).join("");
    wrap.querySelectorAll("input").forEach(function (cb) {
      cb.addEventListener("change", function () {
        activeTypes[cb.dataset.type] = cb.checked;
        renderMarkers();
      });
    });
  }

  function renderMarkers() {
    if (!markerLayer) return;
    markerLayer.clearLayers();
    sites.forEach(function (s) {
      if (!hasCoords(s) || !activeTypes[s.type in TYPES ? s.type : "other"]) return;
      var c = typeInfo(s.type).color;
      var m = L.circleMarker([s.lat, s.lng], {
        radius: 9, color: c, weight: 2,
        fillColor: c, fillOpacity: s.verified ? 0.85 : 0.35
      });
      m.bindPopup(popupHtml(s), { maxWidth: 320 });
      m.addTo(markerLayer);
    });
  }

  function popupHtml(s) {
    var rows = [
      ["Role", typeInfo(s.type).label],
      ["Address", s.address],
      ["Products", s.products],
      ["Capacity", s.capacity],
      ["Cold storage", s.coldStorage ? (s.coldStorageDetails || "Yes") : ""],
      ["Transport", s.transport],
      ["Schedule", s.schedule],
      ["Commitments", s.contracts],
      ["Serves", s.needsServed],
      ["Offers / needs", s.offersNeeds]
    ].filter(function (r) { return r[1]; });
    return '<div class="nw-popup"><strong>' + esc(s.siteName) + "</strong><br/>" +
      '<span class="nw-popup-org">' + esc(s.org) + "</span>" +
      (s.verified ? "" : ' <span class="nw-badge nw-badge--unverified">unverified placeholder</span>') +
      "<table>" + rows.map(function (r) {
        return "<tr><th>" + esc(r[0]) + "</th><td>" + esc(r[1]) + "</td></tr>";
      }).join("") + "</table></div>";
  }

  /* ---------------- directory ---------------- */

  var dirSearch = document.getElementById("nw-dir-search");
  var dirType = document.getElementById("nw-dir-type");

  dirType.innerHTML = '<option value="">All roles</option>' +
    Object.keys(TYPES).map(function (t) {
      return '<option value="' + t + '">' + esc(TYPES[t].label) + "</option>";
    }).join("");

  dirSearch.addEventListener("input", renderDirectory);
  dirType.addEventListener("change", renderDirectory);

  function renderDirectory() {
    var q = dirSearch.value.toLowerCase().trim();
    var t = dirType.value;
    var list = sites.filter(function (s) {
      if (t && s.type !== t) return false;
      if (!q) return true;
      return [s.org, s.siteName, s.address, s.products, s.needsServed, s.offersNeeds, s.notes]
        .join(" ").toLowerCase().indexOf(q) !== -1;
    });

    document.getElementById("nw-dir-list").innerHTML = list.length ? list.map(function (s) {
      var updated = s.updatedAt
        ? s.updatedAt + (s.updatedBy ? " by " + s.updatedBy : "")
        : "";
      return '<article class="nw-card" style="--chip:' + typeInfo(s.type).color + '">' +
        '<div class="nw-card-head">' +
          "<div><h3>" + esc(s.siteName) + "</h3>" +
          '<p class="nw-card-org">' + esc(s.org) + "</p></div>" +
          '<span class="nw-chip" style="--chip:' + typeInfo(s.type).color + '">' +
            esc(typeInfo(s.type).label.split(" (")[0]) + "</span>" +
        "</div>" +
        (s.verified ? "" : '<p class="nw-badge nw-badge--unverified">unverified placeholder — please confirm or replace</p>') +
        cardRow("Address", s.address) +
        cardRow("Products", s.products) +
        cardRow("Capacity", s.capacity) +
        cardRow("Cold storage", s.coldStorage ? (s.coldStorageDetails || "Yes") : "") +
        cardRow("Transport", s.transport) +
        cardRow("Schedule", s.schedule) +
        cardRow("Existing commitments", s.contracts) +
        cardRow("Currently serves", s.needsServed) +
        cardRow("Offers / needs", s.offersNeeds) +
        cardRow("Notes", s.notes) +
        cardRow("Last updated", updated) +
        (canEdit()
          ? '<div class="nw-card-actions">' +
            '<button class="btn btn--outline nw-btn-sm" data-edit="' + esc(s.id) + '">Edit</button>' +
            '<button class="btn btn--outline nw-btn-sm nw-btn-danger" data-remove="' + esc(s.id) + '">Remove</button>' +
            "</div>"
          : "") +
        "</article>";
    }).join("") : '<p class="nw-muted">No sites match. Try clearing the filters, or add the first one in the Add a Site tab.</p>';

    document.querySelectorAll("[data-edit]").forEach(function (b) {
      b.addEventListener("click", function () { startEdit(b.dataset.edit); });
    });
    document.querySelectorAll("[data-remove]").forEach(function (b) {
      b.addEventListener("click", function () { removeSite(b.dataset.remove); });
    });
  }

  function removeSite(id) {
    var s = byId(id);
    if (!s) return;
    var warning = live
      ? 'Remove "' + s.siteName + '" from the live network for ALL partners?'
      : 'Remove "' + s.siteName + '" from your local copy of the network?';
    if (!confirm(warning)) return;
    if (live) {
      sb.from("sites").delete().eq("id", id).then(function (res) {
        if (res.error) alert("Couldn't remove: " + res.error.message);
        else { sites = sites.filter(function (x) { return x.id !== id; }); renderAll(); }
      });
    } else {
      sites = sites.filter(function (x) { return x.id !== id; });
      persistLocal(); renderAll();
    }
  }

  function cardRow(label, val) {
    return val ? '<p class="nw-card-row"><span>' + esc(label) + "</span>" + esc(val) + "</p>" : "";
  }

  function byId(id) {
    return sites.filter(function (s) { return s.id === id; })[0] || null;
  }

  /* ---------------- form ---------------- */

  var form = document.getElementById("nw-form");
  var formMap = null, formMarker = null;

  document.getElementById("f-type").innerHTML =
    '<option value="">Choose a role&hellip;</option>' +
    Object.keys(TYPES).map(function (t) {
      return '<option value="' + t + '">' + esc(TYPES[t].label) + "</option>";
    }).join("");

  function renderFormGate() {
    var locked = !canEdit();
    document.getElementById("nw-add-gate").hidden = !locked;
    form.hidden = locked;
  }

  function initFormMap() {
    if (!window.L || form.hidden) return;
    if (!formMap) {
      formMap = L.map("nw-form-map").setView(LA_CENTER, 9);
      L.tileLayer(TILE_URL, { maxZoom: 19, attribution: TILE_ATTR }).addTo(formMap);
      formMap.on("click", function (e) {
        setFormPin(e.latlng.lat, e.latlng.lng);
        document.getElementById("f-lat").value = e.latlng.lat.toFixed(5);
        document.getElementById("f-lng").value = e.latlng.lng.toFixed(5);
      });
      ["f-lat", "f-lng"].forEach(function (id) {
        document.getElementById(id).addEventListener("change", function () {
          var lat = parseFloat(document.getElementById("f-lat").value);
          var lng = parseFloat(document.getElementById("f-lng").value);
          if (!isNaN(lat) && !isNaN(lng)) setFormPin(lat, lng);
        });
      });
    }
    setTimeout(function () { formMap.invalidateSize(); }, 50);
  }

  function setFormPin(lat, lng) {
    if (!formMap) return;
    if (formMarker) formMarker.setLatLng([lat, lng]);
    else formMarker = L.marker([lat, lng]).addTo(formMap);
    formMap.panTo([lat, lng]);
  }

  function startEdit(id) {
    var s = byId(id);
    if (!s) return;
    showView("add");
    scrollToApp();
    document.getElementById("nw-form-heading").textContent = "Edit: " + s.siteName;
    document.getElementById("f-id").value = s.id;
    setVal("f-org", s.org); setVal("f-siteName", s.siteName);
    setVal("f-type", s.type); setVal("f-address", s.address);
    setVal("f-lat", hasCoords(s) ? s.lat : ""); setVal("f-lng", hasCoords(s) ? s.lng : "");
    setVal("f-products", s.products); setVal("f-capacity", s.capacity);
    document.getElementById("f-coldStorage").checked = !!s.coldStorage;
    setVal("f-coldStorageDetails", s.coldStorageDetails);
    setVal("f-transport", s.transport); setVal("f-schedule", s.schedule);
    setVal("f-contracts", s.contracts); setVal("f-needsServed", s.needsServed);
    setVal("f-offersNeeds", s.offersNeeds);
    setVal("f-contactName", s.contactName); setVal("f-contactEmail", s.contactEmail);
    setVal("f-notes", s.notes);
    document.getElementById("f-verified").checked = !!s.verified;
    if (hasCoords(s)) { initFormMap(); setFormPin(s.lat, s.lng); }
  }

  function setVal(id, v) { document.getElementById(id).value = v == null ? "" : v; }
  function getVal(id) { return document.getElementById(id).value.trim(); }

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    var org = getVal("f-org"), siteName = getVal("f-siteName"), type = getVal("f-type");
    if (!org || !siteName || !type) {
      formMsg("Organization, site name, and role are required.", true);
      return;
    }
    var lat = parseFloat(getVal("f-lat")), lng = parseFloat(getVal("f-lng"));
    var entry = {
      id: getVal("f-id"),
      org: org, siteName: siteName, type: type,
      address: getVal("f-address"),
      lat: isNaN(lat) ? null : lat, lng: isNaN(lng) ? null : lng,
      products: getVal("f-products"), capacity: getVal("f-capacity"),
      coldStorage: document.getElementById("f-coldStorage").checked,
      coldStorageDetails: getVal("f-coldStorageDetails"),
      transport: getVal("f-transport"), schedule: getVal("f-schedule"),
      contracts: getVal("f-contracts"), needsServed: getVal("f-needsServed"),
      offersNeeds: getVal("f-offersNeeds"),
      contactName: getVal("f-contactName"), contactEmail: getVal("f-contactEmail"),
      notes: getVal("f-notes"),
      verified: document.getElementById("f-verified").checked
    };

    if (live) {
      if (!user) { formMsg("Please sign in first.", true); return; }
      var row = toRow(entry);
      row.updated_by = user.email;
      var query;
      if (entry.id) {
        query = sb.from("sites").update(row).eq("id", entry.id);
      } else {
        row.created_by = user.email;
        query = sb.from("sites").insert(row);
      }
      formMsg("Saving…", false);
      query.then(function (res) {
        if (res.error) { formMsg("Couldn't save: " + res.error.message, true); return; }
        fetchSites().then(renderAll);
        resetForm();
        formMsg('"' + entry.siteName + '" saved to the live network — every partner can see it now.', false);
      });
    } else {
      entry.id = entry.id || uid();
      entry.updatedAt = new Date().toISOString().slice(0, 10);
      var idx = sites.map(function (s) { return s.id; }).indexOf(entry.id);
      if (idx >= 0) sites[idx] = entry; else sites.push(entry);
      persistLocal();
      resetForm();
      renderAll();
      formMsg('"' + entry.siteName + '" saved in this browser. Export from Data & Sharing when you\'re done.', false);
    }
  });

  function formMsg(text, isError) {
    var msg = document.getElementById("nw-form-msg");
    msg.textContent = text;
    msg.className = "nw-form-msg " + (isError ? "is-error" : "is-ok");
  }

  document.getElementById("nw-form-reset").addEventListener("click", resetForm);

  function resetForm() {
    form.reset();
    document.getElementById("f-id").value = "";
    document.getElementById("nw-form-heading").textContent = "Add a site to the network";
    if (formMarker) { formMarker.remove(); formMarker = null; }
  }

  /* ---------------- data & sharing ---------------- */

  function renderDataPanel() {
    document.getElementById("nw-flow-live").hidden = !live;
    document.getElementById("nw-flow-local").hidden = live;
    document.getElementById("nw-reset-baseline").hidden = live;
    // Bulk import writes to the shared database, so it needs a login
    document.getElementById("nw-import-label").hidden = live && !user;
  }

  document.getElementById("nw-export").addEventListener("click", function () {
    var payload = {
      exported: new Date().toISOString(),
      source: "SFUA LA Regional Food Network" + (live ? " (live)" : " (prototype)"),
      sites: sites
    };
    var blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    var a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "sfua-food-network-" + new Date().toISOString().slice(0, 10) + ".json";
    a.click();
    URL.revokeObjectURL(a.href);
    dataStatus("Exported " + sites.length + " sites" +
      (live ? " — a snapshot of the live network for analysis or backup." :
              ". Email the file to ryanyamauchi@sfua.org to merge it into the shared baseline."));
  });

  document.getElementById("nw-import").addEventListener("change", function (e) {
    var file = e.target.files[0];
    if (!file) return;
    var reader = new FileReader();
    reader.onload = function () {
      try {
        var data = JSON.parse(reader.result);
        var incoming = (Array.isArray(data) ? data : data.sites).filter(function (s) {
          return s && s.siteName && s.org && s.type;
        });
        if (!incoming.length) throw new Error("no sites");
        if (live) {
          if (!user) { dataStatus("Sign in first — importing writes to the live network."); return; }
          if (!confirm("Add " + incoming.length + " sites from this file to the LIVE network for all partners? (Duplicates aren't detected — re-importing the same file creates copies.)")) return;
          var rows = incoming.map(function (s) {
            var r = toRow(s);
            r.created_by = user.email; r.updated_by = user.email;
            return r;
          });
          sb.from("sites").insert(rows).then(function (res) {
            if (res.error) { dataStatus("Import failed: " + res.error.message); return; }
            fetchSites().then(renderAll);
            dataStatus("Imported " + rows.length + " sites to the live network.");
          });
        } else {
          var ids = {}, added = 0, updated = 0;
          sites.forEach(function (s, i) { ids[s.id] = i; });
          incoming.forEach(function (s) {
            if (!s.id) s.id = uid();
            if (s.id in ids) { sites[ids[s.id]] = s; updated++; }
            else { sites.push(s); added++; }
          });
          persistLocal(); renderAll();
          dataStatus("Imported: " + added + " new sites, " + updated + " updated.");
        }
      } catch (err) {
        dataStatus("That file couldn't be read as network data.");
      }
      e.target.value = "";
    };
    reader.readAsText(file);
  });

  document.getElementById("nw-reset-baseline").addEventListener("click", function () {
    if (live) return;
    if (!confirm("Replace your local data with the shared baseline? Sites you added here and haven't exported will be lost.")) return;
    sites = (window.SFUA_SEED_SITES || []).slice();
    persistLocal(); renderAll();
    dataStatus("Reset to the shared baseline (" + sites.length + " sites).");
  });

  function dataStatus(msg) {
    document.getElementById("nw-data-status").textContent = msg;
  }

  /* ---------------- boot ---------------- */

  function renderAll() {
    renderDashboard();
    renderDirectory();
    renderMarkers();
    renderFormGate();
    renderDataPanel();
  }

  var rtChannel = null;

  function connectLive() {
    if (rtChannel) return;
    fetchSites().then(renderAll);
    rtChannel = subscribeRealtime();
  }

  function disconnectLive() {
    if (rtChannel) { sb.removeChannel(rtChannel); rtChannel = null; }
    sites = [];
  }

  function syncAuthState(nextUser) {
    user = nextUser || null;
    renderAuthBar();
    renderLock();
    if (live) {
      if (user) connectLive();
      else disconnectLive();
    }
    renderAll();
  }

  renderAuthBar();
  renderLock();
  renderAll();

  if (live) {
    document.getElementById("nw-signin-form").addEventListener("submit", function (e) {
      e.preventDefault();
      var msg = document.getElementById("nw-si-msg");
      msg.textContent = "Signing in…";
      msg.className = "nw-form-msg";
      sb.auth.signInWithPassword({
        email: document.getElementById("nw-si-email").value.trim(),
        password: document.getElementById("nw-si-pass").value
      }).then(function (res) {
        if (res.error) {
          msg.textContent = "Sign-in failed: " + res.error.message;
          msg.className = "nw-form-msg is-error";
        }
        // success is handled by the auth state listener
      });
    });
    sb.auth.getSession().then(function (r) {
      syncAuthState(r.data && r.data.session ? r.data.session.user : null);
    });
    sb.auth.onAuthStateChange(function (_event, session) {
      syncAuthState(session && session.user ? session.user : null);
    });
  }
})();
