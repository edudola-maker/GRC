# Synthèse Roadmap B → F

Consolidation des livraisons **PR B à PR F** (pilotage UX → adoption / intelligence métier).  
PR G non démarrée.

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
| **Architecture** | Libs déterministes (`recherche-globale`, `a-faire-maintenant`, `processus-couverture`, `risque-evaluation-aide` V2) — **pas d’IA** |
| **UX** | Nav Découvrir + Recherche ; Cmd/Ctrl+K ; badges couverture ; empty guidés |
| **Tests** | `tsc` + `next build` |
| **Dette** | Recherche non indexée ; questionnaires locaux ; couverture = présence |
| **Arbitrages** | Humain retient toujours P/I ; pas de score maturité |

---

## ÉTAT DU PRODUIT (fin PR F)

### Mature / utilisable en démo
- Dashboards collaborateur & responsable (actions, planning)
- Projets + étapes pondérées + tâches
- Missions d’assurance (cockpit / étapes)
- Processus (arborescence, inventaire, RACI, continuité, qualité)
- Risques (matrice, évaluation aidée, réévaluations, contrôles)
- Contrôles SCI, Documents (inventaire / revues)
- Conseils
- Fonctions / admin utilisateurs & unités
- Gouvernance EXI / ARB / DEC
- Objectifs d’unité
- Rapports & exports CSV/PDF print
- Guide d’adoption + recherche + recommandations légères

### Prototype / partiel
- RBAC (modèle + UI admin, enforcement off par défaut)
- Objectifs : progression déclarative
- Recherche : filtre mémoire, pas FTS
- Couverture processus : indicateurs de présence
- RiskQuant : Niveau 1 déterministe (Niveau 2 IA non fait)

### Dettes techniques notables
- Enforcement RBAC pages
- PDF serveur / exports CSV étendus
- Versioning / visas : socle partiel selon modules
- `utilisateur.fonction` string legacy
- Inventaires gouvernance encore simples (peu de filtres avancés)

### Risques produit
- Adoption : courbe d’apprentissage GRC — mitigée par `/decouvrir`
- Confusion planification vs échéance — documentée, UX à surveiller
- Fausse confiance « couverture ✓ » ≠ maturité réelle

### Non développé (hors B–F)
- IA / RAG métier opérationnel
- Moteur de délégation / absences
- Audits formels (objet Audit dédié)
- GED / stockage fichier avancé
- Multi-tenant avancé / droits croisés unités
- Notifications push / calendrier externe
- Mobile app native

### Next roadmap (piste PR G+)
- Endurcissement RBAC (`RBAC_ENFORCE`)
- Notifications & rappels d’échéances
- FTS / recherche plus riche
- Exports & PDF serveur si besoin métier
- Maturité / campagnes de revue (sans confondre avec couverture)
- Intégrations (SSO, Confluence bidirectionnelle)
