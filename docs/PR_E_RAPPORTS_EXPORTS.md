# PR E — Rapports / Exports

## Livré

- Hub **`/rapports`** — liste des exports PDF (print HTML) et CSV Excel
- **CSV Excel-compatible** (UTF-8 BOM, séparateur `;`) :
  - `GET /api/exports/risques` — risques non archivés de l’unité courante
  - `GET /api/exports/arbitrages` — arbitrages non archivés
- **Rapports imprimables** (`Imprimer / PDF` via le navigateur, `@media print`) :
  - `/rapports/processus/[id]?sections=…` — sections sélectionnables (défaut : toutes)
  - `/rapports/responsable` — snapshot KPI / objectifs / charge équipe
  - `/rapports/risques` — rapport gestion des risques (narratif + KPI + table)
  - `/rapports/gouvernance-unite` — vue gouvernance (attributions, objectifs, processus, risques, arbitrages, décisions)
- Liens UI : Exporter PDF (fiche processus), Exporter Excel (risques / arbitrages), Rapport PDF (dashboard responsable)
- Nav Gouvernance → **Rapports**
- Helpers : `src/lib/exports/csv.ts`, `src/lib/exports/auth.ts`, `src/lib/exports/processus-sections.ts`

## Sections processus

`presentation,etapes,raci,risques,controles,arbitrages,conformite,qualite,actifs,continuite,documentation`

Exemple : `/rapports/processus/<id>?sections=presentation,risques,raci`

## Migration

N/A — pas de changement de schéma.

## Dette

- PDF = impression navigateur (pas de moteur PDF serveur)
- Pas d’export CSV processus / décisions
- Sections processus non exposées en UI de cases à cocher (query string uniquement)
