# Journal d’architecture — GRC Pilotage

Mémoire concise des **décisions d’architecture** prises vague par vague.  
Pas un inventaire exhaustif : uniquement ce qui compte pour maintenir et faire évoluer le produit.

**Documents liés :** [ARCHITECTURE.md](./ARCHITECTURE.md) (règles stables) · [ROADMAP.md](./ROADMAP.md) (vision produit)

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
