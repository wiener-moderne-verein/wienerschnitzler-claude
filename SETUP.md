# Einrichtung des GitHub-Repositoriums

Kurzanleitung zum Veröffentlichen dieses Projekts.

## 1. Repo anlegen

Auf github.com einloggen und ein **neues, leeres** Repository erstellen
(z. B. `wiener-moderne-verein/wienerschnitzler-site`). **Ohne** README, Lizenz
oder .gitignore — die liegen bereits hier.

## 2. Lokalen Ordner pushen

Im heruntergeladenen Projektordner:

```bash
git init -b main
git add .
git commit -m "initial: editorial site scaffolding"
git remote add origin git@github.com:<owner>/<repo>.git
git push -u origin main
```

## 3. GitHub Pages aktivieren

**Settings → Pages → Source → „GitHub Actions"**

Beim nächsten Push (oder manuell über **Actions → Deploy to GitHub Pages → Run workflow**)
wird die Seite veröffentlicht.

## 4. Daten-Sync starten

**Actions → Sync upstream data → Run workflow**

Danach läuft der Workflow automatisch täglich um 04:00 UTC und committet Änderungen
unter dem Account `schnitzler-bot`. Nach jedem Datencommit triggert der Pages-Workflow
automatisch ein Redeploy.

## 5. Upstream-URL anpassen (optional)

Falls das Upstream-Repo umzieht, in `.github/workflows/sync-data.yml` die Variable
`UPSTREAM_REPO` anpassen. Die tolerante Regex-Parsing-Strategie in
`scripts/build-data.mjs` übersteht moderate Schema-Änderungen, sollte aber bei
größeren Upstream-Refactors gegengeprüft werden.

## Hinweis zu den Lizenzen

- **Code** (dieses Repo): MIT
- **Daten** (vom Upstream eingespielt): CC BY 4.0 – Attribution bleibt beim Wiener Moderne Verein.
