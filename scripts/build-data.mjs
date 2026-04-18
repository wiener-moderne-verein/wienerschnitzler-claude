#!/usr/bin/env node
// build-data.mjs — transform upstream wienerschnitzler-data files into data/schnitzler.js
// Reads:  data/source/wienerschnitzler_timeline.json
//         data/source/indices/listplace.xml
//         data/source/indices/partOf.xml
// Writes: data/schnitzler.js  (same shape as the hand-written seed)
//
// Parsing strategy: regex extraction on the TEI/XML. The upstream schema is stable enough for
// a tolerant parser; we only extract what the UI actually needs: id, name, lat, lon, type, parent.

import { readFile, writeFile, access } from "node:fs/promises";
import { constants } from "node:fs";

const SRC      = "data/source";
const OUT      = "data/schnitzler.js";
const TIMELINE = `${SRC}/wienerschnitzler_timeline.json`;
const LISTPLACE= `${SRC}/indices/listplace.xml`;
const PARTOF   = `${SRC}/indices/partOf.xml`;

async function exists(p) { try { await access(p, constants.R_OK); return true; } catch { return false; } }

// --- Parse listplace.xml → placesById ----------------------------------------
// Expected (TEI) rough shape:
//   <place xml:id="pmbXXXX" type="p|a">
//     <placeName>Wien</placeName>
//     <location><geo>48.2082 16.3738</geo></location>
//     <country>Österreich</country>
//   </place>
async function parseListPlace() {
  if (!(await exists(LISTPLACE))) return {};
  const xml = await readFile(LISTPLACE, "utf8");
  const out = {};
  const re = /<place\b[^>]*xml:id="([^"]+)"[^>]*(?:type="([^"]*)")?[^>]*>([\s\S]*?)<\/place>/g;
  let m;
  while ((m = re.exec(xml))) {
    const id = m[1];
    const type = m[2] || (/type="a"/.test(m[0]) ? "a" : "p");
    const body = m[3];
    const name    = (body.match(/<placeName[^>]*>([^<]+)<\/placeName>/) || [])[1]?.trim();
    const geo     = (body.match(/<geo[^>]*>\s*([\-\d.]+)[\s,]+([\-\d.]+)\s*<\/geo>/) || []);
    const country = (body.match(/<country[^>]*>([^<]+)<\/country>/) || [])[1]?.trim();
    if (!name || !geo[1] || !geo[2]) continue;
    out[id] = {
      id,
      name,
      lat: parseFloat(geo[1]),
      lon: parseFloat(geo[2]),
      type,
      country: country || "—",
      days: 0, firstVisit: null, lastVisit: null
    };
  }
  return out;
}

// --- Parse partOf.xml → parent lookup ---------------------------------------
async function parsePartOf() {
  if (!(await exists(PARTOF))) return {};
  const xml = await readFile(PARTOF, "utf8");
  const out = {};
  // <relation active="#pmbXXXX" passive="#pmbYYYY" name="partOf"/>
  const re = /<relation[^>]*active="#?([^"\s]+)"[^>]*passive="#?([^"\s]+)"[^>]*(?:name="([^"]+)")?/g;
  let m;
  while ((m = re.exec(xml))) {
    if (!m[3] || /part/i.test(m[3])) out[m[1]] = m[2];
  }
  return out;
}

// --- Parse timeline → aggregate per-place days & first/last visit ----------
async function parseTimeline(places) {
  if (!(await exists(TIMELINE))) return [];
  const raw = await readFile(TIMELINE, "utf8");
  let arr;
  try { arr = JSON.parse(raw); } catch { return []; }
  if (!Array.isArray(arr)) arr = arr.features || arr.stays || [];

  const stays = [];
  for (const e of arr) {
    // Upstream element shape (roughly):
    // { "when": "1888-01-01/1888-01-03", "place": "#pmbXXXX", "type": "p"|"a", "eventName": "..." }
    const when  = e.when || e.date || e.timespan;
    const place = (e.place || e.placeRef || "").replace(/^#/, "");
    if (!when || !place) continue;
    const [start, end] = when.includes("/") ? when.split("/") : [when, when];
    if (!/^\d{4}-\d{2}-\d{2}$/.test(start)) continue;
    const s = new Date(start), ee = new Date(end);
    const days = Math.max(1, Math.round((ee - s) / 86400000) + 1);

    const p = places[place];
    if (p) {
      p.days += days;
      if (!p.firstVisit || start < p.firstVisit) p.firstVisit = start;
      if (!p.lastVisit  || end   > p.lastVisit)  p.lastVisit  = end;
    }
    stays.push({ start, end, placeId: place, event: e.eventName || e.label || "" });
  }
  return stays;
}

function computeStats(places, stays) {
  const decades = {}, countries = {};
  const types = { "Wohnhäuser": 0, "Cafés": 0, "Theater": 0, "Kurorte": 0, "Städte": 0, "Andere": 0 };
  for (const s of stays) {
    const y = parseInt(s.start.slice(0, 4));
    const d = Math.floor(y / 10) * 10;
    decades[d] = (decades[d] || 0) + 1;
    const pl = places[s.placeId];
    if (pl) countries[pl.country] = (countries[pl.country] || 0) + 1;
  }
  for (const p of Object.values(places)) {
    if (/straße|gasse|haus/i.test(p.name))       types["Wohnhäuser"] += p.days;
    else if (/Café/i.test(p.name))                types["Cafés"] += p.days;
    else if (/theater|burg/i.test(p.name))        types["Theater"] += p.days;
    else if (/bad|see|ischl|moritz|semmering/i.test(p.name)) types["Kurorte"] += p.days;
    else if (p.type === "p")                       types["Städte"] += p.days;
    else                                           types["Andere"] += p.days;
  }
  return { decades, countries, types };
}

async function main() {
  const hasAnyUpstream = await exists(TIMELINE) || await exists(LISTPLACE);
  if (!hasAnyUpstream) {
    console.log("No upstream sources found — keeping existing data/schnitzler.js.");
    return;
  }

  const places  = await parseListPlace();
  const parents = await parsePartOf();
  for (const id of Object.keys(places)) {
    const parentId = parents[id];
    if (parentId && places[parentId]) places[id].parent = places[parentId].name;
  }
  const stays = await parseTimeline(places);

  const placesArr = Object.values(places).sort((a, b) => b.days - a.days);
  const stats     = computeStats(places, stays);

  const header = `// Auto-generated by scripts/build-data.mjs on ${new Date().toISOString()}
// Source: github.com/wiener-moderne-verein/wienerschnitzler-data  (CC BY 4.0)
// Do not edit by hand — changes will be overwritten by the sync-data workflow.`;

  const body = `
window.SCHNITZLER_BIRTH  = "1862-05-15";
window.SCHNITZLER_DEATH  = "1931-10-21";
window.SCHNITZLER_PLACES = ${JSON.stringify(placesArr, null, 2)};
window.SCHNITZLER_STAYS  = ${JSON.stringify(stays, null, 2)};
window.SCHNITZLER_PEOPLE = ${JSON.stringify({}, null, 2)};  // TODO: parse living-working-in.xml
window.SCHNITZLER_STATS  = ${JSON.stringify(stats, null, 2)};

(function () {
  const byId = {};
  for (const p of window.SCHNITZLER_PLACES) byId[p.id] = p;
  window.SCHNITZLER_BY_ID = byId;
})();
`;

  await writeFile(OUT, header + "\n" + body);
  console.log(`Wrote ${OUT}: ${placesArr.length} places, ${stays.length} stays.`);
}

main().catch(err => { console.error(err); process.exit(1); });
