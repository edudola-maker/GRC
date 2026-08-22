# PR D — Gouvernance (qualité / conformité / arbitrages / décisions)

## Livré

- CRUD **Exigences** `EXI-xxxx` (`/exigences`) — statut de conformité, multi-lien processus
- CRUD **Arbitrages** `ARB-xxxx` (`/arbitrages`) — règle retenue, processus / risque optionnels
- CRUD **Décisions** `DEC-xxxx` (`/decisions`) — décideur, date, chaînage décision précédente
- **Qualité processus** : `ProcessusQualite` + revue (questionnaire) + écarts — panneau sur fiche Processus
- **Objectifs** : cases SMART + multi-sélection attributions (`UniteAttribution`) + mode de progression
- Nav Gouvernance : Exigences, Arbitrages, Décisions
- Seed : 1 EXI, 1 ARB, 1 DEC, `ProcessusQualite` sur PRC-0001, séquences EXI/ARB/DEC

## Migration

`20260822180000_gouvernance_qualite_conformite`

## Dette

- Pas d’inventaire avancé / filtres (listes simples)
- Progression automatique Objectif non calculée (mode déclaré seulement)
- Lien Exigence ↔ Contrôle / Document non exposé en UI (schéma prêt)
