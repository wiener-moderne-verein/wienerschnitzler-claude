/* Main app for Wiener Schnitzler — datenjournalistische Single-Page-Site.
   Reads window.SCHNITZLER_* globals produced by data/schnitzler.js. */

const { useState, useMemo, useEffect, useRef, useCallback } = React;

// ---------- Helpers ----------
const BIRTH = new Date(window.SCHNITZLER_BIRTH);
const DEATH = new Date(window.SCHNITZLER_DEATH);
const MONTHS = ["Jänner","Februar","März","April","Mai","Juni","Juli","August","September","Oktober","November","Dezember"];

function fmtDateDE(iso) {
  if (!iso) return "—";
  const d = new Date(iso);
  return `${d.getDate()}. ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}
function fmtNum(n) { return (n ?? 0).toLocaleString("de-AT"); }
function ageAt(iso) {
  const d = new Date(iso);
  let a = d.getFullYear() - BIRTH.getFullYear();
  if (d.getMonth() < BIRTH.getMonth() || (d.getMonth() === BIRTH.getMonth() && d.getDate() < BIRTH.getDate())) a--;
  return a;
}
function describeKind(kind, type) {
  if (kind && kind !== "Sonstiges") return kind;
  return type === "p" ? "Ort" : "Adresse / Gebäude";
}

// ---------- Header ----------
function Masthead({ activeSection, onNav, onTweaks }) {
  const links = [
    ["karte","Karte"],
    ["zeitleiste","Zeitleiste"],
    ["heute","An diesem Tag"],
    ["orte","Orte"],
    ["reisen","Reisen"],
    ["zahlen","In Zahlen"]
  ];
  return (
    <header className="masthead">
      <div className="wrap-wide">
        <div className="masthead-row">
          <div className="brand">
            <span className="mark"></span>
            Wiener Schnitzler <em>— Schnitzlers Wien</em>
          </div>
          <nav className="nav">
            {links.map(([id,label]) => (
              <a key={id} className={activeSection === id ? "active" : ""} onClick={() => onNav(id)}>{label}</a>
            ))}
          </nav>
          <div className="meta-strip">
            <span>Stand <b>April 2026</b></span>
            <span>v<b>2.1</b></span>
            <span onClick={onTweaks} style={{cursor: "pointer"}}>⚙ Anpassen</span>
          </div>
        </div>
      </div>
    </header>
  );
}

// ---------- Hero ----------
function Hero() {
  const stays = window.SCHNITZLER_TOTAL_STAYS;
  const places = window.SCHNITZLER_TOTAL_PLACES;
  return (
    <section className="sec" style={{borderTop: "none", paddingTop: 52}}>
      <div className="wrap">
        <div className="kicker">Digital Humanities · Open Data · Wien 1862 – 1931</div>
        <h1 className="display">
          Die genauste Aufenthaltskarte <em>eines Menschen um 1900.</em>
        </h1>
        <p className="dek">
          Aus Arthur Schnitzlers Tagebüchern, Korrespondenzen und Notizen rekonstruiert: über
          {" "}{fmtNum(stays)} Aufenthalte an {fmtNum(places)} Orten, taggenau georeferenziert — von
          der Praterstraße bis nach Stockholm, vom Café Griensteidl bis zum Südbahnhotel am
          Semmering.
        </p>
        <div className="byline">
          <span>Hg. v. <b>Wiener Moderne Verein</b></span>
          <span>Daten <b>CC BY 4.0</b></span>
          <span>Quelle <b>PMB · ACDH-CH · ÖAW</b></span>
          <span>Lesezeit <b>ca. 14 Min.</b></span>
        </div>
      </div>
    </section>
  );
}

// ---------- Big numbers ----------
function BigNumbers() {
  const stays    = window.SCHNITZLER_TOTAL_STAYS;
  const places   = window.SCHNITZLER_TOTAL_PLACES;
  const countries= window.SCHNITZLER_TOTAL_COUNTRIES;
  return (
    <div className="wrap">
      <div className="big-numbers">
        <div>
          <div className="num">{fmtNum(stays)}</div>
          <div className="lab">dokumentierte Aufenthalte</div>
        </div>
        <div>
          <div className="num">{fmtNum(places)}</div>
          <div className="lab">distinkte Orte, georeferenziert</div>
        </div>
        <div>
          <div className="num">69 <em>Jahre</em></div>
          <div className="lab">Lebensspanne · 15.5.1862 – 21.10.1931</div>
        </div>
        <div>
          <div className="num">{fmtNum(countries)} <em>Länder</em></div>
          <div className="lab">besucht · Schwerpunkt Mitteleuropa</div>
        </div>
      </div>
    </div>
  );
}

// ---------- Leaflet helper ----------
function useLeafletReady() {
  const [ready, setReady] = useState(typeof L !== "undefined");
  useEffect(() => {
    if (typeof L !== "undefined") { setReady(true); return; }
    const t = setInterval(() => {
      if (typeof L !== "undefined") { setReady(true); clearInterval(t); }
    }, 60);
    return () => clearInterval(t);
  }, []);
  return ready;
}

// ---------- World map (Leaflet) ----------
function WorldMap({ onSelectPlace, activeId }) {
  const elRef = useRef(null);
  const mapRef = useRef(null);
  const layerRef = useRef(null);
  const markersById = useRef({});
  const ready = useLeafletReady();
  const places = useMemo(() => window.SCHNITZLER_PLACES.filter(p => p.days > 0), []);

  // Initialize once.
  useEffect(() => {
    if (!ready || mapRef.current || !elRef.current) return;
    const map = L.map(elRef.current, {
      zoomControl: true, scrollWheelZoom: true, worldCopyJump: true,
      preferCanvas: true, attributionControl: true
    }).setView([48.21, 16.37], 4);
    L.tileLayer("https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png", {
      attribution: "© OpenStreetMap-Mitwirkende · © CARTO",
      maxZoom: 18, subdomains: "abcd"
    }).addTo(map);
    mapRef.current = map;
  }, [ready]);

  // (Re-)build markers on data / activeId change.
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    if (layerRef.current) layerRef.current.remove();
    const layer = L.layerGroup().addTo(map);
    layerRef.current = layer;
    markersById.current = {};

    const bounds = [];
    for (const p of places) {
      const r = Math.max(4, Math.min(28, Math.sqrt(p.days) * 0.8));
      const cls = "schnitzler-dot " + (p.type === "p" ? "is-place" : "is-address") + (p.id === activeId ? " is-active" : "");
      const icon = L.divIcon({
        className: "",
        html: `<div class="${cls}" style="width:${r*2}px;height:${r*2}px"></div>`,
        iconSize: [r*2, r*2],
        iconAnchor: [r, r]
      });
      const m = L.marker([p.lat, p.lon], { icon, riseOnHover: true });
      m.bindPopup(
        `<div class="pp-name">${p.name}</div>` +
        `<div class="pp-context">${[p.parent, p.country].filter(Boolean).join(" · ")} · ${describeKind(p.kind, p.type)}</div>` +
        `<div class="pp-stat"><b>${fmtNum(p.days)}</b> Tage · ${p.firstVisit ? p.firstVisit.slice(0,4) : "—"}–${p.lastVisit ? p.lastVisit.slice(0,4) : "—"}</div>`,
        { className: "schnitzler-popup", closeButton: false, autoPan: true }
      );
      m.on("click", () => onSelectPlace(p.id));
      m.addTo(layer);
      markersById.current[p.id] = m;
      bounds.push([p.lat, p.lon]);
    }
    if (bounds.length && !mapRef.current._initialFitDone) {
      try { mapRef.current.fitBounds(bounds, { padding: [40, 40], maxZoom: 6 }); } catch (e) {}
      mapRef.current._initialFitDone = true;
    }
  }, [ready, places, activeId, onSelectPlace]);

  // Pan to active marker.
  useEffect(() => {
    if (!mapRef.current || !activeId) return;
    const p = window.SCHNITZLER_BY_ID[activeId];
    const m = markersById.current[activeId];
    if (!p || !m) return;
    mapRef.current.flyTo([p.lat, p.lon], Math.max(mapRef.current.getZoom(), 6), { duration: 0.8 });
    m.openPopup();
  }, [activeId]);

  return (
    <div className="map-stage">
      <div className="leaflet-stage" ref={elRef} aria-label="Karte aller dokumentierten Aufenthaltsorte"></div>
      <div className="map-legend">
        <h4>Legende</h4>
        <div className="map-legend-row"><span className="map-legend-dot"></span><span>Adresse · Gebäude · Lokal</span></div>
        <div className="map-legend-row"><span className="map-legend-dot" style={{background:"var(--ink)"}}></span><span>Stadt · Land · Region</span></div>
        <div className="map-legend-row"><span className="map-legend-dot small"></span><span>Fläche ≈ √Aufenthaltstage</span></div>
      </div>
      <div className="map-controls">
        <button title="Zentrum Wien" onClick={() => mapRef.current && mapRef.current.flyTo([48.21,16.37], 11, {duration:0.8})}>⌖</button>
        <button title="Gesamteuropa" onClick={() => mapRef.current && mapRef.current.flyTo([50, 12], 4, {duration:0.8})}>⌕</button>
      </div>
    </div>
  );
}

// ---------- Section 1: Karte ----------
function SectionMap({ setActivePlaceId, activeId }) {
  const places = window.SCHNITZLER_PLACES;
  const total = places.reduce((s,p) => s + (p.days || 0), 0);
  return (
    <section className="sec" id="karte">
      <div className="wrap-wide">
        <div className="sec-head">
          <div className="sec-num">§01 — Karte</div>
          <div>
            <h2 className="sec-title">
              Wo Schnitzler <em>gewesen ist.</em>
            </h2>
            <p className="sec-lede" style={{marginTop: 16}}>
              Jeder Punkt markiert einen Ort mit mindestens einem belegten Aufenthaltstag. Die Fläche
              skaliert mit der Wurzel der Tage. Wien dominiert; deutlich sichtbar werden die
              Sommerfrische-Achsen Semmering–Altaussee–Bad Ischl, die Theaterstationen Berlin und
              München, und einzelne Reisen nach Italien, Frankreich, Skandinavien.
            </p>
          </div>
          <div className="sec-meta">
            Tage gesamt<br/><b style={{color:"var(--ink)", fontSize: 14}}>{fmtNum(total)}</b>
          </div>
        </div>
        <WorldMap onSelectPlace={setActivePlaceId} activeId={activeId} />
      </div>
      <BigNumbers />
    </section>
  );
}

// ---------- Timeline ----------
function SectionTimeline({ onJumpDate }) {
  const years = useMemo(() => {
    const a = []; for (let y = 1862; y <= 1931; y++) a.push(y); return a;
  }, []);
  const perYear = useMemo(() => {
    const out = {};
    for (const s of window.SCHNITZLER_STAYS) {
      const y = parseInt(s.d.slice(0, 4), 10);
      out[y] = (out[y] || 0) + 1;
    }
    return out;
  }, []);
  const max = Math.max(1, ...years.map(y => perYear[y] || 0));
  const [hover, setHover] = useState(null);

  const events = [
    {y: 1862, label: "Geburt"},
    {y: 1885, label: "Dr. med."},
    {y: 1891, label: "Anatol"},
    {y: 1895, label: "Liebelei"},
    {y: 1900, label: "Lt. Gustl"},
    {y: 1903, label: "Heirat · Reigen"},
    {y: 1910, label: "Sternwartestraße"},
    {y: 1921, label: "Trennung"},
    {y: 1924, label: "Fräulein Else"},
    {y: 1931, label: "Tod"}
  ];

  return (
    <section className="sec" id="zeitleiste">
      <div className="wrap">
        <div className="sec-head">
          <div className="sec-num">§02 — Zeitleiste</div>
          <div>
            <h2 className="sec-title">69 Jahre — <em>taggenau.</em></h2>
            <p className="sec-lede" style={{marginTop: 16}}>
              Jede Säule ein Kalenderjahr: die Höhe zeigt die Anzahl belegter (Ort × Tag)-Paare.
              Die dichten Phasen fallen mit dem literarischen Werk zusammen — Jung-Wien, Anatol,
              Reigen, Fräulein Else.
            </p>
          </div>
          <div className="sec-meta">
            Spanne<br/><b style={{color:"var(--ink)", fontSize: 14}}>1862–1931</b>
          </div>
        </div>

        <div className="timeline-shell">
          <div className="timeline-legend">
            <span>Belegte Ort × Tag-Paare pro Jahr</span>
            <span>
              {hover ? <>Jahr <b style={{color:"var(--ink)"}}>{hover.y}</b> · {fmtNum(hover.v)} Belege · Schnitzler {hover.y - 1862} J.</> : "Bewegen Sie sich über die Säulen"}
            </span>
          </div>
          <div className="timeline-scrubber">
            <div className="timeline-axis">
              {years.map((y,i) => {
                const v = perYear[y] || 0;
                const h = (v / max) * 100;
                const left = (i / (years.length - 1)) * 100;
                const width = 100 / years.length * 0.85;
                const isMajor = y % 10 === 0;
                const isEvt = events.find(e => e.y === y);
                return (
                  <React.Fragment key={y}>
                    <div
                      className={`timeline-bar ${isMajor || isEvt ? "major" : ""}`}
                      style={{left: `${left}%`, height: `${h}%`, width: `${width}%`, background: isEvt ? "var(--accent)" : "var(--ink)"}}
                      onMouseEnter={() => setHover({y, v})}
                      onMouseLeave={() => setHover(null)}
                      onClick={() => onJumpDate(`${y}-06-15`)}
                    />
                    {isEvt && (
                      <div style={{
                        position: "absolute", left: `${left}%`, top: -4, fontSize: 9,
                        fontFamily: "var(--mono)", color: "var(--accent)", textTransform: "uppercase",
                        letterSpacing: "0.08em", transform: "rotate(-90deg)", transformOrigin: "left top",
                        whiteSpace: "nowrap"
                      }}>{isEvt.label}</div>
                    )}
                  </React.Fragment>
                );
              })}
            </div>
            <div className="timeline-year-labels">
              <span>1862</span><span>1875</span><span>1890</span><span>1905</span><span>1920</span><span>1931</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ---------- On this day ----------
function SectionToday({ date, setDate }) {
  // For the requested ISO date, find all places visited that day; prefer specific (a) over generic (p).
  const stays = useMemo(() => {
    const ids = window.SCHNITZLER_BY_DATE[date] || [];
    return ids.map(id => window.SCHNITZLER_BY_ID[id]).filter(Boolean);
  }, [date]);
  const place = stays[0] || null;
  const others = stays.slice(1);

  const quickDates = [
    ["1862-05-15","Geburt"],
    ["1885-05-30","Promotion"],
    ["1895-10-09","Liebelei UA"],
    ["1903-08-26","Heirat"],
    ["1910-04-01","Einzug Sternwartestr."],
    ["1921-12-23","Reigen-Prozess"],
    ["1931-10-21","Todestag"]
  ];

  const age = date >= "1862-05-15" ? ageAt(date) : null;

  return (
    <section className="sec" id="heute">
      <div className="wrap">
        <div className="sec-head">
          <div className="sec-num">§03 — An diesem Tag</div>
          <div>
            <h2 className="sec-title">
              Wählen Sie einen Tag <em>zwischen 1862 und 1931.</em>
            </h2>
            <p className="sec-lede" style={{marginTop: 16}}>
              Der Datensatz erlaubt für rund drei Viertel aller Kalendertage eine Zuordnung. Hier
              sehen Sie, wo Schnitzler sich an Ihrem gewählten Datum belegt aufhielt — und welche
              spezifischeren Adressen am selben Tag dokumentiert sind.
            </p>
          </div>
          <div className="sec-meta">
            {age != null && <>Alter<br/><b style={{color:"var(--ink)", fontSize: 14}}>{age} J.</b></>}
          </div>
        </div>

        <div className="today-row">
          <div>
            <div className="date-picker">
              <input
                type="date"
                min="1862-05-15"
                max="1931-10-21"
                value={date}
                onChange={e => setDate(e.target.value)}
              />
              <button onClick={() => {
                // Pick a random *documented* date so the user always sees content.
                const keys = Object.keys(window.SCHNITZLER_BY_DATE);
                setDate(keys[Math.floor(Math.random() * keys.length)]);
              }}>Zufallsdatum</button>
              <button onClick={() => {
                const today = new Date();
                const iso = `1926-${String(today.getMonth()+1).padStart(2,"0")}-${String(today.getDate()).padStart(2,"0")}`;
                setDate(iso);
              }}>Vor 100 Jahren</button>
            </div>
            <div className="today-quick">
              {quickDates.map(([d,l]) => (
                <button key={d} onClick={() => setDate(d)}>{l}</button>
              ))}
            </div>
          </div>

          <div className="event-card">
            <div className="event-date">{fmtDateDE(date)}</div>
            {place ? (
              <>
                <h3 className="event-title">
                  {place.name}
                  {place.parent && place.parent !== place.name && (
                    <em style={{color:"var(--graphite)", fontStyle:"italic", fontSize: 18, marginLeft: 10, fontWeight: 400}}>in {place.parent}</em>
                  )}
                </h3>
                <div className="event-body">
                  Belegt durch Tagebuch und/oder Korrespondenz; PMB-ID <span style={{fontFamily: "var(--mono)", fontSize: 13}}>{place.id}</span>.
                  {others.length > 0 && (
                    <> Am selben Tag belegt: {others.map(o => o.name).join(", ")}.</>
                  )}
                </div>
                <div className="event-meta">
                  <span>Land <b>{place.country || "—"}</b></span>
                  <span>Typ <b>{describeKind(place.kind, place.type)}</b></span>
                  <span>Beziehung <b>{place.firstVisit ? place.firstVisit.slice(0,4) : "?"}–{place.lastVisit ? place.lastVisit.slice(0,4) : "?"}</b></span>
                </div>
              </>
            ) : (
              <>
                <h3 className="event-title">Lücke im Datensatz</h3>
                <div className="event-body">
                  Für diesen Tag liegt derzeit kein direkter Eintrag vor. In den angrenzenden Tagen
                  hielt sich Schnitzler vermutlich an seinem Hauptwohnsitz auf.
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

// ---------- Places ----------
function SectionPlaces({ activeId, setActiveId }) {
  const sorted = useMemo(() => window.SCHNITZLER_PLACES.filter(p => p.days > 0).slice(0, 200), []);
  const top = sorted.slice(0, 24);
  const max = top[0]?.days || 1;
  const active = window.SCHNITZLER_BY_ID[activeId] || top[0];
  const people = (active && window.SCHNITZLER_PEOPLE[active.id]) || [];

  return (
    <section className="sec" id="orte">
      <div className="wrap-wide">
        <div className="sec-head">
          <div className="sec-num">§04 — Orte</div>
          <div>
            <h2 className="sec-title">Rangordnung <em>nach Aufenthaltstagen.</em></h2>
            <p className="sec-lede" style={{marginTop: 16}}>
              Wien dominiert erwartbar; auffallend ist die Dichte der spezifizierten Innerwiener
              Adressen — drei Wohnungen prägen sein Leben, dazu Theater, Kaffeehäuser, das AKH
              und die Ordination des Vaters am Burgring.
            </p>
          </div>
          <div className="sec-meta">
            Top<br/><b style={{color:"var(--ink)", fontSize: 14}}>{top.length} / {window.SCHNITZLER_TOTAL_PLACES}</b>
          </div>
        </div>

        <div className="place-grid">
          <div className="place-list">
            {top.map((p, i) => (
              <div
                key={p.id}
                className={`place-row ${activeId === p.id ? "active" : ""}`}
                onClick={() => setActiveId(p.id)}
              >
                <span className="idx">{String(i+1).padStart(2,"0")}</span>
                <span className="name">
                  {p.name}
                  {p.parent && p.parent !== p.name && <em>in {p.parent}</em>}
                </span>
                <span className="bar" style={{width: `${(p.days/max)*180}px`}}></span>
                <span className="days">{fmtNum(p.days)} T.</span>
              </div>
            ))}
          </div>

          {active && (
            <aside className="place-panel">
              <div className="pp-kicker">Ortsdossier</div>
              <h3>{active.name}</h3>
              <div className="pp-sub">
                {active.parent && active.parent !== active.name ? `${active.parent} · ` : ""}{active.country} · {describeKind(active.kind, active.type)}
              </div>
              <div className="pp-stats">
                <div>
                  <div className="num">{fmtNum(active.days)}</div>
                  <div className="lab">Tage</div>
                </div>
                <div>
                  <div className="num">{active.firstVisit ? active.firstVisit.slice(0,4) : "—"}</div>
                  <div className="lab">erster Besuch</div>
                </div>
                <div>
                  <div className="num">{active.lastVisit ? active.lastVisit.slice(0,4) : "—"}</div>
                  <div className="lab">letzter Besuch</div>
                </div>
                <div>
                  <div className="num">{active.firstVisit && active.lastVisit ? (parseInt(active.lastVisit.slice(0,4)) - parseInt(active.firstVisit.slice(0,4))) : 0}</div>
                  <div className="lab">Jahre Beziehung</div>
                </div>
              </div>
              {people.length > 0 && (
                <>
                  <div className="pp-section-label">Personen, die dort wohnten oder arbeiteten</div>
                  <div className="pp-people">
                    {people.map(n => <span key={n}>{n}</span>)}
                  </div>
                </>
              )}
              <div className="pp-coords">
                {active.lat.toFixed(4)}° N · {active.lon.toFixed(4)}° E · {" "}
                <a href={`https://pmb.acdh.oeaw.ac.at/entity/${active.id.replace(/^pmb/,"")}/`} target="_blank" rel="noopener" style={{borderBottom:"1px solid var(--rule-2)"}}>PMB {active.id}</a>
              </div>
            </aside>
          )}
        </div>
      </div>
    </section>
  );
}

// ---------- Routes (auto-derived from timeline) ----------
function deriveRoutes() {
  // Group consecutive "out of Vienna" days into trips. A trip = stretch of dates
  // with at least one place that isn't in/under Wien.
  const stays = window.SCHNITZLER_STAYS;
  const byId = window.SCHNITZLER_BY_ID;
  const isWien = (id) => {
    const p = byId[id];
    if (!p) return true; // unknown → treat as background
    return p.country === "Österreich" && (p.parent === "Wien" || p.name === "Wien" || /^[IVX]+\.,/.test(p.name));
  };

  // Build per-date sets
  const byDate = {};
  for (const s of stays) (byDate[s.d] = byDate[s.d] || new Set()).add(s.p);
  const dates = Object.keys(byDate).sort();

  const trips = [];
  let current = null;
  let prev = null;
  for (const d of dates) {
    const ids = [...byDate[d]];
    const offWien = ids.some(id => !isWien(id));
    if (offWien) {
      if (!current || (prev && (new Date(d) - new Date(prev)) > 3 * 86400000)) {
        if (current && current.dates.length >= 4) trips.push(current);
        current = { start: d, end: d, dates: [], stops: new Map() };
      }
      current.end = d;
      current.dates.push(d);
      for (const id of ids) {
        if (!isWien(id)) {
          const p = byId[id];
          if (!p || p.type !== "p") continue;
          current.stops.set(id, (current.stops.get(id) || 0) + 1);
        }
      }
      prev = d;
    } else if (current && current.dates.length >= 4) {
      trips.push(current);
      current = null;
      prev = d;
    } else if (current) {
      current = null;
    }
  }
  if (current && current.dates.length >= 4) trips.push(current);

  // Score & rank: prefer trips with multiple stops & longer span.
  const scored = trips.map(t => {
    const stops = [...t.stops.entries()]
      .sort((a,b) => b[1] - a[1])
      .slice(0, 8)
      .map(([id]) => byId[id])
      .filter(Boolean);
    const countries = new Set(stops.map(s => s.country).filter(Boolean));
    const span = Math.round((new Date(t.end) - new Date(t.start)) / 86400000) + 1;
    return { ...t, stops, countries: [...countries], span, score: stops.length * span };
  })
  .filter(t => t.stops.length >= 2)
  .sort((a, b) => b.score - a.score)
  .slice(0, 14);

  // Title heuristic
  for (const t of scored) {
    const region = t.countries.length === 1 ? t.countries[0] : t.countries.slice(0, 3).join(" · ");
    const monthDE = MONTHS[new Date(t.start).getMonth()];
    t.id = "trip-" + t.start;
    t.title = `${t.stops[0].name}${t.stops[1] ? " · " + t.stops[1].name : ""}`;
    t.meta = `${monthDE} ${t.start.slice(0,4)} · ${t.span} Tage · ${t.stops.length} Stationen · ${region}`;
  }

  return scored;
}

function RouteMap({ stops }) {
  const elRef = useRef(null);
  const mapRef = useRef(null);
  const layerRef = useRef(null);
  const ready = useLeafletReady();

  useEffect(() => {
    if (!ready || mapRef.current || !elRef.current) return;
    const map = L.map(elRef.current, { zoomControl: false, scrollWheelZoom: false, attributionControl: true })
      .setView([48.21, 16.37], 4);
    L.tileLayer("https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png", {
      attribution: "© OSM · CARTO", maxZoom: 18, subdomains: "abcd"
    }).addTo(map);
    L.control.zoom({ position: "topright" }).addTo(map);
    mapRef.current = map;
  }, [ready]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !stops || !stops.length) return;
    if (layerRef.current) layerRef.current.remove();
    const layer = L.layerGroup().addTo(map);
    layerRef.current = layer;

    // Add Wien as origin/return.
    const wien = window.SCHNITZLER_BY_ID["pmb50"];
    const sequence = [wien, ...stops, wien].filter(Boolean);
    const latlngs = sequence.map(s => [s.lat, s.lon]);

    L.polyline(latlngs, {
      color: getCss("--accent") || "#bd2c2a",
      weight: 2, opacity: 0.85, dashArray: "5 4"
    }).addTo(layer);

    sequence.forEach((s, i) => {
      const isOrigin = i === 0 || i === sequence.length - 1;
      const r = isOrigin ? 7 : 5;
      const dot = L.divIcon({
        className: "",
        html: `<div class="schnitzler-dot ${isOrigin ? "is-active" : "is-place"}" style="width:${r*2}px;height:${r*2}px"></div>`,
        iconSize: [r*2, r*2], iconAnchor: [r, r]
      });
      L.marker([s.lat, s.lon], { icon: dot }).addTo(layer)
        .bindTooltip(`${isOrigin ? "00" : String(i).padStart(2,"0")} · ${s.name}`,
          { permanent: false, direction: "right", className: "route-stop-label", offset: [10, 0] });
    });

    try { map.fitBounds(latlngs, { padding: [40, 40], maxZoom: 7 }); } catch (e) {}
  }, [ready, stops]);

  return <div className="leaflet-stage" style={{position:"absolute", inset:0}} ref={elRef}></div>;
}

function getCss(name) {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}

function SectionRoutes() {
  const routes = useMemo(() => deriveRoutes(), []);
  const [active, setActive] = useState(routes[0]?.id);
  const route = routes.find(r => r.id === active) || routes[0];

  return (
    <section className="sec" id="reisen">
      <div className="wrap-wide">
        <div className="sec-head">
          <div className="sec-num">§05 — Reisen</div>
          <div>
            <h2 className="sec-title">Einzelne Reisen, <em>nachgezeichnet.</em></h2>
            <p className="sec-lede" style={{marginTop: 16}}>
              Aus den taggenauen Aufenthalten lassen sich zusammenhängende Reisen rekonstruieren. Die
              Liste zeigt automatisch identifizierte längere Aufenthalte außerhalb Wiens — typische
              Muster: Sommerfrische, Italien-Reisen, Kuren, Theaterstationen.
            </p>
          </div>
          <div className="sec-meta">Auswahl<br/><b style={{color:"var(--ink)", fontSize: 14}}>{routes.length} Reisen</b></div>
        </div>

        <div className="routes-shell">
          <div className="route-list">
            {routes.map(r => (
              <div
                key={r.id}
                className={`route-item ${active === r.id ? "active" : ""}`}
                onClick={() => setActive(r.id)}
              >
                <div className="rkick">{r.start.slice(0,4)}</div>
                <div className="rname">{r.title}</div>
                <div className="rmeta">{r.meta}</div>
              </div>
            ))}
          </div>

          <div className="route-map">
            {route && <RouteMap stops={route.stops} />}
          </div>
        </div>
      </div>
    </section>
  );
}

// ---------- Stats ----------
function SectionStats() {
  const countries = Object.entries(window.SCHNITZLER_STATS.countries)
    .filter(([c]) => c && c !== "—")
    .sort((a,b) => b[1]-a[1])
    .slice(0, 10);
  const cMax = countries[0]?.[1] || 1;
  const types = Object.entries(window.SCHNITZLER_STATS.types).sort((a,b) => b[1]-a[1]);
  const tMax = types[0]?.[1] || 1;

  const decs = [];
  for (let d = 1860; d <= 1930; d += 10) decs.push(d);
  const decCounts = decs.map(d => window.SCHNITZLER_STATS.decades[d] || 0);
  const dMax = Math.max(1, ...decCounts);

  return (
    <section className="sec" id="zahlen">
      <div className="wrap-wide">
        <div className="sec-head">
          <div className="sec-num">§06 — In Zahlen</div>
          <div>
            <h2 className="sec-title">Ein Leben <em>als Datensatz.</em></h2>
            <p className="sec-lede" style={{marginTop: 16}}>
              Drei quantitative Perspektiven auf die Bewegungen. Die Daten bleiben lückenhaft für
              Kindheit und letzte Lebensjahre — das Plateau zwischen 1890 und 1925 entspricht der
              produktivsten Phase.
            </p>
          </div>
          <div className="sec-meta">Erhebung<br/><b style={{color:"var(--ink)", fontSize: 14}}>2024–2026</b></div>
        </div>

        <div className="dash-grid">
          <div className="panel">
            <h4>Dek. 01</h4>
            <div className="panel-sub">Belege nach Dekade</div>
            <div style={{paddingTop: 18}}>
              <div className="decade-chart">
                {decCounts.map((c, i) => (
                  <div key={decs[i]} className="decade-bar" style={{height: `${(c/dMax)*100}%`}}>
                    {c === dMax && <span className="vlab">{fmtNum(c)}</span>}
                  </div>
                ))}
              </div>
              <div className="decade-xlabels">
                {decs.map(d => <div key={d}>{d}er</div>)}
              </div>
            </div>
          </div>

          <div className="panel">
            <h4>Dek. 02</h4>
            <div className="panel-sub">Länder nach Belegen</div>
            {countries.map(([c, v]) => (
              <div className="bar-row" key={c}>
                <div className="l">{c}</div>
                <div className="b" style={{width: `${(v/cMax)*100}%`}}></div>
                <div className="v">{fmtNum(v)}</div>
              </div>
            ))}
          </div>

          <div className="panel">
            <h4>Dek. 03</h4>
            <div className="panel-sub">Tage nach Ortstyp</div>
            {types.map(([t, v]) => (
              <div className="bar-row" key={t}>
                <div className="l">{t}</div>
                <div className="b" style={{width: `${(v/tMax)*100}%`, background: "var(--accent)"}}></div>
                <div className="v">{fmtNum(v)}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

// ---------- Pullquote ----------
function PullQuote() {
  return (
    <div className="wrap">
      <div className="pullquote">
        <blockquote>„Ich schreibe von Liebe und Tod. Welche anderen Themen gibt es denn?"</blockquote>
        <cite>Arthur Schnitzler, Interview</cite>
      </div>
    </div>
  );
}

// ---------- Footer ----------
function Footer() {
  return (
    <footer className="footer">
      <div className="wrap-wide">
        <div className="footer-row">
          <div>
            <div><b>Wiener Schnitzler</b> · Schnitzlers Wien</div>
            <p className="ft-body">
              Ein Forschungsprojekt des Wiener Moderne Vereins, gefördert von der Stadt Wien Kultur,
              auf Grundlage der Datenbank <b>PMB</b> am ACDH-CH der Österreichischen Akademie der
              Wissenschaften.
            </p>
          </div>
          <div>
            <div><b>Daten</b></div>
            <p className="ft-body">
              Sämtliche Daten <a href="https://github.com/wiener-moderne-verein/wienerschnitzler-data" target="_blank" rel="noopener" style={{borderBottom:"1px solid var(--rule-2)"}}>CC BY 4.0</a>.
              Download als GeoJSON, CSV oder JSON direkt aus dem Repositorium. Tägliche
              GeoJSON-Dateien (z. B. <span style={{fontFamily:"var(--mono)"}}>1903-09-01.geojson</span>) stehen zur Verfügung.
            </p>
          </div>
          <div>
            <div><b>Kontakt</b></div>
            <p className="ft-body">
              Korrekturen und Ergänzungen willkommen. Die Daten befinden sich in aktiver Entwicklung
              und sind nicht finalisiert.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}

// ---------- Tweaks panel ----------
const DEFAULTS = /*EDITMODE-BEGIN*/{
  "palette": "ivory",
  "accent": "red",
  "density": "normal"
}/*EDITMODE-END*/;

function Tweaks({ visible, setVisible, state, setState }) {
  const accents = [
    ["red", "oklch(0.55 0.16 25)"],
    ["plum", "oklch(0.45 0.14 340)"],
    ["olive", "oklch(0.50 0.10 110)"],
    ["ink", "#1A1814"]
  ];
  if (!visible) return null;
  return (
    <div className="tweaks visible">
      <h5>Anpassen
        <span style={{float:"right", cursor: "pointer", color: "var(--graphite)"}} onClick={() => setVisible(false)}>✕</span>
      </h5>
      <div className="tweak-row">
        <label>Palette</label>
        <div className="swatches">
          {[["ivory","#F5F1E8"],["paper","#FBF7EC"],["dark","#16140F"]].map(([k,c]) => (
            <div
              key={k}
              className={`swatch ${state.palette === k ? "active" : ""}`}
              style={{background: c}}
              onClick={() => setState({...state, palette: k})}
              title={k}
            />
          ))}
        </div>
      </div>
      <div className="tweak-row">
        <label>Akzentfarbe</label>
        <div className="swatches">
          {accents.map(([k,c]) => (
            <div
              key={k}
              className={`swatch ${state.accent === k ? "active" : ""}`}
              style={{background: c}}
              onClick={() => setState({...state, accent: k})}
              title={k}
            />
          ))}
        </div>
      </div>
      <div className="tweak-row">
        <label>Dichte</label>
        <select value={state.density} onChange={e => setState({...state, density: e.target.value})}>
          <option value="compact">kompakt</option>
          <option value="normal">normal</option>
          <option value="airy">luftig</option>
        </select>
      </div>
    </div>
  );
}

function applyTweaks(state) {
  const root = document.body;
  root.classList.toggle("dark", state.palette === "dark");
  if (state.palette === "ivory") document.documentElement.style.setProperty("--paper", "#F5F1E8");
  if (state.palette === "paper") document.documentElement.style.setProperty("--paper", "#FBF7EC");
  const accentMap = {
    red: "oklch(0.55 0.16 25)",
    plum: "oklch(0.45 0.14 340)",
    olive: "oklch(0.50 0.10 110)",
    ink: "#1A1814"
  };
  document.documentElement.style.setProperty("--accent", accentMap[state.accent] || accentMap.red);
  document.documentElement.style.setProperty("--accent-soft", `color-mix(in oklch, ${accentMap[state.accent] || accentMap.red} 18%, transparent)`);
  const paddings = {compact: "40px 0 32px", normal: "72px 0 56px", airy: "112px 0 80px"};
  document.querySelectorAll(".sec").forEach(s => s.style.padding = paddings[state.density] || paddings.normal);
}

// ---------- App ----------
function App() {
  const [activePlaceId, setActivePlaceId] = useState("pmb50");
  const [activeSection, setActiveSection] = useState("karte");
  const [date, setDate] = useState("1903-09-01");
  const [tweaksVisible, setTweaksVisible] = useState(false);
  const [tweakState, setTweakState] = useState(DEFAULTS);

  useEffect(() => { applyTweaks(tweakState); }, [tweakState]);

  // Edit-mode protocol
  useEffect(() => {
    const handler = (e) => {
      if (!e.data) return;
      if (e.data.type === "__activate_edit_mode") setTweaksVisible(true);
      if (e.data.type === "__deactivate_edit_mode") setTweaksVisible(false);
    };
    window.addEventListener("message", handler);
    window.parent.postMessage({type: "__edit_mode_available"}, "*");
    return () => window.removeEventListener("message", handler);
  }, []);

  const persistTweak = useCallback((next) => {
    setTweakState(next);
    window.parent.postMessage({type: "__edit_mode_set_keys", edits: next}, "*");
  }, []);

  const jumpTo = (id) => {
    setActiveSection(id);
    const el = document.getElementById(id);
    if (el) window.scrollTo({top: el.offsetTop - 70, behavior: "smooth"});
  };

  useEffect(() => {
    const ids = ["karte","zeitleiste","heute","orte","reisen","zahlen"];
    const obs = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (e.isIntersecting) setActiveSection(e.target.id);
      });
    }, { rootMargin: "-40% 0px -55% 0px" });
    ids.forEach(id => { const el = document.getElementById(id); if (el) obs.observe(el); });
    return () => obs.disconnect();
  }, []);

  return (
    <>
      <Masthead activeSection={activeSection} onNav={jumpTo} onTweaks={() => setTweaksVisible(v => !v)} />
      <Hero />
      <SectionMap setActivePlaceId={setActivePlaceId} activeId={activePlaceId} />
      <SectionTimeline onJumpDate={setDate} />
      <SectionToday date={date} setDate={setDate} />
      <PullQuote />
      <SectionPlaces activeId={activePlaceId} setActiveId={setActivePlaceId} />
      <SectionRoutes />
      <SectionStats />
      <Footer />
      <Tweaks
        visible={tweaksVisible}
        setVisible={setTweaksVisible}
        state={tweakState}
        setState={persistTweak}
      />
    </>
  );
}

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(<App />);
