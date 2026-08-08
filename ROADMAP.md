# Feuille de route produit — GRC Pilotage

> Document de vision. **Aucun de ces modules n’est à développer tant qu’il n’est pas explicitement demandé.**  
> Objectif : garder les prochaines évolutions cohérentes avec l’architecture.

---

## Principes fondamentaux

1. **Simplicité avant richesse fonctionnelle**
2. **Une information n’est saisie qu’une seule fois**
3. **Chaque module métier peut générer automatiquement des actions (tâches)**
4. **Donner envie d’avancer** : vision claire, listes qui diminuent, indicateurs qui se mettent à jour — **sans gamification** (pas de points / badges artificiels)

Slogan produit : *Simple à utiliser, flexible à configurer.*

---

## Philosophie des objets

### Objets métier (cycles de vie propres)

| Objet | Rôle |
|-------|------|
| **Projet** | Mission / chantier de l’unité |
| **Conseil** | Demande ponctuelle d’analyse / avis / recherche *(aujourd’hui : catégorie de tâche ; demain : objet distinct)* |
| **Processus** | Référentiel / cartographie des processus (doc détaillée → Confluence) |
| **Contrôle SCI** | Définition permanente d’un contrôle ; exécution = tâches / occurrences |
| **Mission d'assurance** | Audit ou Revue de processus (évolution progressive du module Audits) |
| **Document** | Inventaire documentaire + revues |
| **Risque** | Registre des risques + matrice de criticité |
| **Unité** *(roadmap)* | Carte d’identité opérationnelle agrégée (≠ admin technique) |

### La tâche n’est pas un métier

**Principe général :** les objets métier définissent et structurent l’activité ; les tâches représentent son exécution opérationnelle.

Exemples :

| Objet métier | Exécution (tâche) |
|--------------|-------------------|
| Contrôle SCI | Occurrence de contrôle (T1, T2…) |
| Document | Revue documentaire |
| Mission d'assurance | Travaux de mission |
| Projet | Actions d’avancement |
| Conseil | Peut apparaître aussi comme tâche dans la planification |

L’objectif n’est pas de transformer tous les objets en tâches, mais de conserver une distinction claire entre **ce qui existe / doit être piloté** et **ce qui doit être réalisé par un collaborateur**.

Une **tâche** est une **action** découlant d’un objet métier (ou créée librement).

Elle peut être créée :

- librement ;
- automatiquement depuis un **projet** ;
- automatiquement depuis un **conseil** ;
- automatiquement depuis un **contrôle SCI** ;
- automatiquement depuis un **audit** ;
- automatiquement depuis une **revue documentaire**.

Conséquence UI : le **Backlog** est la vue de travail quotidienne. L’onglet « Tâches » actuel est un pont MVP ; sa pertinence à long terme sera revue (fusion / simplification possible vers Backlog + fiches métier).

---

## Navigation cible (progressive)

| Onglet | Statut | Rôle |
|--------|--------|------|
| Pilotage | MVP | Synthèse unité + à traiter + échéances |
| Backlog | MVP (à enrichir) | Vue de travail quotidienne |
| Tâches | MVP | Liste / CRUD actions (à réévaluer vs Backlog) |
| Projets | MVP | Cycle de vie projets |
| Contrôles SCI | Placeholder | Registre + preuves + échéances |
| Conseils | Futur | Objet métier (migration depuis catégorie tâche) |
| Risques | Futur | Registre + matrice 5×5 + génération de contrôles |
| Documents | Futur | Inventaire + revues planifiées |
| Équipe | Futur | Vue responsable d’unité |
| Audits | Futur | Module dédié |
| Boîte de réception | Long terme | Entrée commune sans double saisie |

---

## Modules prévus (détail)

### 1. Backlog (évolution)

Vue de travail quotidienne, pas un outil de planification heure par heure.

À terme :

- vue personnelle des actions ;
- planification simple : **Aujourd’hui / Cette semaine / Ce mois** ;
- vision de la charge par collaborateur ;
- visualisation des échéances.

### 2. Vue Équipe

Pour le responsable d’unité, par collaborateur :

- projets, conseils, tâches, contrôles SCI, audits ;
- charge approximative ;
- éléments en retard ;
- puis objectifs individuels (objectif, résultat attendu, réalisé, avancement, échéance).

### 3. Risques

Champs cibles : nom, description, processus, responsable, catégorie, **probabilité / impact inhérents**, **probabilité / impact résiduels**, criticité calculée, statut.

Catégories : Financier · Opérationnel · Conformité · Cybersécurité · Reporting · Juridique · Système d'information.

- Matrice de criticité **5 × 5** filtrable (catégorie, inhérent / résiduel).
- Depuis un risque → création d’un ou plusieurs **contrôles SCI** (le contrôle = réponse au risque).

**Roadmap (prochains sprints) :** visualisation de l’évolution d’un risque entre niveau **inhérent** et niveau **résiduel** (parcours / flèches sur la matrice).

### 4. Contrôles SCI

- **Définition permanente** (Actif / Suspendu / Archivé) : objectif, description, risques couverts, responsable, type, fréquence, fenêtre de déclenchement.
- **Exécution = tâches / occurrences** (À faire, En cours, Réalisées, En retard) — pas de statut « Réalisé » sur le contrôle lui-même.
- Preuves rattachées à l’occurrence (tâche), pas à la définition.
- Peuvent être générés depuis les risques.
- Quand une occurrence est clôturée → prochaine occurrence selon la fréquence (évolution prévue).

### 5. Documents

Inventaire : nom, type, version, responsable, date d’approbation, prochaine revue, statut, fichier.

- Revues planifiées (ex. annuelles).
- Une revue due **crée automatiquement une tâche** pour le responsable.
- Hiérarchie fiche : Informations → Éléments associés → Tâches de revue (secondaire).

### 5bis. Relations entre objets

Architecture générique `LienObjet` : tout objet métier peut être lié librement à tout autre (Projets, Missions d'assurance, Conseils, Risques, Contrôles SCI, Documents, Actions). Section **Éléments associés** sur chaque fiche.

**Consultation vs modification :** par défaut une fiche est en consultation ; les liens et infos structurantes se modifient uniquement après **Modifier** → Enregistrer / Annuler (prépare droits, versioning, validation).

### 5ter. Missions d'assurance (évolution d’Audits)

Le module Audits évolue progressivement vers **Missions d'assurance** :

- types : **Audit** · **Revue de processus** ;
- moteur commun : planification, travaux, rapport, recommandations, suivi ;
- templates différenciés par type (plus tard).

**Roadmap (prochains sprints) — programmes récurrents :**  
ex. programme de revue des processus avec rotation tous les 3 ans ; chaque occurrence génère automatiquement une Mission d'assurance de type Revue de processus. À concevoir sans développer maintenant.

### 5quater. Export Excel (roadmap)

Fonctionnalité transversale : export Excel des inventaires (Projets, Conseils, Missions d'assurance, Risques, Contrôles SCI, Documents, Processus). Si des filtres sont actifs, pouvoir exporter la **vue filtrée** (ex. risques résiduels élevés affichés).

### 5quinquies. Processus

Référentiel métier `Processus` (codes PRC-xxxx). Associations libres via `LienObjet`. Chaîne cible : **Unité → Processus → Risques → Contrôles SCI → Occurrences**. Hiérarchie parent optionnelle (macro → processus → sous-processus). Pas de GED : lien Confluence pour la documentation.

### 5sexies. Fiche Unité (roadmap — après stabilisation Processus)

Distinguer :

- **Administration technique** des unités et des droits ;
- **Fiche métier Unité** : carte d’identité opérationnelle (mission, responsable/adjoint, processus, vue agrégée risques/contrôles/projets/missions/documents).

Cette vue **agrège** les informations déjà présentes — pas de double saisie.

### 6. Indicateurs par module

Indicateurs de progression (pas de gamification). Exemples :

| Module | Exemples d’indicateurs |
|--------|------------------------|
| Pilotage | Vue synthétique de l’unité |
| Conseils | Reçues, clôturées, temps moyen, respect délai cible (5 j. ouvrés), en attente |
| Projets | Actifs, terminés, respect échéances, en retard, avancement global, jalons |
| Contrôles SCI | Réalisés, planifiés, en retard, taux de réalisation |
| Documents | Inventoriés, revues à faire / en retard / réalisées |
| Risques | Nombre, répartition, critiques, élevés, traités |
| Audits / Missions d'assurance | Réalisés, en cours, recommandations ouvertes/clôturées, planning annuel |

### 7. Boîte de réception (long terme — non prioritaire)

Pas un remplacement de la messagerie : éviter les doubles saisies.

Flux cible : e-mail → Conseil → tâches auto → Backlog → suivi → statistiques.

**À développer seulement après stabilisation des fondations.**

---

## Ordre de maturité suggéré (indicatif)

Ordre logique pour limiter les refontes — à confirmer avant chaque étape :

1. Stabiliser objets métier + Backlog comme vue d’action
2. Extraire **Conseil** en objet dédié (migration depuis catégorie)
3. Enrichir **Contrôles SCI** (CRUD, preuves, prochaine occurrence)
4. Module **Risques** (+ lien vers contrôles)
5. Module **Documents** (+ revues → tâches)
6. Vue **Équipe** + objectifs
7. Indicateurs enrichis par module
8. Audits
9. Boîte de réception

---

## État actuel du MVP (ancre)

Déjà en place et compatible avec cette vision :

- Utilisateur, Projet, Tâche (actions), Contrôle SCI (modèle), Document (métadonnées), liens de preuves
- Traçabilité + champs de validation
- Catégorie tâche `CONSEIL` comme **pont temporaire** vers le futur objet Conseil
- Champ `meta` JSON sur Projet/Tâche pour extensions futures
- Catalogue centralisé (`src/lib/catalog.ts`) pour listes configurables plus tard
- Stub vue Équipe (`src/lib/equipe.ts`)

Voir aussi : [ARCHITECTURE.md](./ARCHITECTURE.md)
