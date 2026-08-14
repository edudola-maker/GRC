# Architecture — réévaluation des risques

> Implémenté (Phase 1). Distinct de l’Historique de contenu.

## Besoin

Documenter une réévaluation périodique **même si la note ne change pas** :

- date, auteur
- ancienne / nouvelle évaluation (P, I, résiduel)
- commentaire / réflexion

## Modèle

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

## Règles

| Situation | Effets |
|-----------|--------|
| Notes **inchangées** | `RisqueReevaluation` + journal `REEVALUATION` — **pas** d’entrée Historique ; maj éventuelle de `justificationEvaluation` |
| Notes **modifiées** | Idem + maj des champs risque + `HistoriqueModification` + bump `contenuVersion` |

## Aide à l’évaluation

Intégrée au formulaire Risque et à la réévaluation (`RisqueEvaluationAide`) :

- moteur déterministe (questions → proposition P/I + justification) ;
- l’utilisateur accepte ou modifie ;
- justification conservée sur `Risque.justificationEvaluation` pour les revues suivantes ;
- IA facultative plus tard (AIProvider) — hors scope actuel.

## Distinction

| Flux | Rôle |
|------|------|
| **Réévaluation** | Acte métier « j’ai revu le risque » |
| **Historique** | Diffs de champs (qui / quand / avant → après) |
| **Journal** | Événements fonctionnels (dont `REEVALUATION` résumé) |

## UI

Fiche Risque → section **Réévaluations** (`?edit=REEVALUATION`) : formulaire court + liste chronologique.

## Hors scope

Calendrier automatique de revue ; conservation LPD paramétrique (Protection des données).
