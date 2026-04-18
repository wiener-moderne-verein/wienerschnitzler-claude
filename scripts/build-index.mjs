#!/usr/bin/env node
// build-index.mjs — assemble the single-page index.html.
//
// Inlines styles.css and app.jsx (transformed at runtime by Babel-standalone), but
// keeps the bulky data/schnitzler.js as an external <script src="…"> so the HTML
// itself stays small enough to be served quickly. Leaflet is loaded from a CDN.

import { readFile, writeFile } from "node:fs/promises";

const css  = await readFile("styles.css", "utf8");
const app  = await readFile("app.jsx", "utf8");

const html = `<!doctype html>
<html lang="de">
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1"/>
  <title>Wiener Schnitzler — Schnitzlers Wien</title>
  <meta name="description" content="Arthur Schnitzler (1862–1931) — taggenau georeferenzierte Aufenthalte aus dem PMB-Datensatz."/>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Source+Serif+4:ital,opsz,wght@0,8..60,300..700;1,8..60,300..700&family=Inter+Tight:wght@300;400;500;600&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" integrity="sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY=" crossorigin=""/>
  <style>
${css}
  </style>
</head>
<body>
  <div id="root"></div>

  <script src="https://unpkg.com/react@18.3.1/umd/react.development.js" integrity="sha384-hD6/rw4ppMLGNu3tX5cjIb+uRZ7UkRJ6BPkLpg4hAu/6onKUg4lLsHAs9EBPT82L" crossorigin="anonymous"></script>
  <script src="https://unpkg.com/react-dom@18.3.1/umd/react-dom.development.js" integrity="sha384-u6aeetuaXnQ38mYT8rp6sbXaQe3NL9t+IBXmnYxwkUI2Hw4bsp2Wvmx4yRQF1uAm" crossorigin="anonymous"></script>
  <script src="https://unpkg.com/@babel/standalone@7.29.0/babel.min.js" integrity="sha384-m08KidiNqLdpJqLq95G/LEi8Qvjl/xUYll3QILypMoQ65QorJ9Lvtp2RXYGBFj1y" crossorigin="anonymous"></script>
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js" integrity="sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo=" crossorigin=""></script>

  <script src="data/schnitzler.js"></script>
  <script type="text/babel" data-presets="react">
${app}
  </script>
</body>
</html>
`;

await writeFile("index.html", html);
console.log(`Wrote index.html (${html.length} chars).`);
