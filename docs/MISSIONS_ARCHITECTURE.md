# Architecture Missions — Audits / Revues, cockpit, étapes, PV

> Un seul moteur `Mission` + templates. Séparation **fonctionnelle / UX**, pas deux modèles.
>
> **Cockpit + 5 sous-routes : implémentés** (contenu méthodologique volontairement souple).

## 1. Navigation Audits / Revues de processus

Route `/missions` avec onglets / query `?famille=audits|revues`.

| Famille | Types (`MissionType.code`) |
|---------|----------------------------|
| Audits | `AUDIT_*` |
| Revues de processus | `REVUE_*` |

## 2. Cockpit (page synthèse) — livré

`/missions/[id]` :

1. Identité / statut / type / code (Vue d’ensemble)
2. Bandeau de navigation des **5 étapes**
3. Cartes cliquables avec **états métier** + métriques complémentaires
4. Éléments associés + tags

Étape courante recommandée = première non terminée (**sans blocage** des autres).

## 3. Les 5 sous-routes — livrées

| Étape | Route | Contenu Phase 1 |
|-------|-------|-----------------|
| Planification | `/missions/[id]/planification` | Équipe, checklist, **risques de mission** (placeholder), validations, tâches, docs |
| Substantif | `/missions/[id]/substantif` | Structure souple : papiers de travail, constats, périmètre |
| Recommandations | `/missions/[id]/recommandations` | CRUD REC-xxxx |
| Rapport | `/missions/[id]/rapport` | Blocs typés vides (intro, périmètre, synthèse, constats, recos, annexes) |
| Suivi | `/missions/[id]/suivi` | Tableau + **% clôturées** objectivement calculable |

Lecture seule par défaut + `?edit=SECTION`.

## 4. Progression — états métier (pas de % artificiel)

```
Non commencé → En cours → À valider → Validé / Terminé
```

Mapping `SectionRedaction.etat` :

| État rédaction | Affichage |
|----------------|-----------|
| absent | Non commencé |
| `BROUILLON` / `OBSOLETE` | En cours |
| `A_VALIDER` | À valider |
| `FINALISE` / `VALIDE` | Validé / Terminé |

**Métriques complémentaires** (quand pertinentes) :

- Planification : `8/9 éléments de checklist`
- Substantif : `7 papiers · 3 constats` (dès que les objets existent)
- Recommandations : `3 recommandations · 2 ouvertes`
- Suivi : `3/5 clôturées (60 %)` — seul % affiché car objectivement mesurable

Lib : `src/lib/mission-etapes.ts`.

## 5. Principes métier retenus

- Analyse des **risques de mission** dans Planification ≠ objets Risque GRC
- Substantif : travail → éléments examinés → analyse → conclusion → constat éventuel
- Constat sans recommandation possible ; REC-xxxx autonome
- Mission clôturée ≠ toutes les recos clôturées
- Rapport en blocs (prépare draft futur — Roadmap)
- Compatibilité visas / versioning via `SectionRedaction`

## 6. Roadmap (pas d’implémentation)

- Draft de rapport généré depuis les données structurées
- PV / notes d’entretien (`MissionNote`)
- IA « mettre au propre » sans écraser les notes brutes

## 7. Code Mission modifiable

Livré : édition `MIS-nnnn`, unicité, historisation.
