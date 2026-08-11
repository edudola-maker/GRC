# Architecture Missions — Audits / Revues, cockpit, étapes, PV

> Un seul moteur `Mission` + templates. Séparation **fonctionnelle / UX**, pas deux modèles.
>
> **Cockpit / sous-routes :** structure ci-dessous proposée pour validation métier/UX — **pas encore implémentée**.

## 1. Navigation Audits / Revues de processus

**Approche retenue :** route `/missions` avec onglets / query `?famille=audits|revues` (amorcé).

| Famille | Types (`MissionType.code`) |
|---------|----------------------------|
| Audits | `AUDIT_*` (général, ciblé, interne…) |
| Revues de processus | `REVUE_*` (ex. `REVUE_PROCESSUS`) |

- Même inventaire, mêmes templates génériques.
- Pas de duplication de pages CRUD.

## 2. Cockpit (page synthèse)

La page `/missions/[id]` devient un **cockpit** (cible) :

1. Identité / statut / type / code
2. Bandeau de progression des **5 étapes**
3. Liens vers les sous-pages d’étapes
4. Synthèse courte (équipe, prochaines échéances, alertes)

Chaque étape : lecture seule par défaut, édition volontaire (`EditableSection` / `?edit=`).

---

## 3. Les 5 étapes — contenu proposé (à valider)

### Étape 1 — Planification

**Route cible :** `/missions/[id]/planification`  
**Question métier :** *Sommes-nous prêts à démarrer ?*

| Bloc | Contenu structuré |
|------|-------------------|
| Cadre | Objectif, périmètre, dates (début / fin cible), type de mission |
| Équipe | Membres + rôles (responsable, contributeurs, observateurs) |
| Checklist démarrage | Items template (préparation, accès, convocation…) + état fait / non fait |
| Documents d’entrée | Liens / pièces attachées (lettre de mission, cartographie…) |
| Tâches de préparation | Tâches liées à la mission, échéances |
| Validations | Visa / OK pour lancer (états `SectionRedaction`) |

**Critères de progression (exemple) :**

- 0 % : section absente / vide
- 40 % : cadre + dates renseignés
- 60 % : équipe ≥ 1 + checklist initialisée
- 80 % : `A_VALIDER`
- 100 % : `FINALISE` / `VALIDE`

---

### Étape 2 — Substantif (travaux)

**Route cible :** `/missions/[id]/substantif`  
**Question métier :** *Qu’avons-nous observé / analysé ?*

| Bloc | Contenu structuré (pas uniquement free-text) |
|------|-----------------------------------------------|
| Dossiers de travail | Rubriques typées selon template (ex. entretiens, tests, revue documentaire) |
| Constats | Liste d’éléments (titre, gravité/priorité, source, lien risque/contrôle) |
| Périmètre couvert | Processus / unités / échantillon |
| Pièces & preuves | Documents liés à l’étape |
| Notes d’étape | Renvoi futur vers `MissionNote` (Roadmap — pas maintenant) |

**Progression :** basée sur `SectionRedaction.etat` + présence d’au moins un constat / dossier ouvert.  
Pas de % « magique » : états explicites (Non commencé → En cours → En revue → Terminé).

---

### Étape 3 — Recommandations

**Route cible :** `/missions/[id]/recommandations`  
**Question métier :** *Que demandons-nous de corriger / améliorer ?*

| Bloc | Contenu |
|------|---------|
| Liste REC-xxxx | Libellé, priorité, destinataire, échéance cible, statut |
| Lien aux constats | Traçabilité constat → recommandation |
| Synthèse | Nb ouvertes / acceptées / refusées (lecture) |

**Progression :**

- 0 % : aucune reco
- 40 % : brouillons présents
- 80 % : liste finalisée (`A_VALIDER`)
- 100 % : section validée (les recos vivent ensuite dans le Suivi)

---

### Étape 4 — Rapport

**Route cible :** `/missions/[id]/rapport`  
**Question métier :** *Quelle restitution formalisée ?*

| Bloc | Contenu structuré |
|------|-------------------|
| Structure du rapport | Blocs typés : intro, périmètre, synthèse, constats, recos, annexes |
| Statut rédaction | Brouillon / à valider / finalisé |
| Diffusion | Destinataires, date d’émission (quand final) |

**Hors scope immédiat :** génération **draft IA** du rapport (Roadmap uniquement).  
La structure de blocs prépare toutefois cette chaîne sans l’implémenter.

**Progression :** états de rédaction de la section Rapport (`BROUILLON` → `A_VALIDER` → `FINALISE`/`VALIDE`).

---

### Étape 5 — Suivi

**Route cible :** `/missions/[id]/suivi`  
**Question métier :** *Les recommandations avancent-elles ?*

| Bloc | Contenu |
|------|---------|
| Tableau de suivi | Recos : statut, responsable, échéance, dernière MAJ |
| Actions | Tâches liées aux recos |
| Clôture mission | Condition explicite (ex. toutes recos clôturées ou acceptées avec plan) |

**Progression (explicite) :**  
`% = recommandations clôturées / total recommandations`  
Affichage : `Suivi — 3/5 clôturées — 60 %`

---

## 4. Logique de progression entre étapes

### Affichage cockpit

Exemple :

```
1. Planification     — 100 % — Terminé
2. Substantif        —  60 % — En cours
3. Recommandations   —   0 % — Non commencé
4. Rapport           —   0 % — Non commencé
5. Suivi             —   —   — (après émission rapport)
```

### Enchaînement proposé (souple, pas un workflow figé)

| Règle | Proposition |
|-------|-------------|
| Ordre naturel | 1 → 2 → 3 → 4 → 5 |
| Blocage dur ? | **Non** en Phase 1 : on peut ouvrir une étape suivante en brouillon |
| Guidance | Bandeau « étape courante recommandée » = première non terminée |
| Suivi | Activé / mis en avant une fois le Rapport au moins en `A_VALIDER` (ou finalisé) |
| Clôture mission | Possible seulement si Planification + Substantif + Recos + Rapport finalisés **et** règle Suivi satisfaite (paramétrable plus tard) |

Éviter un % global unique trompeur : le cockpit montre **5 jauges**, pas une moyenne opaque.

### Mapping états rédaction → libellés

| `SectionRedaction.etat` | Affichage | Ordre de grandeur |
|-------------------------|-----------|-------------------|
| Absent / vide | Non commencé | 0 % |
| `BROUILLON` avec contenu | En cours | 40–60 % |
| `A_VALIDER` | En revue | 80 % |
| `FINALISE` / `VALIDE` | Terminé | 100 % |

---

## 5. Draft de rapport + IA notes (Roadmap — pas d’implémentation)

- Chaîne draft : données structurées des étapes → génération.
- `MissionNote` + IA « mettre au propre » sans écraser les notes brutes.

Voir Roadmap §5septies-bis.

## 6. Code Mission modifiable

Livré : édition du code (`MIS-nnnn`), unicité unité, format, historisation via `HistoriqueModification` + `contenuVersion`.
