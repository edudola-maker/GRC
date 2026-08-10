# Architecture proposée — dépendances de tâches Projet

> Proposition avant moteur de workflow complexe. **Pas d’implémentation du graphe dans ce sprint.**

## Objectif

Permettre une planification séquentielle **optionnelle** :

- Tâche A → Tâche B → Tâche C
- tâches parallèles sans dépendance
- tâches sans dépendance

Tant qu’un prédécesseur n’est pas terminé / validé, le successeur reste **planifié dans le Projet** mais n’apparaît pas comme tâche active dans les vues opérationnelles (Dashboard, inventaire Tâches filtré « à traiter »).

## Modèle simple (recommandé)

Ne pas créer un moteur BPMN.

```
TacheDependance
  id
  projetId
  tacheId          // successeur
  prerequisId      // prédécesseur (même projet)
  @@unique([tacheId, prerequisId])
```

- Une tâche peut avoir **0..n** prérequis (tous doivent être clos pour activer).
- Pas de cycles (validation à l’écriture).
- Champ dérivé / calculé : `activeOperationnelle` = aucun prérequis ouvert **ou** pas de prérequis.

Statuts « clos » réutilisés : `TERMINE` (+ éventuellement `VALIDE` / `ANNULE` selon règle métier à figer).

## Activation

1. À la clôture d’une tâche Projet → recalculer les successeurs directs.
2. Inventaire `/taches` et Dashboard : filtre par défaut `activeOperationnelle = true` (avec option « Inclure planifiées »).
3. Fiche Projet box Tâches : **toujours** toutes les tâches (planifiées + actives), avec indication « En attente de… ».

## Hors scope Phase 1 (déjà livré / en cours)

- `dateDebut` / `dateEcheance` (fin)
- `chargeJours`
- commentaire métier (`commentaires`)
- priorité masquée dans le contexte Projet (conservée hors Projet)

## Suite

Calendrier / Gantt léger ; charge collaborateur agrégée via `chargeJours`.
