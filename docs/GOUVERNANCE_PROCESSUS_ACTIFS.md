# Décisions d’architecture — Processus centre de gravité (sprint)

## Préfixe Actifs IT : `AIT-xxxx` (pas `APP-xxxx`)

Plus générique : le type (`APPLICATION` / `SYSTEME` / `INFRASTRUCTURE` / `SERVICE` / `AUTRE`) distingue la nature. Évite de renommer si le référentiel élargit au-delà des applications.

## RACI

- Modèles : `ProcessusRaciLigne` + `ProcessusRaciParticipant`
- Personnes = `Utilisateur` (pas de ressaisie)
- Champ réservé `libelleFonction` pour une future responsabilité par fonction/rôle — non exposé en UI
- Facultatif : init depuis étapes possible

## Actifs IT

- Référentiel autonome (intérêt de la vue inverse « processus impactés »)
- Relation N–N `ProcessusActifIT`
- MVP champs : code, nom, type, description, responsable, statut, fournisseur?, hébergement?

## Aide à l’évaluation

- Niveau 1 déterministe : `src/lib/risque-evaluation-aide.ts` + UI `RisqueEvaluationAide`
- Justification persistée sur `Risque.justificationEvaluation`
- Réévaluation : affiche justification précédente ; enregistre nouvelle justification + commentaire d’acte
- Niveau 2 IA : Roadmap — via abstraction `AIProvider` (LOCAL | EXTERNAL_API | DISABLED)

## Continuité

Voir `ARCHITECTURE_CONTINUITE.md` — **à valider avant code**.

## Non développé (Roadmap)

Vue Continuité consolidée, scénarios/exercices BCM, DR, dépendances fournisseurs avancées, InfoSec avancée, CMDB, IA évaluation, IA locale, rapports BCM.
