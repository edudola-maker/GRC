# Architecture — Continuité des activités (à valider avant implémentation lourde)

> Proposition pour validation. **Pas de moteur BCM autonome.**  
> Principe : *réflexion au bon endroit → données structurées → consolidation → pilotage*.

## 1. Philosophie

| Couche | Où | Rôle |
|--------|-----|------|
| **Analyse** | Fiche Processus — section « Continuité des activités » | Saisie légère, structurée |
| **Dépendances** | Actifs IT (référentiel) + futures dépendances | Sources de vérité |
| **Pilotage** | Vue consolidée « Continuité » (Roadmap) | Inventaire / filtres / alertes |

Terminologie produit : **Continuité des activités** (pas « Operational Resilience »).

## 2. Modèle proposé — `ProcessusContinuité` (1–1 avec Processus)

Un enregistrement optionnel par Processus (pas d’obligation).

| Champ | Type | Commentaire |
|-------|------|-------------|
| `criticiteContinuité` | enum Faible / Modéré / Important / Critique | ≠ criticité Risque 5×5 |
| `consequencesInterruption` | texte | Conséquences principales |
| `mtpd` | string ou Int (heures) | Durée max d’interruption acceptable |
| `rto` | string ou Int (heures) | Objectif de reprise |
| `rpo` | string ou Int (heures)? | Si pertinent (données) |
| `periodesCritiques` | texte? | Ex. clôture, pics saisonniers |
| `modeDegrade` | texte? | Solution alternative |
| `mesuresContinuité` | texte? | Mesures en place |
| `commentaire` | texte? | Justification / notes |
| `dateDerniereRevue` | date? | |
| `dateProchaineRevue` | date? | |
| `modifieParId` / `modifieLe` | audit | |

**Hors MVP (Roadmap)** : scénarios, exercices, plans détaillés, DR, questionnaires 40 champs.

### Pourquoi un modèle 1–1 plutôt que des champs sur `Processus` ?

- La majorité des Processus n’auront pas (encore) d’analyse → pas de pollution du modèle cœur.
- Permet d’évoluer (versions, visas) sans alourdir `Processus`.
- Aligné LPD : réflexion optionnelle structurée.

## 3. Dépendances

### 3.1 Actifs IT (livré dans ce sprint)

`ProcessusActifIT` N–N — déjà une dépendance critique IT.

### 3.2 Processus → Processus (à valider)

```
ProcessusDependance
  processusId      // successeur / dépendant
  dependDeId       // prérequis / amont
  nature?          // BLOQUANT | UTILE | INFORMATION
  commentaire?
  @@unique([processusId, dependDeId])
```

Usage continuité : « A est disponible mais inutilisable si B est interrompu ».

### 3.3 Personnes / fonctions & Prestataires (conceptuel)

Ne pas implémenter maintenant. Architecture cible :

```
ProcessusDependanceCritique
  processusId
  type   // PERSONNE | FONCTION | PRESTATAIRE | AUTRE
  utilisateurId?   // si PERSONNE
  libelle          // fonction / prestataire / description
  criticite?
  commentaire?
```

Évite de refondre le modèle plus tard ; une seule table polymorphique légère.

## 4. Vue transversale « Continuité des activités » (Roadmap)

Pas un second référentiel : **lecture consolidée** des `ProcessusContinuité` + jointures.

Colonnes cibles : Processus | Unité | Criticité | MTPD | RTO | Actifs critiques | Mode dégradé | Dernière revue | Prochaine revue

Filtres utiles : critiques ; analyses manquantes ; revues échues ; critiques sans mode dégradé ; RTO courts.

Navigation Gouvernance : entrée « Continuité des activités » **après** stabilisation du modèle Processus.

## 5. Décisions à trancher

1. MTPD / RTO / RPO : unités (heures vs jours) et saisie libre vs liste fermée ?
2. Criticité continuité : échelle 4 niveaux proposée OK ?
3. Dépendance Processus↔Processus : orientation graphe simple (liste) d’abord, pas de diagramme ?
4. Moment d’activation de la vue consolidée : après N Processus documentés ?

## 6. Ce qui n’est **pas** développé dans ce sprint

Implémentation `ProcessusContinuité`, dépendances Processus↔Processus, vue consolidée, BCM avancé — **architecture documentée uniquement**.
