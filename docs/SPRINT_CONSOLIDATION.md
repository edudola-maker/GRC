# Sprint consolidation — Organisation, Administration, transverse

## Statut par lot

| Lot | Statut | Commentaire |
|-----|--------|-------------|
| P1 Données / merge Unité + Modèles suivi | **Implémenté** | Branche unique de consolidation |
| P2 Modèles + checklists + suivi occurrences | **Implémenté** | Snapshot ; box Suivi ; cocher en lecture |
| P3 Unité / Objectifs | **Implémenté** | `/unite` sans Activité ; OBJ-xxxx + LienObjet |
| P4 Processus | **Implémenté** | Étapes CRUD/reorder (déjà Vague C) |
| P5 UX box-by-box | **Partiellement** | Complet : Processus, Projets, Modèles, Unité, Objectifs, Missions (sections), Tâche checklist. Liens associés en Modifier : Missions, Conseils, Risques, Documents, Contrôles. **Reste** : infos Conseils/Risques/Documents/Contrôles encore via page `/modifier` globale |
| P6 Administration | **Implémenté** | Utilisateurs, Unités, Rôles ; rôle `ADMINISTRATEUR` ; deny by default |
| P7 Nav / hygiene | **Implémenté** | Admin réservé ; jalons CSS retirés ; docs |

## Migrations

1. `20260808223000_modele_tache` — ModeleTache / checklist occurrence  
2. `20260808230000_unite_objectif` — Unite enrichie + Objectif + UNT  
3. `20260809120000_admin_roles_utilisateur` — `ADMINISTRATEUR`, `prenom`, `fonction`

## Décisions d’architecture

- Trois notions d’objectifs distinctes : `Objectif` (stratégique unité), `ObjectifAnnuel` (individu), `ObjectifModule` (KPI).
- Admin ≠ fiche métier `/unite`.
- Rôles app : Collaborateur / Responsable / Administrateur ≠ rôles Mission.
- Checklist tâche = snapshot ; cocher = opérationnel sans Modifier.
- Permissions centralisées (`src/lib/permissions.ts`) — base pour AD/SSO futur.
- Agent IA : non développé ; données déjà transverses via Prisma + LienObjet + scope unité.

## Décisions métier en attente (ne pas improvisar)

1. **Scinder `Utilisateur.nom` en prénom/nom obligatoires** vs garder `nom` libre + `prenom` optionnel (choix actuel : prenom optionnel).
2. **Renommage routes `/audits` → `/missions`** — impact bookmarks / seed / docs.
3. **Migration complète des fiches Conseils/Risques/Documents/Contrôles** vers EditableSection (abandon des pages `/modifier`) — lot UX dédié.
4. **Fusion ou conservation de `/equipe`** (aujourd’hui redirect).

## Préparation IA (rappel)

L’agent futur devra respecter le même scope `uniteId` + rôle que l’utilisateur ; proposer des brouillons (`SectionRedaction`) sans contourner les validations.
