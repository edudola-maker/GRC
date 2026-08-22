# Synthèse Roadmap B → F

Consolidation des livraisons **PR B à PR F** (pilotage UX → adoption / intelligence métier).  
**STOP — PR G non démarrée.**

## Pull requests

| PR | Branche | GitHub |
|----|---------|--------|
| B | `cursor/sprint-pilotage-visuel-72a6` | [#21](https://github.com/edudola-maker/GRC/pull/21) |
| C | `cursor/organisation-fonctions-rbac-72a6` | [#22](https://github.com/edudola-maker/GRC/pull/22) |
| D | `cursor/gouvernance-qualite-conformite-72a6` | [#23](https://github.com/edudola-maker/GRC/pull/23) |
| E | `cursor/rapports-exports-72a6` | [#24](https://github.com/edudola-maker/GRC/pull/24) |
| F | `cursor/adoption-intelligence-metier-72a6` | [#25](https://github.com/edudola-maker/GRC/pull/25) |

---

## PR B — Pilotage / UX

| | |
|--|--|
| **Features** | Planification ≠ échéance (`dateFinPlanifiee`) ; calendrier drag/resize ; horizons responsable ; sidebar repliable ; Split View Processus |
| **Migrations** | `20260822160000_planification_vs_echeance` |
| **Architecture** | Séparation deadline métier / plage planifiée sur Projet & Tâche |
| **UX** | Desktop = drag ; mobile = liste ; undo 1 niveau |
| **Tests** | Build / parcours manuels planning |
| **Dette** | Conseils/SCI bandes non éditables ; vue Année = 26×13 sem. |
| **Arbitrages** | Pas de timesheet ; charge en jours |

---

## PR C — Organisation / Fonctions / RBAC

| | |
|--|--|
| **Features** | Référentiel Fonctions FCT ; titulaires/suppléants ; RACI privilégie Fonction ; fiche collaborateur ; RBAC + mode permissif |
| **Migrations** | `20260822170000_fonctions_rbac` |
| **Architecture** | Fonction ≠ rôle applicatif ; `PermissionException` |
| **UX** | Inventaire `/fonctions` ; admin rôles |
| **Tests** | Seed FCT ; pages CRUD |
| **Dette** | Enforcement RBAC non branché (`RBAC_ENFORCE≠1`) |
| **Arbitrages** | Suppléance = modèle, pas moteur de délégation |

---

## PR D — Gouvernance (qualité / conformité)

| | |
|--|--|
| **Features** | Exigences, Arbitrages, Décisions ; Qualité processus (revue + écarts) ; Objectifs SMART + attributions |
| **Migrations** | `20260822180000_gouvernance_qualite_conformite` |
| **Architecture** | EXI / ARB / DEC liés processus ; `ProcessusQualite` |
| **UX** | Nav Gouvernance enrichie ; panneaux sur fiche Processus |
| **Tests** | Seed EXI/ARB/DEC |
| **Dette** | Listes simples ; progression auto Objectif non calculée |
| **Arbitrages** | Lien Exigence↔Contrôle/Document schéma prêt, UI partielle |

---

## PR E — Rapports / Exports

| | |
|--|--|
| **Features** | Hub `/rapports` ; CSV Excel (risques, arbitrages) ; PDF print (processus, responsable, risques, gouvernance) |
| **Migrations** | N/A |
| **Architecture** | `lib/exports/*` ; auth unité ; sections processus query-string |
| **UX** | Liens Exporter depuis fiches / dashboard |
| **Tests** | Build routes API + pages print |
| **Dette** | PDF = navigateur ; pas de CSV processus/décisions |
| **Arbitrages** | Pas de moteur PDF serveur |

---

## PR F — Adoption / Intelligence métier

| | |
|--|--|
| **Features** | Guide `/decouvrir` ; RiskQuant V2 ; Recherche globale ; À faire maintenant ; Couverture Processus ; empty states |
| **Migrations** | N/A |
| **Architecture** | Libs déterministes — **pas d’IA** |
| **UX** | Nav Découvrir + Recherche ; Cmd/Ctrl+K ; badges couverture |
| **Tests** | `tsc` + `next build` |
| **Dette** | Recherche non indexée ; couverture = présence |
| **Arbitrages** | Humain retient toujours P/I ; pas de score maturité |

---

## ÉTAT DU PRODUIT (fin PR F)

### Mature / utilisable en démo
- Structure Unité → Macroprocessus → Processus
- Pilotage collab / responsable avec planification éditable
- Projets à étapes pondérées + sliders
- Fonctions / RACI / seed riche
- Exports essentiels + guide d’adoption

### Prototype
- RBAC (matrice prête, non appliquée)
- Qualité / Conformité / Arbitrages / Décisions (CRUD léger)
- PDF via impression navigateur
- Recherche globale simple

### Dettes
- Technique : enforcement RBAC ; PDF serveur ; index recherche
- UX : `docs/AUDIT_UX_FINAL.md`
- Métier : LPD complète, IA, CMDB — hors périmètre

### Roadmap recommandée suivante
1. Activer RBAC progressivement
2. Qualité / Conformité en profondeur
3. PDF serveur + exports étendus
4. Registre traitements LPD
5. IA locale sur données structurées

Voir aussi : `docs/AUDIT_ARCHITECTURE_FINAL.md`, `docs/AUDIT_UX_FINAL.md`.
