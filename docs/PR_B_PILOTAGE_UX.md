# PR B — Pilotage / UX (calendrier éditable)

## Périmètre complété

- **Planification ≠ échéance** : `dateFinPlanifiee` sur Projet et Tâche ; Mission conserve `dateDebut`/`dateFin`.
- Calendrier collaborateur : drag & drop + resize (desktop) ; toast « Planification mise à jour — Annuler ».
- Mobile : liste / agenda, pas de drag forcé.
- Dashboard responsable : horizons Semaine / Mois / 3 mois / Année, filtres collaborateur + type, replanification visuelle, charge.
- Sidebar repliable, icônes SVG, Split View Processus, sliders Projet (déjà livrés sur cette branche).

## Migration

`20260822160000_planification_vs_echeance` — colonnes + copie historique début+échéance → fin planifiée.

## Dette / arbitrages

- Conseils / revues doc / SCI : bandes informatives non éditables (pas de plage planifiée dédiée).
- Vue « Année » = 26 semaines + pas de 13 (lisibilité, pas zoom illisible).
- Undo = un niveau (dernier déplacement).
