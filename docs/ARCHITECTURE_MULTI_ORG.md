# Architecture — Multi-Organisations & Modularité

**Décision : PR 3 (Multi-org / modules) AVANT PR 1–2.**

Sans Organisation, chaque nouveau modèle (Axes, vues Tâches, etc.) devrait être
re-migré ensuite. Poser le tenant maintenant minimise la dette.

## État actuel (post B–F)

- Périmètre données = **`Unite`** (`uniteId` partout, ~120+ usages schéma).
- Session démo = cookie user → `user.uniteId`.
- Pas d’`Organisation` / tenant.
- Modules = navigation fixe (pas d’activation).
- UCAE démo = une unité unique avec dataset GRC riche.

## Approche retenue (SaaS-ready, non-destructrice)

```
INSTANCE
  └── Organisation (tenant)
        ├── modulesActivés (JSON / table)
        ├── Memberships (User ↔ Org + rôle org)
        └── Unité(s)
              └── objets métier (inchangés : uniteId)
```

### Isolation

- **Serveur** : contexte `organisationId` → liste `uniteIds` autorisées.
- Toute requête métier filtre `uniteId ∈ org.uniteIds` (ou `unité.organisationId`).
- Pas de confiance UI seule. Accès URL/ID vérifié.

### Pourquoi pas `organisationId` sur chaque table maintenant ?

1. Migration massive + risque de régression.
2. `Unite` est déjà la frontière opérationnelle (responsable / applicables).
3. Petite PME = 1 Organisation + 1 Unité → transparent UX.
4. Chemin futur : colonne dénormalisée optionnelle si perf SaaS l’exige.

### Membership

```
Utilisateur (identité globale démo)
  └── OrganisationMembership
        organisationId, utilisateurId, roleApplicatif, unitePrincipaleId?
```

Rôle **par Organisation**, pas global unique.

### Modules

`OrganisationModule` ou JSON `modulesJson` sur Organisation :

`taches | planning | projets | strategie | objectifs | processus | risques | controles | conformite | qualite | continuite | actifs | decisions | arbitrages | missions | conseils | documents | fonctions | rapports | guide`

Nav dynamique selon modules.

### Codes métier

Unicité **par Organisation** (via Unité propriétaire ∈ Org).  
Les `SequenceCode` restent par `uniteId` — compatible (1 unité = 1 séquence).

### Migration données

1. Créer Organisation `ORG-UCAE` (défaut).
2. Rattacher Unité(s) existantes.
3. Memberships pour users existants.
4. Seed orgs démo A/B/D séparées.

## Ordre PR

| # | PR | Contenu |
|---|-----|---------|
| **3** | Multi-org / modularité | Organisation, Membership, modules, sélecteur, seed 4 orgs, isolation |
| **1** | Core Tâches | Multi-vues, temporalité, board, inventaires |
| **2** | Stratégie | Mission/Vision/Axes, Objectifs enrichis |
| **4** | Accompagnement | Guide/onboarding/parcours (≠ module Conseils) |
| **5** | Intégration | Stratégie↔GRC, cockpits profils, polish, synthèse |

## Arbitrages (pas de blocage)

- Terme UI : **Organisation** (pas « environnement »).
- SQLite conservé en dev ; Postgres = roadmap SaaS documentée.
- RBAC reste permissif prototype + membership rôle.
- Modules par Unité = architecture future, config **Organisation** d’abord.
