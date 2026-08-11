# Notes, Journal de bord, Journal système

## Trois niveaux (ne pas fusionner)

| Couche | Modèle | Rôle |
|--------|--------|------|
| **Notes / Séances** | `NoteTravail` | Espace de travail : préparer une réunion, questions, notes libres |
| **Journal de bord** | `JournalBordEntree` | Chronologie métier **volontaire** (contacts, livraisons, décisions) |
| **Journal système** | `JournalEvenement` | Traçabilité automatique (création, statut, archivage…) |

## Notes

- Parents : Projet, Conseil, Mission (pas de module nav global)
- Type : `TRAVAIL` | `SEANCE` (facultatif)
- Participants : utilisateurs internes et/ou noms externes
- Questions une à une + zone notes libres
- **Note originale ≠ PV** — le PV sera un objet/proposition séparé (Roadmap IA)
- Depuis une note : créer une tâche (lien `noteTravailId` conservé)

## Journal de bord

- Champs : date + texte (+ auteur/heure auto)
- Timeline compacte
- Tâche terminée → proposition « Ajouter au journal » (pas d’auto-ajout)

## PV / compte rendu

Hors scope de cette itération. Règle : jamais transformer destructivement la Note.
