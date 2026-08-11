# Architecture cible — Substantif / Constats / Validations

> Préparation architecturale. **Ne pas sur-développer** tant qu’un cas d’usage concret n’est pas demandé.

## Chaîne méthodologique

```
Objectif de mission
  → Risque de mission (≠ Risque GRC, lien facultatif)
    → Papier de travail
      → Conclusion (Satisfaisant / Amélioration / Constat)
        → Constat éventuel
          → Recommandation éventuelle
```

Tous les liens sont **facultatifs** quand pertinent. Un papier peut ne produire aucun constat ; un constat aucune recommandation.

## Papier de travail (champs cibles)

- objectif (lien)
- travaux effectués
- éléments examinés
- analyse / réflexion
- conclusion
- section facultative **Échantillon** (population, méthode, taille, justification, éléments)
- grille testing configurable (architecture à présenter avant implémentation)

## Constat (objet distinct)

- titre
- situation observée
- critère / attendu
- risque / conséquence
- conclusion
- criticité : Faible / Modéré / Important / Critique  
  (**pas** la matrice 5×5 GRC)

## Recommandations (workflow cible)

`Brouillon → À valider → Validée → En suivi → Clôturée`

Suivi : Audité indique réalisé → Auditeur vérifie → Clôture (jamais auto).

## Validation / quatre yeux

Sur grandes étapes : Planification, travaux importants, recommandations, Rapport.  
Si élément validé modifié : visa historique conservé ; version courante → À valider.

## Processus / Risques / SCI

- Processus : description, étapes, risques, CTL via risques, documents — pas de BPMN
- Réévaluation risques : fréquence configurable → tâche / À traiter (pas annuelle imposée)
- CTL : référentiel → occurrence/tâche (date, responsable, résultat, commentaire, preuve légère)

## Recherche / navigation (plus tard)

- Recherche globale permanente
- Cmd/Ctrl+K (Roadmap)
- « Reprendre » : déjà amorcé (localStorage collaborateur)
