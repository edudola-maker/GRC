# Objectif · ObjectifAnnuel · ObjectifModule — distinction

Trois modèles coexistent. Ils répondent à **trois grains différents**.  
Avant tout enrichissement, cette note fixe le périmètre et le risque de doublon.

## Synthèse

| Modèle | Grain | Question | Consommateur principal | Maturité |
|--------|-------|----------|------------------------|----------|
| **`Objectif`** (OBJ-xxxx) | Stratégique **unité** | *Que vise l’unité cette année ?* | Fiche `/unite`, CRUD `/objectifs` | **Produit actif** |
| **`ObjectifAnnuel`** | Individuel **collaborateur** | *Que doit accomplir cette personne ?* | Dashboard `/responsable` (lecture) | **Socle données** — UI d’édition retirée avec `/equipe` |
| **`ObjectifModule`** | KPI **module métier** | *L’unité tient-elle ses cibles SCI / missions / … ?* | Dashboard `/responsable` (agrégation) | **Socle données** — saisie Admin future |

## Pourquoi trois besoins (et non un seul)

1. **`Objectif`** est un **objet métier** : code, statut, priorité, responsable, échéance, **liens libres** (`LienObjet`). Il pilote et se relie à Projets, Processus, Risques, etc. Pas d’OKR / scoring auto pour l’instant.
2. **`ObjectifAnnuel`** est un **suivi RH / management** : texte libre par personne et année, progression manuelle. Pas de code métier, pas de liens transverses. Sert au responsable pour la charge et les engagements individuels.
3. **`ObjectifModule`** est un **indicateur** : clé stable (`indicateurCle`), cible / réalisé numériques, module (`ModuleMetier`). Le dashboard **recalcule** souvent le réalisé depuis les objets métier ; la table porte la cible et le libellé.

Les fusionner mélangerait stratégie, management individuel et métrologie — trois cycles de vie et trois audiences.

## Risque de doublon (réel, mais maîtrisé)

- **Thématique** : le seed peut répéter « missions », « SCI 95 % », « délai conseils » dans `ObjectifAnnuel` **et** `ObjectifModule`, tandis qu’un `Objectif` traite le même sujet côté stratégie. Ce n’est pas le même objet : l’un engage une personne, l’autre une cible chiffrée, le troisième une intention d’unité reliée.
- **Dashboard** : `/responsable` affiche KPIs modules **et** stats synthétiques qui peuvent se chevaucher visuellement — à clarifier en UX, pas en fusion de schéma.
- **Nommage** : le verbe « objectif » est partagé ; les codes / écrans doivent toujours préciser le grain (OBJ-xxxx vs individu vs KPI).

## Décision de consolidation (confirmée)

**Verdict : ne pas fusionner.** Les trois grains restent nécessaires.

- **Conserver les trois modèles.**
- **Enrichir en priorité `Objectif`** (déjà produit) ; ne pas ajouter de champs OKR.
- **Geler** les évolutions de `ObjectifAnnuel` et `ObjectifModule` jusqu’à décision produit :
  - `ObjectifAnnuel` : où saisir ? (section Unité ? Admin ? hors scope)
  - `ObjectifModule` : CRUD Admin / Éditeur (voir `docs/EDITEUR_PREPARATION.md`)
- **Ne pas** créer de FK artificielles entre les trois tant que le besoin de cascade n’est pas explicite.
- L’ancien module `/equipe` (édition `ObjectifAnnuel`) est **supprimé** → redirection `/unite?focus=equipe`. Les actions d’écriture associées sont retirées.

Une fusion `Objectif`↔`ObjectifModule` ou `Objectif`↔`ObjectifAnnuel` entraînerait une **perte fonctionnelle** (liens métier vs KPI chiffrés vs suivi individuel).

## Règle pour les prochains sprints

Toute demande « d’objectifs » doit indiquer le grain.  
Si le besoin est un lien transversal ou un code lisible → **`Objectif`**.  
Si c’est une cible chiffrée de module → **`ObjectifModule`**.  
Si c’est un engagement de personne → **`ObjectifAnnuel`**.
