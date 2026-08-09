# Préparation Éditeur (key user) — hors sprint

Inventaire des éléments encore **hardcodés ou semi-configurables** qui devront migrer vers un Éditeur / Administration avancée.  
**Pas d’implémentation dans ce sprint.**

## Déjà en base (CRUD Admin partiel ou seed)

| Élément | Aujourd’hui | Cible Éditeur |
|---------|-------------|----------------|
| Unités | Admin `/administration/unites` | Enrichir (hiérarchie, multi-unités croisées) |
| Utilisateurs / rôles app | Admin `/administration/utilisateurs` | Sync AD / Entra ID, groupes |
| `ReferentielValeur` (taxinomies) | Seed + `src/lib/referentiels.ts` | UI Admin listes |
| `ParametreFonctionnel` | Seed (délai conseil) | UI Admin paramètres unité |
| `ObjectifModule` (KPI) | Seed + Dashboard lecture | UI Admin / module |

## Hardcodés dans le code (à migrer)

| Élément | Emplacement | Notes |
|---------|-------------|--------|
| Types de Missions | `MissionType` + seed | Déjà en DB — UI Éditeur manquante |
| Templates de Missions | `MissionTemplate.definition` JSON | Éditeur de structure sections |
| Rôles de Mission | `MissionRole` | ≠ rôles app (Collaborateur / Responsable / Admin) |
| Descriptifs mission | `MissionDescriptifPreset` | Listes métier |
| Catégories tâche | enum `CategorieTache` + `catalog.ts` | Vers référentiel |
| Statuts / priorités enums | `catalog.ts` / Prisma enums | Garder enums structurels ; labels Admin |
| Modèles de tâches | CRUD métier `/modeles-taches` | Key user = même fiche ou Éditeur dédié |
| Sections / champs futurs | — | Méta-modèle (roadmap) |

## Règle

Tant que l’Éditeur n’existe pas : **ne pas dupliquer** en hardcodant de nouvelles listes métier sans passer par `ReferentielValeur` / modèles en base lorsque c’est simple.
