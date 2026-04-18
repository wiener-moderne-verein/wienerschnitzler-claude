# Wiener Schnitzler — Schnitzlers Wien

Eine datenjournalistische Website zu Arthur Schnitzlers (1862–1931) Aufenthaltsorten, basierend auf dem Datensatz des [Wiener Moderne Vereins](https://github.com/wiener-moderne-verein/wienerschnitzler-data).

> Über 47.000 dokumentierte Aufenthalte an knapp 4.950 Orten — taggenau georeferenziert.

## Features

- **Karte** — alle besuchten Orte als proportionale Punkte auf stilisierter Europakarte
- **Zeitleiste** — 69 Jahre Bewegungsdichte mit literarischen Meilensteinen
- **An diesem Tag** — Datumspicker für jeden Tag zwischen 1862 und 1931, inkl. „Vor 100 Jahren"
- **Orte** — Rangliste der meistbesuchten Orte mit Detaildossier und begegneten Personen
- **Reisen** — rekonstruierte Einzelreisen (Italien 1894, Skandinavien 1914, …)
- **In Zahlen** — Aufenthalte nach Dekade, Land und Ortstyp

## Projektstruktur

```
.
├── index.html              # fertig gebaute Single-Page-Version (inline CSS + JSX)
├── app.jsx                 # React-Hauptkomponente (Entwicklung)
├── styles.css              # Typ- und Layout-System (Entwicklung)
├── data/
│   ├── schnitzler.js       # gebündelter Datensatz (wird durch Workflow überschrieben)
│   └── source/             # rohe Upstream-Dateien (durch Workflow gefüllt)
│       ├── wienerschnitzler_timeline.json
│       ├── uebersicht.json
│       └── indices/
│           ├── listplace.xml
│           └── partOf.xml
├── scripts/
│   └── build-data.mjs      # transformiert Upstream-Daten → data/schnitzler.js
└── .github/workflows/
    ├── sync-data.yml       # täglicher Datenabgleich
    └── pages.yml           # GitHub-Pages-Deploy
```

## Lokale Entwicklung

Einfach `index.html` im Browser öffnen — keine Build-Schritte nötig. Für Entwicklung gegen
die Quellen `app.jsx` und `styles.css` bauen:

```bash
npm run build   # erzeugt index.html aus app.jsx + styles.css
```

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
