# Architecture — dépendances de tâches Projet

> Implémenté (Phase 1). Voir aussi Roadmap §5septies-ter.

## Objectif

Planification séquentielle **optionnelle** :

- Tâche A → Tâche B → Tâche C
- tâches parallèles sans dépendance
- tâches sans dépendance

## Modèle

```
TacheDependance
  id
  projetId
  tacheId          // successeur
  prerequisId      // prédécesseur (même projet)
  @@unique([tacheId, prerequisId])
```

- Une tâche peut avoir **0..n** prérequis (tous doivent être `TERMINE` pour activer).
- Pas de cycles (validation à l’écriture).
- UI Phase 1 : **0 ou 1** prérequis par tâche (select simple) ; le modèle accepte N.

## Activation opérationnelle

`activeOperationnelle` = aucun prérequis **ou** tous les prérequis en statut `TERMINE`.

| Vue | Comportement |
|-----|----------------|
| **Fiche Projet** (box Tâches) | Toutes les tâches visibles ; badge « En attente du prérequis » si bloquée |
| **Dashboard** collaborateur / responsable | Exclut les tâches non activables |
| **Pilotage** (KPI tâches) | Idem |
| **Inventaire `/taches`** | Par défaut actives seulement ; `?planifiees=1` pour inclure les bloquées |

Dès clôture (`TERMINE`) du/des prérequis, le successeur devient automatiquement actif (pas d’action manuelle).

## Hors scope Phase 1

- Gantt / calendrier
- Charge agrégée collaborateur
- Multi-prérequis dans l’UI (modèle déjà prêt)
