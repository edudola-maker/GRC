# PR C — Organisation / Fonctions / Accès

## Livré

- Référentiel **Fonctions** `FCT-xxxx` (unité, description, rôle applicatif associé, périmètre)
- Affectations **titulaire / suppléant** (architecture suppléance, sans moteur de délégation)
- RACI Processus : privilégie Fonction ; Collaborateur en exception ; `libelleFonction` conservé
- Fiche Fonction + inventaire `/fonctions`
- Fiche Collaborateur enrichie (admin utilisateurs) : fonctions, RACI, charge opérationnelle
- RBAC : rôles (+ Lecture seule), matrice permissions, périmètres, `PermissionException`
- **Mode permissif prototype** (`RBAC_ENFORCE≠1` → tout autorisé)

## Migration

`20260822170000_fonctions_rbac`

## Dette

- Enforcement réel RBAC non branché sur les pages (volontaire)
- `utilisateur.fonction` string legacy conservé
- Pas de multi-rôles par Fonction au-delà du champ `roleApplicatif` unique
