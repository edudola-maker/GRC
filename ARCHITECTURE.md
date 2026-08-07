# Architecture — ancrage de la vision produit

Ce fichier décrit **comment** le code actuel et les prochaines évolutions doivent rester alignés avec [ROADMAP.md](./ROADMAP.md).  
Aucun module futur n’est implémenté ici : uniquement des règles et points d’accroche.

**Décisions prises vague par vague :** [JOURNAL_ARCHITECTURE.md](./JOURNAL_ARCHITECTURE.md) (mémoire du projet — à compléter en fin de chaque vague).

---

## 1. Séparation des objets métier

Chaque domaine a (ou aura) son **propre modèle** et son **propre cycle de vie** :

```text
Projet | Conseil | ControleSCI | Audit* | Document | Risque*
                    │
                    └──► Tâche (action, pas un métier)
```

\* Non créés dans le schéma MVP.

### Règle clé

- **Saisir une fois** au niveau de l’objet métier.
- Les **tâches** matérialisent le travail à faire ; elles pointent vers leur origine quand elles ne sont pas libres.

### Pont actuel → cible

| Aujourd’hui (MVP) | Cible |
|-------------------|--------|
| `Tache.categorie = CONSEIL` | Modèle `Conseil` + tâches générées / liées |
| `Tache.projetId` optionnel | Conservé ; autres origines via liens dédiés |
| `Document` + `ControleDocument` | Inventaire documentaire + revues + autres liens |
| Commentaires « extensions futures » dans Prisma | Modèles `Risque`, `Audit`, `ObjectifAnnuel`, etc. |

Lors de l’extraction de **Conseil**, prévoir une migration des tâches `categorie=CONSEIL` vers le nouvel objet, sans perdre l’historique.

---

## 2. Origine d’une tâche (contrat futur)

Quand on formalisera les créations automatiques, préférer un lien d’origine **explicite et simple**, par exemple :

- `projetId` (déjà là)
- `conseilId` (futur)
- `controleSCIId` (futur)
- `auditId` / `revueDocumentId` (futur)

Éviter un polymorphe unique trop abstrait tant que le produit n’en a pas besoin.  
Des **tables de liaison métier** restent le modèle préféré (déjà retenu pour les preuves SCI).

Option légère déjà prévue : champ `meta` JSON sur Projet/Tâche pour expérimenter sans migration lourde — **pas pour remplacer** les relations stables.

---

## 3. Backlog = vue d’action

Le Backlog agrège les **tâches ouvertes** (toutes origines).

Évolutions prévues sans changer le principe :

- filtres personnels (« mes actions ») ;
- buckets **Aujourd’hui / Cette semaine / Ce mois** ;
- charge approximative par personne ;
- pas de planning horaire.

L’onglet **Tâches** peut rester un CRUD / liste technique tant que le Backlog n’offre pas toute la création/consultation confortable. Décision produit à trancher plus tard : fusionner, recentrer, ou garder les deux avec des rôles clairs.

---

## 4. Chaînes métier cibles

### Risque → Contrôle SCI

```text
Risque (probabilité × impact → criticité)
    └── crée / lie → ControleSCI (réponse au risque)
            └── preuves (Document)
            └── à la validation → prochaine occurrence (selon fréquence)
```

### Document → Revue → Tâche

```text
Document (prochaineRevue)
    └── échéance de revue → Tâche (responsable document)
```

### Conseil → Tâche(s)

```text
Conseil (demande, délai cible 5 j. ouvrés…)
    └── Tâche(s) d’instruction / réponse
            └── Backlog + indicateurs Conseils
```

---

## 5. Indicateurs

Les indicateurs sont des **agrégats calculés** à partir des objets existants (counts, taux, retards, moyennes).  
Pas de table « score gamifié ». Les stocker seulement s’il faut un historique figé ; sinon, calculer à la lecture (comme le Pilotage MVP).

Chaque module exposera plus tard ses propres cartes d’indicateurs ; le **Pilotage** reste la synthèse transverse.

---

## 6. Vue Équipe

Agrégation par `Utilisateur` :

- projets / conseils / tâches / contrôles / audits dont il est responsable ;
- retards + charge approximative ;
- puis `ObjectifAnnuel` relié à l’utilisateur.

Point d’entrée code actuel : `src/lib/equipe.ts` (stub).

---

## 7. Configurabilité

Listes métier (catégories, statuts, etc.) : passer par `src/lib/catalog.ts` aujourd’hui, puis table de configuration plus tard **sans réécrire les écrans**.

Catégories risques prévues : Financier, Opérationnel, Conformité, Cybersécurité, Reporting.

---

## 8. Ce qu’il ne faut pas faire trop tôt

- Boîte de réception / intégration messagerie
- Workflows de validation complexes
- Polymorphisme générique « tout lie tout »
- Gamification
- Refondre le MVP tant que les objets Projet / Tâche / Backlog / Pilotage n’ont pas été validés en usage réel

---

## 9. Stack technique (rappel)

- Next.js App Router + TypeScript
- Prisma + SQLite (migration PostgreSQL possible plus tard)
- Fichiers hors base (`uploads/`) + métadonnées `Document`
