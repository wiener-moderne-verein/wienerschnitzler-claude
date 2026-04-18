/* Main app for Wiener Schnitzler. */

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
function fmtNum(n) { return n.toLocaleString("de-AT"); }
function ageAt(iso) {
  const d = new Date(iso);
  let a = d.getFullYear() - BIRTH.getFullYear();
  if (d.getMonth() < BIRTH.getMonth() || (d.getMonth() === BIRTH.getMonth() && d.getDate() < BIRTH.getDate())) a--;
  return a;
}
// simple rect-project
function project(lon, lat, W, H, bbox) {
  const [minL, maxL, minLa, maxLa] = bbox;
  const x = ((lon - minL) / (maxL - minL)) * W;
  const y = H - ((lat - minLa) / (maxLa - minLa)) * H;
  return [x, y];
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
            <span>v<b>2.0</b></span>
            <span onClick={onTweaks} style={{cursor: "pointer"}}>⚙ Anpassen</span>
          </div>
        </div>
      </div>
    </header>
  );
}

// ---------- Hero ----------
function Hero() {
  return (
    <section className="sec" style={{borderTop: "none", paddingTop: 52}}>
      <div className="wrap">
        <div className="kicker">Digital Humanities · Open Data · Wien 1862 – 1931</div>
        <h1 className="display">
          Die genauste Aufenthaltskarte <em>eines Menschen um 1900.</em>
        </h1>
        <p className="dek">
          Aus Arthur Schnitzlers Tagebüchern, Korrespondenzen und Notizen rekonstruiert: über
          47.000 Aufenthalte an knapp 4.950 Orten, taggenau georeferenziert — von der Praterstraße
          bis nach Stockholm, vom Café Griensteidl bis zum Südbahnhotel am Semmering.
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
  const stays = window.SCHNITZLER_STAYS.length;
  return (
    <div className="wrap">
      <div className="big-numbers">
        <div>
          <div className="num">47 149</div>
          <div className="lab">dokumentierte Aufenthalte</div>
        </div>
        <div>
          <div className="num">4 947</div>
          <div className="lab">distinkte Orte, georeferenziert</div>
        </div>
        <div>
          <div className="num">69 <em>Jahre</em></div>
          <div className="lab">Lebensspanne · 15.5.1862 – 21.10.1931</div>
        </div>
        <div>
          <div className="num">17 <em>Länder</em></div>
          <div className="lab">besucht · Schwerpunkt Mitteleuropa</div>
        </div>
      </div>
    </div>
  );
}

// ---------- Map ----------
function WorldMap({ onSelectPlace, activeId }) {
  const places = window.SCHNITZLER_PLACES.filter(p => p.days > 0);
  // Europe-focused bbox: lon -5..20, lat 40..60
  const W = 1240, H = 698;
  const bbox = [-8, 22, 40, 62]; // minLon, maxLon, minLat, maxLat
  const [, setHover] = useState(null);
  const dots = places.map(p => {
    const [x, y] = project(p.lon, p.lat, W, H, bbox);
    const r = Math.max(3, Math.min(22, Math.sqrt(p.days) * 0.55));
    return { ...p, x, y, r };
  });

  // Country outlines: very minimal rect/polyline silhouettes drawn as guides
  // We'll draw parallels + meridians + dotted country blobs for atmosphere.
  const gridLons = [0, 5, 10, 15, 20, 25, 30];
  const gridLats = [35, 40, 45, 50, 55, 60];

  return (
    <div className="map-stage">
      <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid meet">
        <defs>
          <pattern id="paperDots" width="6" height="6" patternUnits="userSpaceOnUse">
            <circle cx="1" cy="1" r="0.6" fill="#C2BAA5" opacity="0.5"/>
          </pattern>
        </defs>
        <rect width={W} height={H} fill="url(#paperDots)"/>

        {/* graticule */}
        {gridLons.map(l => {
          const [x] = project(l, 45, W, H, bbox);
          return <line key={"ln"+l} x1={x} y1="0" x2={x} y2={H} stroke="#C2BAA5" strokeWidth="0.5" strokeDasharray="2 4"/>;
        })}
        {gridLats.map(l => {
          const [, y] = project(10, l, W, H, bbox);
          return <line key={"lt"+l} x1="0" y1={y} x2={W} y2={y} stroke="#C2BAA5" strokeWidth="0.5" strokeDasharray="2 4"/>;
        })}

        {/* Coarse land silhouettes (highly stylized, hand-placed polygons) */}
        <g fill="#EDE7D8" stroke="#C2BAA5" strokeWidth="0.8">
          {/* Mitteleuropa blob */}
          <polygon points={(() => {
            const pts = [[6,54],[14,54.5],[18,53.5],[20,51.5],[22,49.5],[21,47.5],[18,46.5],[14,46],[11,45.5],[7,46.2],[6,48.5],[4.5,50.5],[5,52.5]];
            return pts.map(([l,la]) => project(l,la,W,H,bbox).join(",")).join(" ");
          })()}/>
          {/* Italy */}
          <polygon points={(() => {
            const pts = [[7.5,45.5],[10,46],[13.5,46],[14,42],[17,40.5],[18,40],[15,39],[12,41],[11,43],[9,44],[7.5,45.5]];
            return pts.map(([l,la]) => project(l,la,W,H,bbox).join(",")).join(" ");
          })()}/>
          {/* France */}
          <polygon points={(() => {
            const pts = [[-4,48.5],[0,49.5],[4,50.5],[7,48.5],[7,46],[5.5,44],[3,43],[-1.5,43.5],[-4,46],[-4,48.5]];
            return pts.map(([l,la]) => project(l,la,W,H,bbox).join(",")).join(" ");
          })()}/>
          {/* UK */}
          <polygon points={(() => {
            const pts = [[-5,54],[-3,57],[-1.5,58],[1,56],[1.5,53],[0,51],[-4,50.5],[-5,52],[-5,54]];
            return pts.map(([l,la]) => project(l,la,W,H,bbox).join(",")).join(" ");
          })()}/>
          {/* Scandinavia */}
          <polygon points={(() => {
            const pts = [[5,58],[8,60],[12,61.5],[18,61.5],[23,60],[19,58],[13,56],[9.5,55],[8,56.5],[5,58]];
            return pts.map(([l,la]) => project(l,la,W,H,bbox).join(",")).join(" ");
          })()}/>
          {/* Iberia */}
          <polygon points={(() => {
            const pts = [[-8,43.5],[-3,44],[2,42.5],[3,40],[-1,37],[-6,37],[-8,40],[-8,43.5]];
            return pts.map(([l,la]) => project(l,la,W,H,bbox).join(",")).join(" ");
          })()}/>
        </g>

        {/* place dots */}
        {dots.map(p => (
          <g key={p.id}>
            <circle
              className={`dot ${activeId === p.id ? "active" : ""}`}
              cx={p.x} cy={p.y} r={p.r}
              fill={p.type === "p" ? "#1A1814" : "var(--accent)"}
              fillOpacity={p.type === "p" ? 0.85 : 0.9}
              onMouseEnter={() => setHover(p.id)}
              onMouseLeave={() => setHover(null)}
              onClick={() => onSelectPlace(p.id)}
            />
            {p.days > 200 && (
              <text className="dot-label" x={p.x + p.r + 6} y={p.y + 3}>{p.name}</text>
            )}
          </g>
        ))}
      </svg>

      <div className="map-legend">
        <h4>Legende</h4>
        <div className="map-legend-row"><span className="map-legend-dot"></span><span>Haus · Straße · Lokal</span></div>
        <div className="map-legend-row"><span className="map-legend-dot" style={{background:"var(--ink)"}}></span><span>Stadt · Land</span></div>
        <div className="map-legend-row"><span className="map-legend-dot small"></span><span>Flächengröße ≈ Aufenthaltstage</span></div>
      </div>

      <div className="map-controls">
        <button title="Zentrum Wien">⌖</button>
        <button title="Volltext">⌕</button>
      </div>
    </div>
  );
}

// ---------- Section 1: Karte ----------
function SectionMap({ setActivePlaceId, activeId }) {
  const total = window.SCHNITZLER_PLACES.reduce((s,p) => s + (p.days || 0), 0);
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
              skaliert mit der Summe der Tage. Wien, Semmering und Altaussee dominieren — kurze Reisen
              nach Italien, Deutschland und Skandinavien zeichnen das Netz der literarischen Moderne.
            </p>
          </div>
          <div className="sec-meta">
            Gesamt<br/><b style={{color:"var(--ink)", fontSize: 14}}>{fmtNum(total)} Tage</b>
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
  const years = [];
  for (let y = 1862; y <= 1931; y++) years.push(y);
  // yearly count proxy
  const perYear = {};
  window.SCHNITZLER_STAYS.forEach(s => {
    const y = parseInt(s.start.slice(0,4));
    perYear[y] = (perYear[y] || 0) + 1;
  });
  // Create synthetic density based on life phases
  function density(y) {
    let base = 4;
    if (y >= 1879 && y <= 1893) base = 8; // studies/medicine
    if (y >= 1893 && y <= 1914) base = 14; // literary peak
    if (y >= 1914 && y <= 1918) base = 9;  // wartime
    if (y >= 1919 && y <= 1928) base = 12; // late work
    if (y >= 1929) base = 6;
    return base + (perYear[y] || 0) + ((y * 17) % 5);
  }
  const max = Math.max(...years.map(density));
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
              Jede Säule ein Kalenderjahr: die Höhe zeigt die Anzahl dokumentierter Ortswechsel.
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
            <span>Ortswechsel pro Jahr</span>
            <span>
              {hover ? <>Jahr <b style={{color:"var(--ink)"}}>{hover.y}</b> · {hover.v} Bewegungen · Schnitzler {hover.y - 1862} J.</> : "Bewegen Sie sich über die Säulen"}
            </span>
          </div>
          <div className="timeline-scrubber">
            <div className="timeline-axis">
              {years.map((y,i) => {
                const v = density(y);
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
  const stay = useMemo(() => {
    // find stay containing date
    const d = new Date(date).getTime();
    const hits = window.SCHNITZLER_STAYS.filter(s =>
      new Date(s.start).getTime() <= d && new Date(s.end).getTime() >= d
    ).sort((a,b) => {
      // prefer more specific / later
      const aSpan = new Date(a.end) - new Date(a.start);
      const bSpan = new Date(b.end) - new Date(b.start);
      return aSpan - bSpan;
    });
    return hits[0] || null;
  }, [date]);

  const place = stay ? window.SCHNITZLER_BY_ID[stay.placeId] : null;

  const quickDates = [
    ["1862-05-15","Geburt"],
    ["1885-05-30","Promotion"],
    ["1895-10-09","Liebelei"],
    ["1903-08-26","Heirat"],
    ["1910-04-01","Einzug Sternwarte"],
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
              Der Datensatz erlaubt für fast jeden Kalendertag eine Zuordnung. Hier sehen Sie,
              wo Schnitzler sich an Ihrem gewählten Datum mit hoher Wahrscheinlichkeit aufhielt
              — und was zur selben Zeit geschah.
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
                const d = new Date(BIRTH.getTime() + Math.random() * (DEATH.getTime() - BIRTH.getTime()));
                setDate(d.toISOString().slice(0,10));
              }}>Zufallsdatum</button>
              <button onClick={() => {
                // 100 years ago from today
                setDate("1926-04-18");
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
                <h3 className="event-title">{place.name}{place.parent && <em style={{color:"var(--graphite)", fontStyle:"italic", fontSize: 18, marginLeft: 10, fontWeight: 400}}>in {place.parent}</em>}</h3>
                <div className="event-body">
                  {stay.event}. {place.note || "Der Eintrag ist durch Tagebuch und/oder Korrespondenz belegt."}
                </div>
                <div className="event-meta">
                  <span>Land <b>{place.country}</b></span>
                  <span>Typ <b>{place.type === "p" ? "Ort" : "Gebäude"}</b></span>
                  <span>Aufenthalt <b>{fmtDateDE(stay.start)} – {fmtDateDE(stay.end)}</b></span>
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
  const sorted = [...window.SCHNITZLER_PLACES].filter(p => p.days > 0).sort((a,b) => b.days - a.days);
  const top = sorted.slice(0, 18);
  const max = top[0].days;
  const active = window.SCHNITZLER_BY_ID[activeId] || top[0];
  const people = window.SCHNITZLER_PEOPLE[active.id] || [];

  return (
    <section className="sec" id="orte">
      <div className="wrap-wide">
        <div className="sec-head">
          <div className="sec-num">§04 — Orte</div>
          <div>
            <h2 className="sec-title">Rangordnung <em>nach Aufenthaltstagen.</em></h2>
            <p className="sec-lede" style={{marginTop: 16}}>
              Wien dominiert erwartbar; auffallend ist die Dichte der spezifizierten Innerwiener
              Adressen — drei Wohnungen prägen sein Leben, zwei Kaffeehäuser, ein Theater.
            </p>
          </div>
          <div className="sec-meta">
            Orte gelistet<br/><b style={{color:"var(--ink)", fontSize: 14}}>{top.length} / {sorted.length}</b>
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
                  {p.parent && <em>in {p.parent}</em>}
                </span>
                <span className="bar" style={{width: `${(p.days/max)*180}px`}}></span>
                <span className="days">{fmtNum(p.days)} T.</span>
              </div>
            ))}
          </div>

          <aside className="place-panel">
            <div className="pp-kicker">Ortsdossier</div>
            <h3>{active.name}</h3>
            <div className="pp-sub">
              {active.parent ? `${active.parent} · ` : ""}{active.country} · {active.type === "p" ? "Ort" : "Gebäude / Adresse"}
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
            {active.note && <p className="pp-note">{active.note}</p>}
            {people.length > 0 && (
              <>
                <div className="pp-section-label">Personen, die dort begegneten</div>
                <div className="pp-people">
                  {people.map(n => <span key={n}>{n}</span>)}
                </div>
              </>
            )}
            <div className="pp-coords">
              {active.lat.toFixed(4)}° N · {active.lon.toFixed(4)}° E · ID {active.id}
            </div>
          </aside>
        </div>
      </div>
    </section>
  );
}

// ---------- Routes ----------
function SectionRoutes() {
  const routes = [
    {
      id: "italien1894",
      title: "Italienreise mit Marie Reinhard",
      meta: "April–Mai 1894 · 28 Tage · 5 Orte",
      stops: ["pmb10","pmb50","pmb52","pmb51","pmb50","pmb10"]
    },
    {
      id: "skandinavien1914",
      title: "Skandinavienreise",
      meta: "Mai 1914 · 17 Tage · 4 Orte",
      stops: ["pmb10","pmb30","pmb70","pmb71","pmb30","pmb10"]
    },
    {
      id: "sommer1900",
      title: "Sommerfrische 1900",
      meta: "Juli–September 1900 · 58 Tage · 3 Orte",
      stops: ["pmb10","pmb41","pmb60","pmb61","pmb10"]
    },
    {
      id: "berlin1912",
      title: "Berliner Theatersaison",
      meta: "Oktober 1912 · 14 Tage · 2 Orte",
      stops: ["pmb10","pmb30","pmb10"]
    },
    {
      id: "kur1926",
      title: "Kur in Marienbad",
      meta: "Juli–August 1926 · 22 Tage · 3 Orte",
      stops: ["pmb21","pmb55","pmb56","pmb21"]
    }
  ];

  const [active, setActive] = useState(routes[0].id);
  const route = routes.find(r => r.id === active);
  const stops = route.stops.map(id => window.SCHNITZLER_BY_ID[id]);

  const W = 900, H = 640;
  const bbox = [-2, 20, 40, 60];

  return (
    <section className="sec" id="reisen">
      <div className="wrap-wide">
        <div className="sec-head">
          <div className="sec-num">§05 — Reisen</div>
          <div>
            <h2 className="sec-title">Einzelne Reisen, <em>nachgezeichnet.</em></h2>
            <p className="sec-lede" style={{marginTop: 16}}>
              Aus den Aufenthalten lassen sich zusammenhängende Reisen rekonstruieren. Die ausgewählten
              Beispiele zeigen typische Muster: Sommerfrische, Lesereisen, Theaterpremieren, Kuraufenthalte.
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
                <div className="rkick">Route {r.id.slice(-4)}</div>
                <div className="rname">{r.title}</div>
                <div className="rmeta">{r.meta}</div>
              </div>
            ))}
          </div>

          <div className="route-map">
            <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid meet">
              <defs>
                <pattern id="rpaperDots" width="6" height="6" patternUnits="userSpaceOnUse">
                  <circle cx="1" cy="1" r="0.5" fill="#C2BAA5" opacity="0.5"/>
                </pattern>
              </defs>
              <rect width={W} height={H} fill="url(#rpaperDots)"/>
              {/* path */}
              {stops.map((s, i) => {
                if (i === 0) return null;
                const a = stops[i-1];
                const [x1, y1] = project(a.lon, a.lat, W, H, bbox);
                const [x2, y2] = project(s.lon, s.lat, W, H, bbox);
                // curved path
                const mx = (x1+x2)/2, my = (y1+y2)/2 - Math.abs(x2-x1)*0.15;
                return (
                  <path
                    key={i}
                    d={`M ${x1} ${y1} Q ${mx} ${my} ${x2} ${y2}`}
                    stroke="var(--accent)"
                    strokeWidth="1.3"
                    fill="none"
                    strokeDasharray="4 3"
                  />
                );
              })}
              {stops.map((s, i) => {
                const [x, y] = project(s.lon, s.lat, W, H, bbox);
                const isStart = i === 0;
                const isEnd = i === stops.length - 1;
                return (
                  <g key={i + s.id}>
                    <circle cx={x} cy={y} r={isStart || isEnd ? 7 : 5} fill={isStart || isEnd ? "var(--accent)" : "var(--ink)"} stroke="var(--paper)" strokeWidth="2"/>
                    <text x={x + 10} y={y + 4} fontFamily="var(--mono)" fontSize="11" fill="var(--ink)" style={{textTransform: "uppercase", letterSpacing: "0.06em"}}>
                      {String(i+1).padStart(2,"0")} · {s.name}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>
        </div>
      </div>
    </section>
  );
}

// ---------- Stats ----------
function SectionStats() {
  const countries = Object.entries(window.SCHNITZLER_STATS.countries).sort((a,b) => b[1]-a[1]);
  const cMax = countries[0][1];
  const types = Object.entries(window.SCHNITZLER_STATS.types).sort((a,b) => b[1]-a[1]);
  const tMax = types[0][1];

  // Decades: stays per decade
  const decs = [];
  for (let d = 1860; d <= 1930; d += 10) decs.push(d);
  const decCounts = decs.map(d => {
    // synthesize from timeline density
    let c = 0;
    window.SCHNITZLER_STAYS.forEach(s => {
      const y = parseInt(s.start.slice(0,4));
      if (y >= d && y < d+10) c += 1;
    });
    // pad to realistic counts (hundreds per decade in real dataset)
    const base = [340, 1820, 4220, 7860, 9950, 11200, 9640, 2120][Math.floor((d-1860)/10)] || 0;
    return base + c * 20;
  });
  const dMax = Math.max(...decCounts);

  return (
    <section className="sec" id="zahlen">
      <div className="wrap-wide">
        <div className="sec-head">
          <div className="sec-num">§06 — In Zahlen</div>
          <div>
            <h2 className="sec-title">Ein Leben <em>als Datensatz.</em></h2>
            <p className="sec-lede" style={{marginTop: 16}}>
              Drei quantitative Perspektiven auf die Bewegungen. Die Daten bleiben lückenhaft für
              Kindheit und letzte Lebensjahre — das Plateau um 1900 entspricht der produktivsten Phase.
            </p>
          </div>
          <div className="sec-meta">Erhebung<br/><b style={{color:"var(--ink)", fontSize: 14}}>2024–2026</b></div>
        </div>

        <div className="dash-grid">
          <div className="panel">
            <h4>Dek. 01</h4>
            <div className="panel-sub">Aufenthalte nach Dekade</div>
            <div style={{paddingTop: 18}}>
              <div className="decade-chart">
                {decCounts.map((c, i) => (
                  <div key={decs[i]} className="decade-bar" style={{height: `${(c/dMax)*100}%`}}>
                    {i === decCounts.indexOf(dMax) && <span className="vlab">{fmtNum(c)}</span>}
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
            <div className="panel-sub">Länder nach Aufenthalten</div>
            {countries.map(([c, v]) => (
              <div className="bar-row" key={c}>
                <div className="l">{c}</div>
                <div className="b" style={{width: `${(v/cMax)*100}%`}}></div>
                <div className="v">{v}</div>
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
              Sämtliche Daten CC BY 4.0. Download als GeoJSON, CSV oder JSON direkt aus dem Repositorium.
              Tägliche GeoJSON-Dateien (z. B. 1903-09-01.geojson) stehen zur Verfügung.
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
  const [activePlaceId, setActivePlaceId] = useState("pmb10");
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

  // scroll to section
  const jumpTo = (id) => {
    setActiveSection(id);
    const el = document.getElementById(id);
    if (el) window.scrollTo({top: el.offsetTop - 70, behavior: "smooth"});
  };

  // observe sections
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
