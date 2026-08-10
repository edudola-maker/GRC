# Architecture Missions — Audits / Revues, cockpit, étapes, PV

> Un seul moteur `Mission` + templates. Séparation **fonctionnelle / UX**, pas deux modèles.

## 1. Navigation Audits / Revues de processus

**Approche retenue (simple) :** une route `/missions` avec onglets / query `?famille=audits|revues`.

| Famille | Types (`MissionType.code`) |
|---------|----------------------------|
| Audits | `AUDIT_*` (général, ciblé, interne…) |
| Revues de processus | `REVUE_*` (ex. `REVUE_PROCESSUS`) |

- Même inventaire, mêmes templates génériques.
- Pas de duplication de pages CRUD.
- Routes dédiées `/missions/audits` en redirect optionnel plus tard si besoin de deep-links.

## 2. Cockpit + cinq pages d’étapes

La page `/missions/[id]` devient un **cockpit** :

1. Identité / statut / type
2. Bandeau de progression des 5 étapes
3. Liens vers sous-pages

Sous-pages (cible) :

| Étape | Route | Contenu structuré (pas uniquement free-text) |
|-------|-------|-----------------------------------------------|
| Planification | `/missions/[id]/planification` | Équipe, checklist, validations, docs, tâches |
| Substantif | `/missions/[id]/substantif` | Dossiers de travail structurés (à définir) |
| Recommandations | `/missions/[id]/recommandations` | REC-xxxx |
| Rapport | `/missions/[id]/rapport` | Structure exploitable pour draft |
| Suivi | `/missions/[id]/suivi` | Suivi des recos |

Chaque étape : lecture seule par défaut, édition volontaire (`EditableSection` / `?edit=`).

**Migration :** le contenu aujourd’hui en sections verticales est progressivement déplacé vers ces routes ; interim possible via ancres `#PLANIFICATION`.

## 3. Progression par étape (règle explicable)

Éviter un % arbitraire.

Proposition :

| Source | Règle |
|--------|--------|
| `SectionRedaction.etat` | `FINALISE` / `VALIDE` → 100 % « Terminé » |
| `A_VALIDER` | 80 % « En revue » |
| `BROUILLON` avec contenu | 40–60 % « En cours » (selon sous-critères) |
| Absent / vide | 0 % « Non commencé » |
| Suivi | Basé sur % de recommandations clôturées (explicite) |

Sous-critères Planification (exemple) : équipe ≥1 + checklist initialisée + dates renseignées.

Affichage cockpit :

`1. Planification — 100 % — Terminé`

## 4. Draft de rapport (Roadmap)

Chaîne : données structurées des étapes → génération draft.

Ne pas baser le dossier uniquement sur des champs libres. Prévoir des blocs typés (constats, périmètre, synthèse) dès le Substantif / Rapport.

## 5. PV / notes d’entretien (Roadmap proche)

Objet simple (pas un gros référentiel) :

```
MissionNote
  id, missionId, uniteId
  titre, date
  etapeKey          // PLANIFICATION | SUBSTANTIF | …
  participants      // texte ou JSON court
  notesBrutes       // immuable après création / versionné
  notesPropres?     // proposition IA (jamais écrase notesBrutes)
  auteurId, creeLe
```

IA « Mettre au propre » → écrit `notesPropres` seulement ; notes brutes traçables.

## 6. Code Mission modifiable

Livré : édition du code (`MIS-nnnn`), unicité unité, format, historisation via `HistoriqueModification` + `contenuVersion`.
