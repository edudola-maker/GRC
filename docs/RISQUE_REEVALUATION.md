# Architecture proposée — réévaluation des risques

> Proposition simple avant nouveau référentiel lourd.

## Besoin

Documenter une réévaluation périodique **même si la note ne change pas** :

- date, auteur
- ancienne / nouvelle évaluation (P, I, résiduel)
- commentaire / réflexion

## Modélisation recommandée (légère)

**Option A (préférée Phase 1) — événement + snapshot dans le journal**

`JournalEvenement` avec `typeEvenement = REEVALUATION` et message structuré, **plus** une entrée JSON courte en `message` ou table mince :

```
RisqueReevaluation
  id, risqueId, uniteId
  dateReevaluation
  auteurId
  probabiliteAvant / impactAvant / criticiteAvant
  probabiliteApres / impactApres / criticiteApres
  (+ résiduel avant/après si renseigné)
  commentaire
  creeLe
```

- Si les notes changent → aussi `HistoriqueModification` (diffs de champs) + bump `contenuVersion`.
- Si les notes **ne changent pas** → uniquement `RisqueReevaluation` + journal `REEVALUATION` (pas de faux diff).

## Distinction

| Flux | Quand |
|------|--------|
| **Historique** | Changement de valeur de champ |
| **Journal / réévaluation** | Acte métier « j’ai réévalué », avec réflexion |

## UI

Action « Documenter une réévaluation » sur la fiche Risque → formulaire court → liste chronologique sous Journal ou box « Réévaluations ».

## Hors scope immédiat

Pas de calendrier automatique de revue ni de module LPD dédié ; lien futur avec conservation / Protection des données.
