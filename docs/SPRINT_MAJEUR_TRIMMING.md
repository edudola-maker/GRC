# Sprint majeur — Trimming UX + Notes + Journal + Planification

> Itération prioritaire (pas toute la roadmap). Philosophie : **moins, mais mieux**.

## A — Développé maintenant

### Trimming UX
- Administration : bande latérale retirée → label orange `ADMINISTRATION` au-dessus du titre
- Textes pédagogiques permanents sous les titres inventaire / admin / nouveau → déplacés derrière ⓘ (`ModuleHelp`)
- KPI inventaires : max 3–4 indicateurs actionnables (ex. Conseils : ouverts / à traiter / clôturés — % délai retiré)

### Dashboards
- **Collaborateur** (`/`) : « Ma journée » — Reprendre, semaine compacte (⚑ échéance vs ▸ planifié), liste À faire
- **Responsable** (`/responsable`) : cockpit 4 blocs cliquables (charge, échéances, activité, objectifs) → inventaires filtrés

### Notes / Séances
- Modèle `NoteTravail` (+ questions, participants internes/externes)
- Sections sur **Projet**, **Conseil**, **Mission** (étape Planification)
- Type facultatif Séance ; création rapide de tâche depuis une note
- Pas de module Notes global en navigation

### Journal de bord
- Modèle `JournalBordEntree` — chronologie métier volontaire
- Distinct de Notes et de `JournalEvenement` (système)
- Proposition « Ajouter au journal » après clôture de tâche (jamais automatique)

### Conseil
- Zone **Réponse / Conclusion** (`reponseConclusion`)
- Dupliquer / nouveau lié (`conseilPrecedentId`)
- Notes + Journal de bord + historique système replié

### Planification Mission
- Objectifs structurés (`MissionObjectif`)
- Risques de mission (`MissionRisque`, lien GRC facultatif)
- Documentation demandée (`MissionDocumentation` : Demandé / Reçu / Analysé)
- Notes/Séances rattachées à l’étape PLANIFICATION
- Création rapide de tâches (titre, responsable, échéance, charge j.)

### Tâches
- Création rapide depuis objet (`QuickTacheForm`) — rattachement auto
- Charge estimée en jours décimaux (déjà en schéma)

## B — Architecture préparée (non sur-développé)

Voir `docs/ARCHITECTURE_SUBSTANTIF.md` :
- Chaîne Objectif → Risque mission → Papier de travail → Conclusion → Constat → Reco
- Validation quatre yeux (grandes étapes)
- Réévaluation périodique Risques
- Recherche globale / Cmd+K

## C — Roadmap uniquement

IA (Notes → PV), Export Word/Excel, Conformité, LPD avancée, Éditeur/Key User, Multi-unités/RBAC/AD.

## Migrations

`20260811200000_notes_journal_planification`

## Décisions métier restantes

1. Fréquence de revue risques : configurable par risque ou par catégorie ?
2. PV : objet séparé dès la V1 notes, ou génération différée ?
3. Notifications : canal (in-app seul) et seuils d’échéance proche ?
4. Objectifs annuels dashboard : source ObjectifModule vs Objectif stratégique ?

## Tests

- `prisma migrate deploy` + `tsc` + `npm run build`
- Pages : `/`, `/responsable`, `/conseils/[id]`, `/projets/[id]`, `/missions/[id]/planification`, `/administration/utilisateurs`
- Démo Cloudflare fournie en fin de livraison
