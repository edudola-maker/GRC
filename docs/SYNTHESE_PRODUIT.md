# Synthèse produit — Pilotage / Gouvernance modulaire

*Livrable consolidé après PR 3 → 1 → 2 → 4 → 5.*

## A. Produit

### Fonctionnalités développées
- **Multi-Organisations** : tenant, memberships, modules activables, sélecteur démo
- **Tâches multi-vues** : Liste / Tableau / Calendrier ; temporalité ; vues perso
- **Stratégie** : Mission, Vision, Axes, Objectifs (indicateur / cible / axe)
- **Guide** : diagnostic, parcours, bonnes pratiques (≠ module Conseils)
- **Cockpit attention** : bandeau profil-aware (PME vs GRC)
- **GRC native** : Processus, Risques, Contrôles, Conformité, Qualité, Continuité, Décisions / Arbitrages (existant enrichi)

### UX
- Vocabulaire accessible ; modules masquent la nav sans supprimer les données
- Filtre ≠ regroupement (Tâches)
- Planification ≠ échéance (calendrier)
- Feedback « Annuler » après drag

### Modules
Presets : PME_SIMPLE · PME_STRUCTUREE · GRC_TRANSVERSE · FINANCE_CONTROLE  
Admin → Modules activés.

## B. Architecture

```
INSTANCE → Organisation → Unité(s) → objets (uniteId)
User → OrganisationMembership (rôle par org)
OrganisationModule (activation)
```

- Isolation serveur : `getOrgContext` / `whereOrgUnites` / override `uniteId` session
- Prisma SQLite (dev) ; Postgres = roadmap SaaS (pas de migration « par principe »)
- `AI_PROVIDER` : DISABLED | LOCAL | EXTERNAL (stub)

## C. Tests

| Scénario | Résultat |
|----------|----------|
| Petite PME | Seed + modules allégés + tâches/projets/objectifs |
| PME structurée | Core + risques/contrôles |
| UCAE / GRC | Dataset riche + missions/conseils |
| Finance | Projets + risques + contrôles |
| Cross-tenant | `npm run test:tenant` |
| Temporalité | `npm run test:taches` |
| Build | `npm run build` |

## D. Dette

### Technique
- Pas encore `organisationId` dénormalisé sur chaque table (isolation via Unité)
- Vues Tâches perso = localStorage (partage = futur)
- FK SQLite `Objectif.axeStrategiqueId` sans contrainte DB stricte
- Inventaires hors Tâches encore souvent filtrés sur `user.uniteId` (OK via override session)

### UX
- Calendrier Tâches : resize durée limité ; mobile = liste jours
- Cockpit transverse : widgets contrôles/validations encore partiels
- RACI « Qui fait quoi » simplifié PME = à peaufiner

### Métier / partiel
- Progression Objectif AUTOMATIQUE = mode présent, calculs liens incomplets
- Stratégie ↔ Risques : question métier posée, pas de wizard dédié
- LPD : parcours examen, pas de registre traitements complet
- Intégrations KPI EXTERNAL / API = architecture conceptuelle seule

## E. Suite

1. Intégrations KPI (MANUAL → IMPORT → API)
2. IA contextualisée (provider branché, toujours propose/valide)
3. SaaS : Postgres, auth réelle, quotas
4. LPD avancée / registre
5. Modules par Unité (matrice) si besoin
6. Déploiement / hébergement interne

## F. Démo

1. Lancer l’app (`npm run dev` ou build + start)
2. Connexion démo : **Dominique Admin** ou **Alice Martin** (memberships multi-org)
3. Sélecteur **Organisation** (sidebar) :
   - Petite PME
   - PME structurée
   - UCAE
   - Finance
4. Vérifier : nav modules, données, `/strategie`, `/taches` (vues), `/guide`

*Ne jamais mélanger les données entre Organisations — isolation serveur.*
