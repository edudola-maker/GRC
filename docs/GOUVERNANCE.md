# Gouvernance — Unité → Processus → analyses

Vision : le **Processus** devient le centre de gravité de la gouvernance, sans silos GRC.

```
Unité (UNT)
  ├─ Attributions / missions institutionnelles (UniteAttribution)
  ├─ Objectifs stratégiques (OBJ)
  ├─ Collaborateurs (Utilisateur)
  └─ Processus (PRC)
        ├─ RACI (facultatif) — ProcessusRaciLigne / Participant
        ├─ Actifs IT (AIT) ← ProcessusActifIT (N–N)
        ├─ Documents (DOC) ← DocumentProcessus (N–N)
        ├─ Risques (RSK) ← Risque.processusId
        │     └─ Contrôles SCI (CTL) ← RisqueControle
        └─ Continuité des activités (architecture — pas encore en code)
```

Vues transversales (consolidation, pas double saisie) : Risques, Contrôles, Actifs IT, Documents, Continuité (Roadmap).

## Livré

| Maillon | Statut |
|---------|--------|
| Fiche Unité / Attributions / Objectifs | Livré |
| Processus + étapes + code PRC | Livré |
| RACI Processus (facultatif, Utilisateurs) | Livré |
| Actifs IT (AIT) + N–N Processus | Livré |
| Risque ↔ Processus | Livré |
| Aide à l’évaluation (déterministe) + justification | Livré |
| Intégration réévaluation | Livré |
| Document ↔ Processus | Livré |
| Continuité (modèle + vue) | Architecture à valider — `ARCHITECTURE_CONTINUITE.md` |

## Principes

- Une donnée → une source de vérité → plusieurs vues.
- Simple au premier regard, riche à l’approfondissement (sections repliables).
- Ne pas créer de silo Information Security / BCM autonome maintenant.

## Documents liés

- [`ARCHITECTURE_CONTINUITE.md`](./ARCHITECTURE_CONTINUITE.md)
- [`UNITE_ATTRIBUTIONS.md`](./UNITE_ATTRIBUTIONS.md)
- [`OBJECTIFS.md`](./OBJECTIFS.md)
- [`LPD.md`](./LPD.md)
- [`RISQUE_REEVALUATION.md`](./RISQUE_REEVALUATION.md)
