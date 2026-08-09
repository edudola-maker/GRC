# UX trimming transversal — 2026-08-09

## Objectif

Réduire la distance titre → contenu utile ; densifier le pilotage ; supprimer les box purement décoratives ou redondantes.

## Règle appliquée

| Catégorie | Traitement |
|-----------|------------|
| Indispensable | Immédiatement accessible |
| Utile secondaire | Compact / replié |
| Redondant / décoratif | Fusionné ou retiré |

## Changements

### Aide ⓘ
- Grandes box `ModuleHelp` remplacées par une icône ⓘ à côté du titre (`PageHeader.help`).
- Contenu pédagogique conservé en popover.

### Inventaires
- Box « Filtres et recherche » fusionnée dans la box **Inventaire** (`InventoryBrowser`).
- Recherche / filtres / avancée restent client-side (pas de reload).

### Pilotage
- Bandeau compact `PilotageStrip` / `KpiZone items`.
- Box autonome « À traiter » retirée → indicateur cliquable `?filtre=…#inventaire`.

### Unité `/unite`
- **Vue d’ensemble** retirée (redondante avec en-tête + Équipe + Admin).
- Ordre : Pilotage → Objectifs → Équipe → Processus → Missions → Éléments associés.
- Équipe enrichie (initiales, prénom/nom, fonction, rôle) depuis Utilisateurs.
- Section **Missions** agrégée (lecture seule, liens fiches).
- Identité unité (nom, description, resp., adjoint) : **Administration** uniquement.

### Objectifs
- Analyse confirmée : trois besoins distincts — voir `docs/OBJECTIFS.md`.
- Pas d’enrichissement / fusion dans cette passe.

## Points signalés (pas de perte silencieuse)

1. **Édition identité Unité** depuis `/unite` : retirée volontairement → Admin `/administration/unites`.
2. **Processus « À compléter »** : conserve la valeur via filtre `sans_confluence` (pas de liste intermédiaire).
3. **Matrice risques** : conservée (outil métier, pas une box décorative).
