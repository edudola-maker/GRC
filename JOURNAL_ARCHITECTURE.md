# Journal d’architecture — GRC Pilotage

Mémoire concise des **décisions d’architecture** prises vague par vague.  
Pas un inventaire exhaustif : uniquement ce qui compte pour maintenir et faire évoluer le produit.

**Documents liés :** [ARCHITECTURE.md](./ARCHITECTURE.md) (règles stables) · [ROADMAP.md](./ROADMAP.md) (vision produit)

---

## Sprint 2 — Vague C (planification + multi-unités + objectifs modules)

**Branche / PR :** `cursor/sprint2-vague-c-planification-72a6`  
**Contexte :** Vague B validée ; calendrier, Unité, ObjectifModule, préparation Administration.

### Décisions principales

| Décision | Choix retenu |
|----------|----------------|
| Planification | Vue simple à plages colorées (16 semaines) lue depuis les dates métier — pas de table Planning dédiée |
| Multi-unités | Modèle `Unite` + `uniteId` sur Utilisateur, objets métier, Tâche, ObjectifAnnuel, SequenceCode, Journal |
| Codes | Unicité **par unité** (`@@unique([uniteId, code])`) ; séquences par unité |
| Objectifs modules | `ObjectifModule` (cible par module/année/indicateur) ; dashboard responsable = **agrégateur lecture seule** |
| Objectifs collaborateurs | `ObjectifAnnuel` conservé (personnel) — distinct des objectifs module |
| Référentiels | `ReferentielValeur` (taxinomies) + `ParametreFonctionnel` (ex. délai conseil) par unité |
| Administration | **Non développée** ; modèle prêt (unités, collaborateurs, rôles, taxinomies, paramètres, objectifs) |
| Périmètre données | Listes / KPI / monitoring filtrés par `uniteId` de l’utilisateur courant (pas encore de droits croisés) |

### Pourquoi ces choix

- **Pas de table Planning** : une seule saisie (dates sur Projet/Audit/Conseil/…) ; le calendrier n’est qu’une vue.
- **Unité dès maintenant** : éviter un refactor massif plus tard ; les permissions viendront ensuite.
- **ObjectifModule vs ObjectifAnnuel** : sépare KPI d’unité (modules) et objectifs individuels.
- **Référentiels en base** : l’Administration pourra éditer sans redeployer du code ; `catalog.ts` reste filet de secours pour les enums structurels.

### Impacts futurs

- Tout create/list doit porter ou filtrer `uniteId`.
- L’Administration gérera `Unite`, `ReferentielValeur`, `ParametreFonctionnel`, `ObjectifModule`, utilisateurs/rôles.
- Les droits d’accès s’appuieront sur `uniteId` (+ rôle) sans changer le modèle de données de fond.
- Les modules pourront enrichir leurs indicateurs (`indicateurCle`) consommés par le dashboard.

### Alternatives écartées

| Alternative | Pourquoi écartée |
|-------------|------------------|
| Calendrier horaire / sync Outlook | Hors vision « high level » |
| Table Planning séparée | Double saisie |
| Droits multi-unités dès maintenant | Demandé explicitement plus tard |
| Objectifs uniquement dans le dashboard | Contredit « chaque module définit ses objectifs » |
| Hardcoder taxinomies/délais en permanence | Bloquerait Administration |

### Inventaire Conseils (ajustement Vague C)

- Pattern **InventoryBrowser** : filtres rapides + recherche dynamique (`useDeferredValue`) + recherche avancée, sans rechargement.

### Design system modules (revue Vague C)

Architecture de page **commune** à Conseils, Projets, Audits, Risques, Contrôles SCI, Documents :

1. Titre / description  
2. **Zone KPI** (`KpiZone`) — fond distinct sobre  
3. **Attention requise** (`AttentionZone`) — si éléments à traiter  
4. **Filtres / recherche** (`InventoryBrowser` zone tools)  
5. **Inventaire** type tableau moderne (`InventoryList` + `InventoryRow`)  
6. Fiche détaillée (inchangée)

**Inventaire :** double en-tête de colonnes (ligne principale + ligne secondaire) une seule fois ; chaque élément reprend la même grille sans répéter les intitulés. Fond de ligne **neutre** ; **badge coloré** uniquement sur le statut.

**Filtres :** logique pure dans `inventory-filters.ts` (testable) ; pastilles « filtres actifs » + réinitialisation globale ; critères combinables sans rechargement.

**Fiches — consultation / modification :** par défaut consultation ; infos structurantes et `LienObjet` éditables uniquement sur la page Modifier (prépare droits, versioning, validation quatre yeux).

**Navigation :** barre latérale structurée (Dashboards / Métier / Gouvernance / Administration à venir) ; rétractabilité envisagée plus tard.

**Runtime démo :** préférer `next start` (prod) plutôt que `next dev` Turbopack — en environnement cloud, les scripts `crossorigin` de Turbopack peuvent recevoir un 403 (header `Origin`) et bloquer l’hydratation React (filtres inertes).

**Risques :** matrice filtrable (catégorie, inhérent/résiduel) ; champs résiduels en base ; visualisation d’évolution inhérent→résiduel = roadmap.

**Contrôles SCI :** statut de *définition* `ACTIF` | `SUSPENDU` (+ archive) ; exécution = tâches/occurrences ; pas de « Marquer réalisé » ni de box Preuves sur la définition (preuves → occurrence). Table `ControleDocument` conservée pour migration ultérieure vers preuves de tâche.

**Processus :** objet `Processus` (PRC-xxxx) ; associations via `LienObjet` uniquement (pas de M2M dédiées) ; `parentId` pour hiérarchie future ; doc détaillée → Confluence. Nav Gouvernance : Processus → Risques → Contrôles → Documents.

**Taxinomie :** retirée de l’UI (le besoin réel = **code unique** stable). Colonne DB encore présente mais non exposée ; catégories / tags pour le classement métier.

**Formulaires :** blocs thématiques `FormSection` (un seul Enregistrer). **Toutes les grandes box** (fiches, dashboards, inventaires, KPI zone, À traiter, formulaires) passent par le composant transversal `CollapsibleSection` (titre + ▾/▸). Cartographie risques repliée par défaut. Zone « À traiter » sobre (plus de jaune global).

**Missions (nom provisoire) :** objet `Mission` (MIS-xxxx) — moteur **Type → Template → Instance**. Équipe + rôles de mission (`MissionRole`, ≠ rôle app). Initiales utilisateur (affichage). Sections template repliables. Check-lists / validations structurées (contenu progressif). Recos `REC-xxxx` indépendantes de la clôture ; soft-delete mission. Routes `/audits` temporaires. Éditeur templates / versioning visas / dashboard validations = roadmap.

**Relations :** table générique `LienObjet` + section **Éléments associés** (lecture en consultation, édition sur Modifier).

**Principe Objet ↔ Tâche :** objets métier = structure / pilotage ; tâches = exécution opérationnelle.

**Roadmap Unité métier :** fiche agrégée ≠ admin technique — après stabilisation Processus.

Composants partagés : `KpiZone`, `KpiStat`, `AttentionZone`, `InventoryBrowser`, `InventoryList`, `InventoryRow`, `StatusBadge`, `ElementsAssocies`, `RiskMatrix`, `FormSection`, `CollapsibleSection`, `ModuleHelp`.  
Objectif : même logique de navigation d’un module à l’autre, sans personnalisation d’écran.

### Ajustement planification (revue Vague C)

- **Une seule grille** (plus de sections par type).
- Familles calendrier simplifiées : **Projet / Audit / Tâche** (Conseil, SCI, revue doc → Tâche en représentation uniquement).
- En-têtes semaine : `S35` + plage de dates compacte ; navigation ±4 sem. sans borne année civile.
- Trois couleurs seulement, filtres afficher/masquer.

### Préparé pour la suite

1. Module **Administration** (CRUD unités, users, rôles, référentiels, paramètres, objectifs).
2. Matrice de **permissions** (responsable limité à son unité, etc.).
3. Éventuelle vue planification **unité** (tous collaborateurs) côté responsable.
4. Branching des indicateurs module depuis chaque fiche métier (édition locale) + agrégation inchangée.

---

## Sprint 2 — Vague B (modules métier + correctifs dashboards)

**Branche / PR :** `cursor/sprint2-vague-b-metier-72a6` · [#8](https://github.com/edudola-maker/GRC/pull/8)  
**Contexte :** suite à la revue Vague A ; calendrier collaborateur volontairement reporté (étape 6).

### Décisions principales

| Décision | Choix retenu |
|----------|----------------|
| Identifiants métier | Codes stables générés (`PRO/CNS/AUD/RSK/CTL/DOC-0001`) via `SequenceCode` + `nextCode()` |
| Tags / taxinomie | Champs texte simples (`tags` CSV, `taxinomie` catalogue) sur les objets métier |
| Cycle projet | Statuts `IDEE → … → CLOTURE/ABANDONNE` (plus de `A_FAIRE`/`TERMINE` sur Projet) |
| Journal métier | Modèle partagé `JournalEvenement` (démarré sur Conseils) |
| Risques | Stratégie de traitement (`EVITER` / `REDUIRE` / `TRANSFERER` / `ACCEPTER`) sur l’objet Risque |
| Contrôles SCI | `typeControle` + `fenetreDeclenchementJours` : l’action n’apparaît dans « Mes actions » que dans la fenêtre |
| Documents | Inventaire / métadonnées / revues / liens — **pas une GED** ; contenu officiel dans Confluence |
| Aide module | Composant `ModuleHelp` (ⓘ) avec texte de définition par module |
| Dashboards (correctifs A) | Actions terminées → historique ; KPI responsable aérés par thème ; RAG Vert/Jaune/Rouge + filtres |

### Pourquoi ces choix

- **Codes séquentiels** : références stables pour échanges humains et liens futurs, sans UUID visibles.
- **Tags en texte** : suffisant pour retrouver (ex. LSubv) sans table de tags ni UI complexe.
- **Journal partagé** : un seul modèle pour notes/événements, réutilisable (Audits, Projets…) sans multiplier les tables.
- **Fenêtre SCI** : évite de noyer le backlog avec des contrôles lointains ; la planification reste sur l’objet métier.
- **Documents ≠ Confluence** : respecte l’existant documentaire de l’unité ; le module pilote les revues, pas le contenu.
- **RAG simple (échéance)** : signal visuel unique pour l’inventaire responsable, sans moteur de règles par module (pour l’instant).

### Impacts sur les développements futurs

- Tout nouvel objet métier devrait suivre le même socle : `code`, `taxinomie`, `tags`, aide ⓘ, et éventuellement journal.
- Les dashboards doivent **agréger** des indicateurs produits par les modules, pas redéfinir la logique métier.
- Les actions générées (SCI, revue documentaire) doivent respecter la fenêtre de déclenchement avant d’apparaître dans « Mes actions ».
- Le calendrier (Vague C) lira les plages des objets métier (projets, audits, conseils) — pas Outlook.

### Alternatives écartées

| Alternative | Pourquoi écartée |
|-------------|------------------|
| Module « Boîte à idées » séparé | Le statut `IDEE` sur Projet suffit ; moins de navigation |
| Table `Tag` normalisée | Surdimensionné pour le besoin actuel |
| Journal spécifique Conseil uniquement | Moins maintenable que `JournalEvenement` générique |
| Documents comme GED / stockage de fichiers | Doublon avec Confluence ; hors vision produit |
| Calendrier Outlook-like | Contredit l’objectif « high level » ; prévu plus simple à l’étape 6 |
| Polymorphisme lourd pour origines de tâches | Liens explicites (`projetId`, `conseilId`, …) restent préférés |

### Préparé pour les prochains sprints

1. **Vague C / étape 6** — calendrier collaborateur (plages colorées projets / audits / conseils).
2. **Objectifs par module** — proposition à valider : modèle commun `ObjectifModule` (module + année + cible + réalisé), dashboard responsable en **agrégateur lecture seule** (pas de second référentiel dans `/responsable`).
3. **Étendre le journal** aux autres modules si le besoin de notes d’échange se confirme.
4. **RAG métier** — chaque module pourra affiner Vert/Jaune/Rouge (au-delà de la seule échéance) une fois les objectifs module en place.

---

## Sprint 2 — Vague A (rappel, déjà livrée)

**PR :** [#7](https://github.com/edudola-maker/GRC/pull/7)

- Navigation recentrée : Mon tableau de bord, Dashboard responsable (rôle), modules métier.
- Rôles démo `COLLABORATEUR` / `RESPONSABLE` (cookie `grc_demo_user`).
- Backlog / Tâches / Équipe retirés de la nav principale (redirections conservées).

Les correctifs UI issus de la revue Vague A sont consolidés dans l’entrée Vague B ci-dessus.
