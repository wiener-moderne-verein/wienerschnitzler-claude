# Wiener Schnitzler — Schnitzlers Wien

Eine datenjournalistische Website zu Arthur Schnitzlers (1862–1931) Aufenthaltsorten, basierend auf dem Datensatz des [Wiener Moderne Vereins](https://github.com/wiener-moderne-verein/wienerschnitzler-data).

> Über 47.000 dokumentierte Aufenthalte an knapp 4.950 Orten — taggenau georeferenziert.

## Features

- **Karte** — alle 4 876 Orte als proportionale Punkte auf einer echten Leaflet-Weltkarte (CARTO Positron, monochrom getönt)
- **Zeitleiste** — 69 Jahre Bewegungsdichte aus 48 062 dokumentierten Aufenthalten
- **An diesem Tag** — Datumspicker für jeden Tag zwischen 1862 und 1931, inkl. „Vor 100 Jahren"
- **Orte** — Rangliste der meistbesuchten Orte mit Detaildossier, PMB-Link und begegneten Personen
- **Reisen** — automatisch aus dem Datensatz extrahierte Reisen außerhalb Wiens, gerendert als Leaflet-Route
- **In Zahlen** — Belege nach Dekade, Land und Ortstyp aus den Echtdaten

## Projektstruktur

```
.
├── index.html              # gebaute Single-Page-Version (CSS + JSX inline; data/schnitzler.js extern)
├── app.jsx                 # React-Hauptkomponente (Entwicklung)
├── styles.css              # Typ- und Layout-System (Entwicklung)
├── data/
│   ├── schnitzler.js       # gebündelter Datensatz (~3 MB · gzip ~440 kB · vom Workflow überschrieben)
│   └── source/             # rohe Upstream-Dateien (gitignored, vom Workflow gefüllt)
│       ├── editions/json/wienerschnitzler_timeline.json
│       ├── editions/json/uebersicht.json
│       └── indices/{listplace.xml, partOf.xml, living-working-in.xml}
├── scripts/
│   ├── build-data.mjs      # parst TEI/JSON → data/schnitzler.js
│   └── build-index.mjs     # baut index.html (Leaflet-CDN, externes data/schnitzler.js)
└── .github/workflows/
    ├── sync-data.yml       # täglicher Datenabgleich + Rebuild
    └── pages.yml           # GitHub-Pages-Deploy
```

## Lokale Entwicklung

Voraussetzung: laufende Quelldaten unter `data/source/` (siehe Workflow oder einmalig per
`bash` aus dem sync-data-Workflow ziehen). Anschließend:

```bash
npm run build   # build-data.mjs → data/schnitzler.js, dann build-index.mjs → index.html
```

Da `data/schnitzler.js` extern eingebunden wird, muss `index.html` über einen lokalen
HTTP-Server geöffnet werden (z. B. `python3 -m http.server`); ein direkter `file://`-
Aufruf funktioniert nicht, weil moderne Browser cross-origin Skripte dort blockieren.

Externe Abhängigkeiten zur Laufzeit (alle per CDN, kein Build-Tooling nötig):
React 18, ReactDOM, @babel/standalone (JSX in-Browser), **Leaflet 1.9.4** + CARTO-Tiles.

## Daten-Workflow

Ein GitHub-Actions-Workflow (`.github/workflows/sync-data.yml`) holt täglich um 04:00 UTC
die aktuellen Quelldateien aus dem Upstream-Repositorium
[`wiener-moderne-verein/wienerschnitzler-data`](https://github.com/wiener-moderne-verein/wienerschnitzler-data),
transformiert sie mit `scripts/build-data.mjs` in `data/schnitzler.js` und committet
bei Änderungen automatisch. Anschließend wird die Seite über GitHub Pages neu deployt.

Manuelles Auslösen über den Reiter **Actions → Sync upstream data → Run workflow**.

## Lizenz & Quellen

- **Daten:** CC BY 4.0 · © Wiener Moderne Verein
- **Code:** MIT
- **Primärquelle:** PMB – Personen der Moderne Basis, ACDH-CH, ÖAW
