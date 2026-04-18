#!/usr/bin/env node
// build-data.mjs — transform upstream wienerschnitzler-data files into data/schnitzler.js
//
// Reads (relative to repo root):
//   data/source/editions/json/wienerschnitzler_timeline.json
//   data/source/editions/json/uebersicht.json
//   data/source/indices/listplace.xml
//   data/source/indices/partOf.xml
//   data/source/indices/living-working-in.xml
//
// Writes:
//   data/schnitzler.js  (window.SCHNITZLER_* globals)
//
// Upstream schema notes:
//   * listplace.xml is TEI: <place xml:id="pmbXXX"> with <placeName>, <desc type="entity_type">,
//     <location type="coords"><geo>LAT,DEC LON,DEC</geo></location> (German decimal commas!), and
//     <location type="located_in_place"><placeName key="pmbYYY">Name</placeName></location>.
//   * partOf.xml uses bare numeric IDs: <item id="X"><contains id="Y"/></item> (X is parent of Y).
//   * timeline JSON: array of single-day entries
//       { "id": "pmbXXX", "title": "Wien", "timestamp": ["1862-05-15"], "type": "p"|"a" }
//   * Country names (Österreich, Deutschland, …) are referenced as parents but rarely have own
//     <place> blocks, so we keep a name-by-id map sourced from BOTH place blocks and parent refs.

import { readFile, writeFile, access } from "node:fs/promises";
import { constants } from "node:fs";

const SRC       = "data/source";
const OUT       = "data/schnitzler.js";
const TIMELINE  = `${SRC}/editions/json/wienerschnitzler_timeline.json`;
const UEBER     = `${SRC}/editions/json/uebersicht.json`;
const LISTPLACE = `${SRC}/indices/listplace.xml`;
const PARTOF    = `${SRC}/indices/partOf.xml`;
const LWI       = `${SRC}/indices/living-working-in.xml`;

const BIRTH = "1862-05-15";
const DEATH = "1931-10-21";

// Known top-level country names that may appear as roots of the partOf chain.
// Used only to disambiguate when the chain ends at an entity whose name matches.
const KNOWN_COUNTRIES = new Set([
  "Österreich","Deutschland","Italien","Frankreich","Tschechien","Schweiz","Ungarn",
  "Großbritannien","Schweden","Dänemark","Norwegen","Niederlande","Belgien","Spanien",
  "Polen","Russland","Slowenien","Slowakei","Kroatien","Rumänien","Bulgarien","Türkei",
  "Vereinigte Staaten","USA","Vereinigtes Königreich","Luxemburg","Liechtenstein",
  "Bosnien und Herzegowina","Serbien","Griechenland","Portugal","Irland","Finnland",
  "Estland","Lettland","Litauen","Ukraine","Albanien","Monaco"
]);

async function exists(p) { try { await access(p, constants.R_OK); return true; } catch { return false; } }

function decodeEntities(s) {
  if (!s) return s;
  return s
    .replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"').replace(/&apos;/g, "'")
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(parseInt(n, 10)))
    .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCharCode(parseInt(n, 16)));
}

function num(s) {
  if (s == null) return NaN;
  return parseFloat(String(s).replace(",", "."));
}

// --- Parse listplace.xml ----------------------------------------------------
async function parseListPlace() {
  const xml = await readFile(LISTPLACE, "utf8");
  const places = {};      // id -> {id,name,lat,lon,entityType,parentId,parentName}
  const nameById = {};    // id -> human name (also covers parents w/o own block)

  const placeRe = /<place\s+xml:id="(pmb\d+)"[^>]*>([\s\S]*?)<\/place>/g;
  let m;
  while ((m = placeRe.exec(xml))) {
    const id = m[1];
    const body = m[2];

    const nameMatch = body.match(/<placeName(?:\s+xml:lang="[^"]*")?>([^<]+)<\/placeName>/);
    const name = nameMatch ? decodeEntities(nameMatch[1].trim()) : null;
    if (!name) continue;
    nameById[id] = name;

    const entityType = (body.match(/<desc type="entity_type">([^<]+)<\/desc>/) || [])[1]?.trim() || null;

    // First <location type="coords"> wins.
    const coordsMatch = body.match(/<location type="coords">\s*<geo>\s*([\-\d.,]+)\s+([\-\d.,]+)\s*<\/geo>\s*<\/location>/);
    if (!coordsMatch) continue;
    const lat = num(coordsMatch[1]);
    const lon = num(coordsMatch[2]);
    if (!isFinite(lat) || !isFinite(lon)) continue;

    // Immediate parent (located_in_place). Pick the first.
    let parentId = null, parentName = null;
    const parentMatch = body.match(/<location type="located_in_place">\s*<placeName key="(pmb\d+)">([^<]+)<\/placeName>/);
    if (parentMatch) {
      parentId = parentMatch[1];
      parentName = decodeEntities(parentMatch[2].trim());
      nameById[parentId] = nameById[parentId] || parentName;
    }

    // Also scan all parent refs in this place to seed nameById (so country lookups can resolve).
    const parentRefRe = /<placeName key="(pmb\d+)">([^<]+)<\/placeName>/g;
    let pm;
    while ((pm = parentRefRe.exec(body))) {
      nameById[pm[1]] = nameById[pm[1]] || decodeEntities(pm[2].trim());
    }

    places[id] = { id, name, lat, lon, entityType, parentId, parentName };
  }

  return { places, nameById };
}

// --- Parse partOf.xml --------------------------------------------------------
// Returns { childToParent: { "pmbX": "pmbY" } }  (first encountered parent wins)
async function parsePartOf() {
  if (!(await exists(PARTOF))) return {};
  const xml = await readFile(PARTOF, "utf8");
  const childToParent = {};
  const itemRe = /<item id="(\d+)">([\s\S]*?)<\/item>/g;
  let m;
  while ((m = itemRe.exec(xml))) {
    const parent = "pmb" + m[1];
    const containsRe = /<contains id="(\d+)"\s*\/>/g;
    let c;
    while ((c = containsRe.exec(m[2]))) {
      const child = "pmb" + c[1];
      if (!childToParent[child]) childToParent[child] = parent;
    }
  }
  return childToParent;
}

// --- Parse timeline JSON -----------------------------------------------------
async function parseTimeline(places) {
  const raw = await readFile(TIMELINE, "utf8");
  const arr = JSON.parse(raw);

  // Expand ISO date ranges ("YYYY-MM-DD/YYYY-MM-DD") into individual days, then
  // dedupe (placeId, date) pairs because the upstream sometimes lists both a range
  // entry and a single-day entry for the same combination.
  const dayPairs = new Set();
  const typeBy = {};
  for (const e of arr) {
    const id = e.id;
    const ts = e.timestamp && e.timestamp[0];
    if (!id || !ts) continue;
    let start, end;
    if (/^\d{4}-\d{2}-\d{2}$/.test(ts)) {
      start = end = ts;
    } else if (/^\d{4}-\d{2}-\d{2}\/\d{4}-\d{2}-\d{2}$/.test(ts)) {
      [start, end] = ts.split("/");
    } else {
      continue;
    }
    if (e.type && !typeBy[id]) typeBy[id] = e.type;
    const sd = new Date(start), ed = new Date(end);
    if (isNaN(sd) || isNaN(ed) || ed < sd) continue;
    for (let t = sd.getTime(); t <= ed.getTime(); t += 86400000) {
      const iso = new Date(t).toISOString().slice(0, 10);
      dayPairs.add(iso + "|" + id);
    }
  }

  const stays = [];
  const seen = {};
  for (const key of dayPairs) {
    const [d, id] = key.split("|");
    stays.push({ d, p: id });
    if (!seen[id]) seen[id] = { days: 0, first: d, last: d, type: typeBy[id] || null };
    const s = seen[id];
    s.days += 1;
    if (d < s.first) s.first = d;
    if (d > s.last)  s.last  = d;
  }
  stays.sort((a, b) => a.d < b.d ? -1 : a.d > b.d ? 1 : 0);
  // Apply aggregates onto place records.
  for (const id of Object.keys(seen)) {
    const p = places[id];
    if (!p) continue;
    p.days = seen[id].days;
    p.firstVisit = seen[id].first;
    p.lastVisit  = seen[id].last;
    p.type = seen[id].type || (p.entityType && /^A\.|^P\./.test(p.entityType) ? "p" : "a");
  }
  return { stays, seen };
}

// --- Country derivation ------------------------------------------------------
function deriveCountry(placeId, nameById, childToParent, immediateParentId) {
  // Walk up the chain. If a step lands on a known country name, return that.
  // Otherwise, return the topmost name we reach.
  const seen = new Set();
  let current = placeId;
  let topName = null;
  let safety = 0;
  while (current && !seen.has(current) && safety++ < 16) {
    seen.add(current);
    const nm = nameById[current];
    if (nm && KNOWN_COUNTRIES.has(nm) && current !== placeId) return nm;
    if (nm) topName = nm;
    const next = childToParent[current];
    if (!next) break;
    current = next;
  }
  // Fall back to the immediate parent's name if it's a known country
  if (immediateParentId && KNOWN_COUNTRIES.has(nameById[immediateParentId] || "")) {
    return nameById[immediateParentId];
  }
  // Otherwise the top of chain (skip if it equals the place's own name)
  return topName && topName !== nameById[placeId] ? topName : "—";
}

// --- Parse living-working-in.xml → people per place --------------------------
async function parseLWI(visitedIds) {
  if (!(await exists(LWI))) return {};
  const xml = await readFile(LWI, "utf8");
  const out = {};
  const placeRe = /<place\s+xml:id="(pmb\d+)">([\s\S]*?)<\/place>/g;
  let m;
  while ((m = placeRe.exec(xml))) {
    const id = m[1];
    if (!visitedIds.has(id)) continue;
    const body = m[2];
    const persRe = /<persName ref="#\d+">\s*(?:<forename>([^<]+)<\/forename>\s*)?(?:<surname>([^<]+)<\/surname>\s*)?<\/persName>/g;
    const people = [];
    let pm;
    while ((pm = persRe.exec(body))) {
      const fn = pm[1] ? decodeEntities(pm[1].trim()) : "";
      const sn = pm[2] ? decodeEntities(pm[2].trim()) : "";
      const full = (fn + " " + sn).trim();
      if (!full || /\?\?/.test(full)) continue;   // skip placeholders
      if (!people.includes(full)) people.push(full);
      if (people.length >= 10) break;
    }
    if (people.length) out[id] = people;
  }
  return out;
}

// --- Friendly type label from entity_type -----------------------------------
function classify(entityType, name) {
  const e = (entityType || "").toLowerCase();
  const n = name || "";
  // Entity-type wins; name is only used when the entity type is empty/generic.
  if (/wohngeb|whs|apartment|wohnung/.test(e)) return "Wohnen";
  if (/hotel|htl/.test(e)) return "Hotel";
  if (/restaurant|\brest\b|cafe|café|kaffee/.test(e)) return "Café/Restaurant";
  if (/theater|oper(?:n|nhaus)?/.test(e)) return "Theater";
  if (/krankenhaus|hospital|\bhsp\b|ordination|klinik|sanatorium/.test(e)) return "Klinik";
  if (/straße|strasse|\bstr\b|gasse|platz|ring/.test(e)) return "Straße/Adresse";
  if (/see|berg|tal|wald|insel|fluss|gebirge/.test(e)) return "Naturraum";
  if (/bahnhof|bahn|station/.test(e)) return "Bahnhof";
  if (/grab|friedhof|kapelle|kirche|tempel|synagoge/.test(e)) return "Sakralbau";
  if (/villa|burg(?!ring)|schloss|palast/.test(e)) return "Villa/Schloss";
  if (/^a\./.test(e) || /^p\./.test(e)) return "Ort";
  // Name-based last resort
  if (/Kaffeehaus|Café\b/i.test(n)) return "Café/Restaurant";
  if (/theater\b|Burgtheater/i.test(n)) return "Theater";
  if (/straße|gasse|platz|ring/i.test(n)) return "Straße/Adresse";
  return "Sonstiges";
}

// --- Main --------------------------------------------------------------------
async function main() {
  const okList = await exists(LISTPLACE);
  const okTime = await exists(TIMELINE);
  if (!okList || !okTime) {
    console.error(`Upstream sources missing: listplace=${okList} timeline=${okTime}`);
    console.error("Skipping rebuild — keeping existing data/schnitzler.js.");
    return;
  }

  console.log("Parsing listplace.xml …");
  const { places, nameById } = await parseListPlace();
  console.log(`  ${Object.keys(places).length} place records, ${Object.keys(nameById).length} names indexed`);

  console.log("Parsing partOf.xml …");
  const childToParent = await parsePartOf();
  console.log(`  ${Object.keys(childToParent).length} parent links`);

  console.log("Parsing timeline.json …");
  const { stays } = await parseTimeline(places);
  console.log(`  ${stays.length} day-entries`);

  // Filter to visited places only.
  const visited = Object.values(places).filter(p => p.days > 0);
  const visitedIds = new Set(visited.map(p => p.id));
  console.log(`  ${visited.length} visited places`);

  // Derive country + parent display + simple type label.
  for (const p of visited) {
    p.country = deriveCountry(p.id, nameById, childToParent, p.parentId);
    if (!p.parentName && p.parentId) p.parentName = nameById[p.parentId] || null;
    p.kind = classify(p.entityType, p.name);
  }

  // Sort by days desc.
  visited.sort((a, b) => b.days - a.days);

  // Stats.
  const decades = {};
  const countries = {};
  for (const s of stays) {
    const d = Math.floor(parseInt(s.d.slice(0, 4), 10) / 10) * 10;
    decades[d] = (decades[d] || 0) + 1;
    const pl = places[s.p];
    if (pl && pl.country) countries[pl.country] = (countries[pl.country] || 0) + 1;
  }
  const types = {};
  for (const p of visited) types[p.kind] = (types[p.kind] || 0) + p.days;

  // Headline "Aufenthalte" count: drop ancestors when a more specific co-day place is present
  // (mirrors uebersicht.json's weighting logic).
  const byDate = {};
  for (const s of stays) (byDate[s.d] = byDate[s.d] || []).push(s.p);
  let specificStays = 0;
  for (const d of Object.keys(byDate)) {
    const ids = byDate[d];
    const drop = new Set();
    for (const id of ids) {
      let cur = childToParent[id];
      let safety = 0;
      while (cur && safety++ < 16) {
        if (ids.includes(cur)) drop.add(cur);
        cur = childToParent[cur];
      }
    }
    specificStays += ids.filter(i => !drop.has(i)).length;
  }

  console.log("Parsing living-working-in.xml …");
  const people = await parseLWI(visitedIds);
  console.log(`  people for ${Object.keys(people).length} places`);

  // Reduce the place record to only fields the UI uses, and trim precision to 5dp.
  const placesOut = visited.map(p => ({
    id: p.id,
    name: p.name,
    parent: p.parentName || null,
    country: p.country,
    type: p.type,
    kind: p.kind,
    lat: +p.lat.toFixed(5),
    lon: +p.lon.toFixed(5),
    days: p.days,
    firstVisit: p.firstVisit,
    lastVisit: p.lastVisit
  }));

  const totalStays = specificStays;
  const totalDays = stays.length;
  const numCountries = Object.keys(countries).filter(c => c && c !== "—").length;

  const header = `// Auto-generated by scripts/build-data.mjs on ${new Date().toISOString()}
// Source: github.com/wiener-moderne-verein/wienerschnitzler-data  (CC BY 4.0)
// Do not edit by hand — changes will be overwritten by the sync-data workflow.`;

  const body = `
window.SCHNITZLER_BIRTH         = ${JSON.stringify(BIRTH)};
window.SCHNITZLER_DEATH         = ${JSON.stringify(DEATH)};
window.SCHNITZLER_TOTAL_STAYS   = ${totalStays};
window.SCHNITZLER_TOTAL_DAYS    = ${totalDays};
window.SCHNITZLER_TOTAL_PLACES  = ${placesOut.length};
window.SCHNITZLER_TOTAL_COUNTRIES = ${numCountries};
window.SCHNITZLER_PLACES        = ${JSON.stringify(placesOut)};
window.SCHNITZLER_STAYS         = ${JSON.stringify(stays)};
window.SCHNITZLER_PEOPLE        = ${JSON.stringify(people)};
window.SCHNITZLER_STATS         = ${JSON.stringify({ decades, countries, types })};

(function () {
  const byId = {};
  for (const p of window.SCHNITZLER_PLACES) byId[p.id] = p;
  window.SCHNITZLER_BY_ID = byId;

  // Date → array of {p:placeId, type:"p"|"a"} (sorted: most-specific "a" first).
  const byDate = {};
  for (const s of window.SCHNITZLER_STAYS) {
    (byDate[s.d] = byDate[s.d] || []).push(s.p);
  }
  for (const k of Object.keys(byDate)) {
    byDate[k].sort((a, b) => {
      const ta = (byId[a] && byId[a].type) === "a" ? 0 : 1;
      const tb = (byId[b] && byId[b].type) === "a" ? 0 : 1;
      return ta - tb;
    });
  }
  window.SCHNITZLER_BY_DATE = byDate;
})();
`;

  await writeFile(OUT, header + "\n" + body);
  console.log(`Wrote ${OUT}: ${placesOut.length} places, ${totalStays} stays, ${numCountries} countries.`);
}

main().catch(err => { console.error(err); process.exit(1); });
