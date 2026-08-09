# Architecture proposée — Journal d’activité & Versioning

> Proposition pour validation avant implémentation généralisée.  
> **Aucune migration lourde dans ce sprint** — socles déjà présents à réutiliser.

## Deux notions distinctes

| Notion | Question | Contenu | Exemples |
|--------|----------|---------|----------|
| **Journal d’activité** | *Que s’est-il passé ?* | Événements fonctionnels | créé, ouvert, clôturé, réouvert, validé, tâche ajoutée, commentaire |
| **Historique / versioning** | *Qui a changé quoi, de quoi à quoi ?* | Diffs de champs | statut A→B, P/I risque, responsable, description |

Ne pas fusionner ces deux flux dans une seule UI confuse.

## Existant à réutiliser

1. **`JournalEvenement`** — déjà générique (`typeObjet`, `objetId`, `typeEvenement`, `message`, `auteurId`). Base du journal d’activité.
2. **`HistoriqueTache`** — modèle champ-par-champ (`champModifie`, `ancienneValeur`, `nouvelleValeur`). Prototype du versioning.
3. **`MissionValidationPoint.contenuVersion` + visas** — amorce du lien validation ↔ version de contenu.

## Architecture cible (simple / générique)

### A. Journal d’activité (étendre `JournalEvenement`)

- Conserver le modèle actuel.
- Standardiser un catalogue de `typeEvenement` (constantes TypeScript, puis Admin plus tard).
- Afficher une box **Journal** repliable sur les fiches (comme Conseils aujourd’hui).
- Écriture uniquement via helpers (`ajouterJournal`) — jamais dispersée.

### B. Historique de champs — modèle générique `HistoriqueModification`

Remplacer progressivement les historiques ad hoc par **un** modèle :

```
HistoriqueModification
  id
  uniteId?
  typeObjet     (TypeObjetMetier)
  objetId
  champ         (chemin stable, ex. "statut", "probabilite")
  ancienneValeur String?   // sérialisation texte / JSON courte
  nouvelleValeur String?
  modifieParId
  modifieLe
  motif?        // optionnel
  versionObjet  Int        // incrémenté à chaque lot de modifs « finalisées »
```

- Helper unique `enregistrerModifications({ typeObjet, objetId, before, after, userId, champs })`.
- Appelé depuis les `update*` server actions après succès, **pas** depuis chaque composant UI.
- Première vague : Risques, Contrôles SCI, Conseils, Documents, Processus, Missions (infos générales).
- `HistoriqueTache` peut migrer vers ce modèle ou rester un alias temporaire.

### C. Versions & validation

- Chaque objet sensible porte `contenuVersion Int @default(1)`.
- Finaliser une box / section incrémentée `contenuVersion` (déjà amorcé sur Missions).
- Visas / validations stockent `versionVisee`.
- Si `versionVisee < contenuVersion` → statut `OBSOLETE` / à revalider (roadmap déjà notée).

### D. Consultation UI (phases)

1. **Phase 1** — timeline « Historique » : liste des changements (qui / quand / champ / avant → après).
2. **Phase 2** — filtre par champ ; export éventuel soumis aux mêmes droits.
3. **Phase 3** — « Voir à la version N » (reconstruction ou snapshot JSON optionnel) — seulement si Phase 1 prouve le besoin.

**Recommandation :** ne pas stocker de snapshot complet dès Phase 1 (coût / complexité). Les diffs champ-par-champ suffisent pour « qui a modifié quoi ».

## Compatibilité LPD / droits

- Lecture historique = mêmes permissions que la fiche.
- Pas de données personnelles réelles en seed.
- Journalisation des accès sensibles = roadmap LPD (onglet Protection des données).

## Plan d’implémentation suggéré (après validation)

1. Introduire `HistoriqueModification` + helper + UI timeline sur **Risques** (pilote).
2. Brancher Controles SCI + Conseils.
3. Étendre Documents / Processus / Missions (sections).
4. Brancher invalidation des visas via `contenuVersion`.
5. Migrer `HistoriqueTache` → modèle générique.

## Décisions à valider

1. Snapshot JSON complet dès Phase 1 ? (**Proposition : non**)
2. Historique des brouillons (`SectionRedaction`) vs uniquement Finaliser ? (**Proposition : Finaliser + champs opérationnels clés**)
3. Conservation / purge des historiques (durée) — lien onglet Protection des données.
