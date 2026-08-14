# Architecture — Inventaire des données / traitements (piste)

> **Pas d’implémentation dans cette itération.**  
> Documenter la piste pour que Processus / Actifs IT / LPD restent compatibles.

## Principe

Même philosophie que Actifs IT et Continuité :

```
Réflexion au bon endroit → données structurées → consolidation → pilotage
```

Source de vérité future proposée :

```
Processus ↔ Données (N–N)
```

comparable à :

```
Processus ↔ Actifs IT
```

## Chaîne cible (vision)

```
Processus
  ├─ Données utilisées / traitements
  ├─ Actifs IT (systèmes)
  ├─ Risques / Contrôles
  └─ Protection des données (réflexion LPD légère)
        ↓
Vue transversale « Inventaire des données »
```

## Ce qui existe déjà (ne pas dupliquer)

| Information | Source actuelle |
|-------------|-----------------|
| Processus | Référentiel Processus |
| Systèmes / applications | Actifs IT |
| Risques / contrôles | RSK / CTL via Processus |
| Indicateur LPD léger | `contientDonneesPersonnelles` + `niveauConfidentialite` sur Processus (et Mission / Document) |

La box **Protection des données** sur Processus porte aujourd’hui cette réflexion légère — **pas** un inventaire de traitements.

## Ce qu’il faudra définir ensemble avant code

- Périmètre : « donnée », « traitement », ou les deux ?
- Champs minimum (finalité, base légale, durée conservation, etc.)
- Lien Actifs IT (où les données « vivent »)
- Lien Risques / Contrôles
- Qui saisit : sur Processus uniquement vs référentiel autonome

## Roadmap

- Référentiel Données / Traitements
- Relation N–N Processus ↔ Données
- Vue inventaire consolidée
- Module LPD avancé (pas de silo maintenant)
