#!/usr/bin/env node
// build-index.mjs — inline styles.css, data/schnitzler.js and app.jsx into index.html
// Kept dependency-free so it runs on plain `node` in CI.

import { readFile, writeFile } from "node:fs/promises";

const css  = await readFile("styles.css", "utf8");
const data = await readFile("data/schnitzler.js", "utf8");
const app  = await readFile("app.jsx", "utf8");

const html = `<!doctype html>
<html lang="de">
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1"/>
  <title>Wiener Schnitzler — Schnitzlers Wien</title>
  <meta name="description" content="Arthur Schnitzler (1862–1931) — über 47.000 dokumentierte Aufenthalte an knapp 4.950 Orten, taggenau georeferenziert."/>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Source+Serif+4:ital,opsz,wght@0,8..60,300..700;1,8..60,300..700&family=Inter+Tight:wght@300;400;500;600&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
  <style>
${css}
  </style>
</head>
<body>
  <div id="root"></div>

  <script src="https://unpkg.com/react@18.3.1/umd/react.development.js" integrity="sha384-hD6/rw4ppMLGNu3tX5cjIb+uRZ7UkRJ6BPkLpg4hAu/6onKUg4lLsHAs9EBPT82L" crossorigin="anonymous"></script>
  <script src="https://unpkg.com/react-dom@18.3.1/umd/react-dom.development.js" integrity="sha384-u6aeetuaXnQ38mYT8rp6sbXaQe3NL9t+IBXmnYxwkUI2Hw4bsp2Wvmx4yRQF1uAm" crossorigin="anonymous"></script>
  <script src="https://unpkg.com/@babel/standalone@7.29.0/babel.min.js" integrity="sha384-m08KidiNqLdpJqLq95G/LEi8Qvjl/xUYll3QILypMoQ65QorJ9Lvtp2RXYGBFj1y" crossorigin="anonymous"></script>

  <script>
${data}
  </script>
  <script type="text/babel" data-presets="react">
${app}
  </script>
</body>
</html>
`;

await writeFile("index.html", html);
console.log(`Wrote index.html (${html.length} chars).`);
