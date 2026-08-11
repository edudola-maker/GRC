# Gouvernance — chaîne Unité → Contrôles

Vision de la chaîne de gouvernance opérationnelle dans GRC Pilotage.

```
Unité (UNT)
  ├─ Attributions / missions institutionnelles (UniteAttribution)
  ├─ Objectifs stratégiques (OBJ)
  ├─ Collaborateurs (Utilisateur, Admin)
  └─ Processus (PRC)
        └─ Risques (RIS)  ← Risque.processusId
              └─ Contrôles SCI (CTL)  ← RisqueControle
                    └─ Occurrences (Tâches)
```

Missions d’assurance (`Mission` MIS-xxxx) sont **parallèles** : elles examinent processus / risques / contrôles, elles ne remplacent pas les attributions institutionnelles.

## Livré

| Maillon | Statut |
|---------|--------|
| Fiche Unité présentation | Livré (`/unite`) |
| `UniteAttribution` CRUD | Livré |
| Objectifs d’unité | Livré |
| Processus + étapes + code PRC éditable | Livré |
| Risque ↔ Processus (`processusId`) | Livré |
| Risques associés sur fiche Processus | Livré |
| CTL liés affichés | Livré |
| LPD léger (champs secondaires) | Socle — approche légère maintenue |

## Roadmap (pas maintenant)

- **Conformité** : référentiel légal / exigences / liens / revues — **architecture TBD avant build**.
- **Éditeur key user**, **multi-unités**, **RBAC fin** — préparation documentée dans `ROADMAP.md` / `EDITEUR_PREPARATION.md`.
- Module LPD transversal de pilotage — voir `LPD.md` (rester léger).

## Documents liés

- [`UNITE_ATTRIBUTIONS.md`](./UNITE_ATTRIBUTIONS.md)
- [`OBJECTIFS.md`](./OBJECTIFS.md)
- [`LPD.md`](./LPD.md)
- [`MISSIONS_ARCHITECTURE.md`](./MISSIONS_ARCHITECTURE.md)
