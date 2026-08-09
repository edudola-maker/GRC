# Architecture — Journal d’activité & Versioning

> Décisions validées (2026-08-09). Pilote en cours sur **Risques**.

## Deux notions distinctes

| Notion | Question | Contenu | Exemples |
|--------|----------|---------|----------|
| **Journal d’activité** | *Que s’est-il passé ?* | Événements fonctionnels | créé, ouvert, clôturé, réouvert, validé, tâche ajoutée, commentaire |
| **Historique / versioning** | *Qui a changé quoi, de quoi à quoi ?* | Diffs de champs | statut A→B, P/I risque, responsable, description |

Ne pas fusionner ces deux flux dans une seule UI confuse.

## Décisions validées

1. **Snapshots JSON** — **non en Phase 1**. Historique générique champ-par-champ. Snapshots complets plus tard si besoin réel de reconstruction.
2. **Journalisation du contenu** — **finalisations + modifications enregistrées des champs structurants**. Pas chaque frappe / brouillon intermédiaire. Toute modif effectivement enregistrée d’un champ structurant est tracée.
3. **Conservation** — **pas de durée unique en dur**. Prévoir une conservation paramétrable ultérieurement par type d’objet / catégorie d’historique. **Phase 1 : conserver sans purge automatique** (choix temporaire). Durées et règles de purge → chantier **Protection des données**.

## Existant réutilisé / introduit

1. **`JournalEvenement`** — événements (`typeEvenement` via `TYPE_EVENEMENT` dans `src/lib/journal.ts`).
2. **`HistoriqueModification`** — modèle générique (remplace progressivement `HistoriqueTache`).
3. **`contenuVersion`** sur l’objet (pilote `Risque`) + futurs visas `versionVisee` (déjà amorcé sur Missions).

## Architecture

### A. Journal (`ajouterJournal` / `listerJournal`)

- Écriture uniquement via helpers.
- Box **Journal d’activité** sur la fiche (distincte de l’Historique).

### B. Historique (`enregistrerModifications` / `listerHistorique`)

Modèle :

```
HistoriqueModification
  uniteId?, typeObjet, objetId, champ,
  ancienneValeur, nouvelleValeur,
  modifieParId, modifieLe, motif?, versionObjet
```

- Helper : `src/lib/historique.ts`
- Appelé depuis les server actions après enregistrement réussi.
- UI : `HistoriqueTimeline` (qui / quand / champ / avant → après / vN).

### C. Versions & validation (articulation)

- Objet sensible : `contenuVersion` (bump si au moins un champ structurant change).
- Futurs visas : `versionVisee` ; si `versionVisee < contenuVersion` → à revalider (`OBSOLETE`).
- Pilote Risques : `contenuVersion` + historique prêts ; workflow de validation non branché encore.

### D. Phases UI

1. **Phase 1 (en cours)** — timeline Historique + Journal sur Risques.
2. Phase 2 — filtre par champ ; export sous droits.
3. Phase 3 — reconstruction / snapshot optionnel si besoin prouvé.

## Plan

| Étape | Statut |
|-------|--------|
| `HistoriqueModification` + helper + pilote Risques | **En cours / livré** |
| Controles SCI + Conseils | Suivant |
| Documents / Processus / Missions | Ensuite |
| Invalidation visas via `contenuVersion` | Après validations métier |
| Migrer `HistoriqueTache` → générique | Plus tard |

## Compatibilité LPD / droits

- Lecture historique = mêmes permissions que la fiche.
- Pas de purge auto en Phase 1 ; paramétrage conservation → Protection des données.
