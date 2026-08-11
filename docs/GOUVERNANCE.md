# Gouvernance — chaîne Unité → Contrôles

Vision de la chaîne de gouvernance opérationnelle dans GRC Pilotage.

```
Unité (UNT)
  ├─ Attributions / missions institutionnelles (UniteAttribution)
  ├─ Objectifs stratégiques (OBJ)
  ├─ Collaborateurs (Utilisateur, Admin)
  └─ Processus (PRC)
        ├─ Documents (DOC)  ← DocumentProcessus (N–N métier)
        └─ Risques (RSK)  ← Risque.processusId
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
| Document ↔ Processus (`DocumentProcessus`) | Livré — cas d’usage procédures |
| Risques / documents associés sur fiche Processus | Livré |
| CTL liés via Risque (pas de lien CTL→Processus direct) | Livré |
| LPD léger (champs secondaires) | Socle — approche légère maintenue |

## Principes de liaison

Ajouter un lien direct **seulement** s’il correspond à un vrai besoin métier :

| Lien | Statut | Raison |
|------|--------|--------|
| Processus → Risque | Oui | Analyse des risques de processus |
| Document → Processus | Oui | Procédures naturellement multi-processus |
| Contrôle SCI → Processus | Non | Déjà obtenu via Processus → Risque → CTL |

## Roadmap (pas maintenant)

- **Conformité** : référentiel légal / exigences / liens / revues — **architecture TBD avant build**.
- **Éditeur key user**, **multi-unités**, **RBAC fin** — préparation documentée dans `ROADMAP.md` / `EDITEUR_PREPARATION.md`.
- Module LPD transversal de pilotage — voir `LPD.md` (rester léger).
- Rattachements `UniteAttribution` → Processus / Objectifs : **pas maintenant** (attributions autonomes).

## Documents liés

- [`UNITE_ATTRIBUTIONS.md`](./UNITE_ATTRIBUTIONS.md)
- [`OBJECTIFS.md`](./OBJECTIFS.md)
- [`LPD.md`](./LPD.md)
- [`MISSIONS_ARCHITECTURE.md`](./MISSIONS_ARCHITECTURE.md)
