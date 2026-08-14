# Architecture — Continuité des activités

> **Validée** (principe + décisions métier août 2026). Première implémentation sur fiche Processus.

## Philosophie

| Couche | Où | Rôle |
|--------|-----|------|
| **Analyse** | Fiche Processus — Continuité | Saisie légère |
| **Dépendances** | Actifs IT + ProcessusDependance | Sources de vérité |
| **Pilotage** | Vue consolidée (Roadmap) | Inventaire / alertes |

Pas de silo BCM autonome.

## Modèle livré — `ProcessusContinuité` (1–1)

| Champ | Notes |
|-------|-------|
| `criticite` | FAIBLE / MODEREE / ELEVEE / CRITIQUE |
| `consequencesInterruption` | texte |
| `mtpdValeur` + `mtpdUnite` | HEURES \| JOURS |
| `rtoValeur` + `rtoUnite` | idem |
| `rpoValeur` + `rpoUnite` | facultatif |
| `periodesCritiques` | texte |
| `modeDegradeMesures` | mode dégradé **et** mesures (fusion UX) |
| `commentaire` | justification |
| `dateDerniereRevue` / `dateProchaineRevue` | |
| Action « Marquer comme revue » | formalise une revue sans changer les valeurs |

## Dépendances

- **Actifs IT** : réaffichage de `ProcessusActifIT` (pas de ressaisie)
- **Processus ↔ Processus** : `ProcessusDependance` — listes « Dépend de » / « Processus dépendants », cliquables

## Vue consolidée

**Roadmap** — colonnes cibles : Processus | Unité | Criticité | MTPD | RTO | Actifs | Mode dégradé | Revues
