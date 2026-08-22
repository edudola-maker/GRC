# PR F — Adoption / Intelligence métier

## Livré

### Guide interactif `/decouvrir`
- Index des parcours + pages `/decouvrir/[slug]`
- Parcours : Créer un Projet, Documenter un Processus, Identifier / Évaluer un Risque, Créer un Contrôle, Revue Qualité, Arbitrage, Décision, Planning, Objectifs, Fonctions/Rôles
- Étapes courtes + CTA vers l’app + mini-questionnaire local (2–3 Q)
- Nav Dashboards → **Découvrir l’outil**

### RiskQuant V2
- `src/lib/risque-evaluation-aide.ts` : critères P/I, dimensions d’impact avec questions/exemples, fréquence & exposition
- UI `RisqueEvaluationAide` : suggestion + **valeur retenue** (humain décide) + justification
- Conservé : historique / réévaluations existants

### Recherche globale `/recherche?q=`
- `src/lib/recherche-globale.ts` — code + titre sur Projet, Mission, Conseil, Processus, Risque, Contrôle, Actif, Fonction, Décision, Arbitrage, Exigence, Document
- Raccourci **Ctrl/Cmd+K** → `/recherche`
- Lien nav + icône recherche topbar mobile

### « À faire maintenant »
- `src/lib/a-faire-maintenant.ts` + `AFaireMaintenant.tsx`
- Dashboard collaborateur, fiche Projet, fiche Mission (recommandations déterministes)

### Couverture Processus
- `src/lib/processus-couverture.ts` + badges ✓ / ⚠ (RACI, Risques, Contrôles, Qualité, Conformité, Continuité)
- Fiche processus + panneau explorer — **pas** de score de maturité

### Empty states
- Processus inventaire, Risques, Fonctions, Rapports (processus) — guidance + lien guide

## Migration

N/A — pas de changement de schéma.

## Dette / arbitrages

- Recherche = scan mémoire (≤200 / type), pas de full-text DB
- Pas de palette Cmd+K modale (page dédiée)
- Couverture = présence documentaire, pas d’évaluation qualitative
- Questionnaires guide = état local uniquement
