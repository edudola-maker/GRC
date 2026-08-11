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
| **Unité** | Carte d’identité opérationnelle agrégée (`/unite`, ≠ Administration) |

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

Conséquence UI :

- **Dashboard collaborateur** = vue personnelle / opérationnelle du quotidien ;
- **Tâches** = inventaire transversal complet (filtres, recherche, terminées) — distinct du Backlog historique.

---

## Navigation cible (progressive)

| Onglet | Statut | Rôle |
|--------|--------|------|
| Dashboard collaborateur | MVP | Vue personnelle / à traiter / échéances |
| Mon unité | MVP | Fiche métier agrégée |
| Tâches | MVP | Inventaire transversal de toutes les tâches |
| Projets | MVP | Cycle de vie projets |
| Contrôles SCI | MVP | Registre + preuves + échéances |
| Conseils | MVP | Objet métier |
| Risques | MVP | Registre + matrice 5×5 |
| Documents | MVP | Inventaire + revues planifiées |
| Équipe | Absorbé | Section de `/unite` (redirect `/equipe`) |
| Missions d’assurance | MVP | Routes `/missions` (redirect `/audits`) |
| Protection des données | Roadmap | Pilotage LPD + consolidation (voir §5ter-bis / `docs/LPD.md`) |
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

### 5ter. Missions (moteur générique — nom de module provisoire)

Objet technique `Mission` (codes **MIS-xxxx**). Chaîne cible :

**Type de mission → Template → Instance** (sections / workflow).

Socle livré : types & templates seedés, équipe + rôles, initiales, sections repliables, **édition indépendante par section** (lecture seule par défaut ; Vue d’ensemble = infos générales), recommandations **REC-xxxx**, check-lists / validations (structure), soft-delete. LPD by design minimal (`contientDonneesPersonnelles`, `niveauConfidentialite`) sur Mission / Template / Document / Processus. Réflexion documentée sur Mission / Risque / Conseil.

**Roadmap — Éditeur (key user) :** templates (sections, ordre, champs, rôles, check-lists, validations, livrables) sans modifier le code.

**Roadmap — invalidation automatique des visas :** si une section validée est modifiée → point de validation `OBSOLETE` / à revalider (`contenuVersion`).

**Roadmap — Dashboard responsable :** agréger les validations en attente.

**Roadmap — programmes récurrents :** ex. revue des processus tous les 3 ans → instances automatiques.

**Roadmap — routes :** migrer `/missions` vers le nom définitif du module.

### 5ter-bis. LPD by design + Protection des données (roadmap)

Vision détaillée : [`docs/LPD.md`](./docs/LPD.md).

**Principe :** documenter et démontrer les bonnes réflexions **sans** questionnaire LPD lourd. Intégré au quotidien, secondaire, repliable, peu contraignant.

**Socle livré :** `contientDonneesPersonnelles`, `niveauConfidentialite` (Mission / Template / Document / Processus). Pas de données personnelles réelles en démo. Confluence = référence documentaire détaillée.

**Au fil du travail (futur enrichissement léger) :** présence DP ; confidentialité ; courte réflexion / mesures ; règle de conservation si connue ; périmètre d’accès éventuel.

**Éviter la ressaisie :** héritage depuis Processus / Template / référentiel — l’utilisateur confirme ou adapte (ex. template de mission préqualifié).

**Onglet transversal « Protection des données »** — vue de **pilotage / consolidation** (pas un écran de saisie principal) :

- objets concernés (processus, missions, documents…) ;
- classifications, mesures, règles de conservation ;
- éléments non qualifiés / points d’attention ;
- indicateurs synthétiques.

**Rapport / extraction LPD (terme) :**  
`réflexion légère → données structurées → consolidation → rapport` paramétrable (unité, période, processus…). Remplace le document manuel parallèle. Mêmes permissions que les fiches sources.

**Versioning :** historiser les champs LPD structurants via `HistoriqueModification` (évolution classification / réflexion dans le temps). Conservation / purge des historiques paramétrables — propriétaire naturel de ce chantier.

**Ne pas développer maintenant** un gros module LPD ; rester compatible (pas de silo, pas de double saisie).

### 5ter-ter. Modèles de tâches

**Socle livré :** `ModeleTache` (MDL-xxxx) + `ModeleTacheEtape` + relation N–N `ModeleTacheProcessus` ; copie → `TacheChecklistItem` à la création ; `Tache.modeleTacheId` informatif (pas de sync rétroactive). Distinct de la checklist Mission.

**UX checklist d’occurrence :** cocher/décocher en consultation ; renommer / ajouter / supprimer / réordonner uniquement en mode Modifier de la box Checklist.

**CRUD minimal** modèles (box-by-box), création de tâche depuis modèle, affichage des modèles liés sur la fiche Processus.

**Fiche modèle :** définition (infos, checklist, paramètres, processus) + box **Suivi des tâches** (occurrences via `modeleTacheId`, progression checklist, lien vers fiche Tâche) — lecture/pilotage, pas de sync modèle ↔ occurrences.

**Roadmap :** Éditeur complet (key user), rôles métier complexes, unités autorisées avancées, fonctions avancées.

### 5quater. Export Excel (roadmap)

Fonctionnalité transversale : export Excel des inventaires (Projets, Conseils, Missions d'assurance, Risques, Contrôles SCI, Documents, Processus). Si des filtres sont actifs, pouvoir exporter la **vue filtrée** (ex. risques résiduels élevés affichés).

### 5quinquies. Processus

Référentiel volontairement simple : **Processus = quoi** ; **procédure = comment** (Confluence).

Champs principaux : code PRC-xxxx, nom, description courte, unité, responsable, statut, lien Confluence, **étapes ordonnées** (ajouter / renommer / supprimer / réordonner — pas de BPMN), éléments associés.

Associations libres via `LienObjet` (y compris vers une **étape** précise, facultatif). Chaîne cible : **Unité → Processus → Risques → Contrôles SCI → Occurrences**.

### 5quinquies-bis. Édition box-by-box & brouillons (transversal)

Trois règles UX : (1) toute grande box est repliable ; (2) lecture seule stricte par défaut ; (3) édition indépendante par box, avec **Enregistrer comme brouillon / Finaliser / Annuler** lorsque pertinent.

Modèle `SectionRedaction` : état de **rédaction** (`BROUILLON` | `FINALISE` | …) distinct du **statut métier**. Pour les Missions, s’articule avec `MissionValidationPoint` / visas (`Brouillon → À valider → Validé`, invalidation via `contenuVersion`) — un seul fil de versioning, pas deux systèmes concurrents.

### 5quinquies-ter. Projets — sans jalons

Suivi opérationnel : **Projet → Tâches** uniquement. La notion de Jalon a été retirée (redondante). Une seule section **Éléments associés** (tâches, documents, risques, processus, missions, conseils…) avec filtre par type.

### 5sexies. Fiche Unité

Distinguer :

- **Administration** (`/administration/*`) — paramétrage utilisateurs / unités / rôles (v1 livré) ;
- **Fiche métier Unité** (`/unite`, unité courante) : identité (UNT-xxxx), pilotage synthétique (compteurs), **Objectifs** (OBJ-xxxx), équipe, processus, éléments associés — pas de listes d’activité (réservées aux modules / Dashboards).

**Objectifs d’unité** ≠ `ObjectifAnnuel` (individuel) ≠ `ObjectifModule` (KPI module). Liens libres via `LienObjet`. Pas d’OKR / scoring auto dans cette version. Détail et risque de doublon : [`docs/OBJECTIFS.md`](./docs/OBJECTIFS.md).

Cette vue **agrège** les informations déjà présentes — pas de double saisie. CTAs vers les moteurs existants. Dashboard responsable pourra lire les Objectifs plus tard (agrégateur lecture seule).

### 5septies. Administration & permissions (v1)

Espace distinct du travail quotidien, visible uniquement pour le rôle **Administrateur**.

| Sous-module | Statut | Contenu |
|-------------|--------|---------|
| Utilisateurs | **Implémenté** | prénom, nom, initiales, fonction, unité, rôle, actif |
| Unités | **Implémenté** | code, nom, description, responsable, adjoint, actif (≠ `/unite`) |
| Rôles | **Implémenté** (lecture) | Collaborateur · Responsable d’unité · Administrateur |

Permissions : deny-by-default pour Administration (`src/lib/permissions.ts`). Scope Unité conservé. Adjoint = propriété d’Unité, pas un rôle global. Rôles Mission (mandat, auditeur…) restent séparés.

**Roadmap :** AD / Entra ID, SSO, groupes, multi-unités avancées, permissions fines, restrictions LPD, Éditeur key user (inventaire dans `docs/EDITEUR_PREPARATION.md`).

Voir aussi le bilan de sprint : [`docs/SPRINT_CONSOLIDATION.md`](./docs/SPRINT_CONSOLIDATION.md).

### 5septies-bis. Missions — dossier d’audit (roadmap structurante)

Voir [`docs/MISSIONS_ARCHITECTURE.md`](./docs/MISSIONS_ARCHITECTURE.md).

- Familles UX **Audits** / **Revues de processus** (un moteur, vues filtrées — amorcé `?famille=`).
- Cockpit + **cinq pages d’étapes** (Planification → Substantif → Recommandations → Rapport → Suivi).
- Progression explicable (états de rédaction + recos), pas un % arbitraire.
- **Draft de rapport** généré depuis les étapes (roadmap — pas maintenant).
- **PV / notes d’entretien** (`MissionNote`) + IA « mettre au propre » sans écraser les notes brutes (roadmap).

### 5septies-ter. Projets — planification séquentielle (roadmap)

Voir [`docs/PROJET_TACHES_DEPENDANCES.md`](./docs/PROJET_TACHES_DEPENDANCES.md).

Socle livré : plages dates, charge jours, commentaire, box Tâches unique, priorité masquée en contexte Projet.  
Dépendances / activation progressive : modèle `TacheDependance` **implémenté** (badge « En attente du prérequis » sur fiche Projet ; exclusion Dashboard / inventaire par défaut ; `?planifiees=1`).

### 5septies-quater. Risques — réévaluation

Voir [`docs/RISQUE_REEVALUATION.md`](./docs/RISQUE_REEVALUATION.md).  
Acte métier `RisqueReevaluation` **implémenté** (distinct de l’historique de champs ; traçable même sans changement de notes).

### 5octies. Versioning / historique (chantier structurant)

Distinguer **Journal d’activité** (événements) et **Historique de contenu** (diffs de champs).  
Architecture et décisions : [`docs/VERSIONING.md`](./docs/VERSIONING.md).

**Pilote Risques (livré) :** modèle `HistoriqueModification`, helper `enregistrerModifications`, `Risque.contenuVersion`, UI Historique + Journal.  
Pas de snapshot JSON ni de purge auto en Phase 1 ; conservation paramétrable plus tard (Protection des données).  
Étapes suivantes : autres modules, puis invalidation des visas (`versionVisee` < `contenuVersion`).

### 5nonies. Touche humaine / fun (roadmap légère)

Question hebdomadaire optionnelle (ex. « Chiens ou chats ? ») — purement conviviale, non prioritaire, sans alourdir la plateforme.

### 6. Indicateurs par module

Indicateurs de progression (pas de gamification). Exemples :

| Module | Exemples d’indicateurs |
|--------|------------------------|
| Pilotage | Vue synthétique de l’unité |
| Conseils | Reçues, clôturées, temps moyen, respect délai cible (5 j. ouvrés), en attente |
| Projets | Actifs, terminés, respect échéances, en retard, avancement global, tâches ouvertes |
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
