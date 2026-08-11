# UniteAttribution — missions institutionnelles

> Attributions / missions **permanentes** d’une Unité.  
> **Distinct** de l’objet `Mission` (audits / revues d’assurance, codes MIS-xxxx).

## Modèle

```
UniteAttribution {
  id, uniteId, titre, description?, ordre, actif, creeLe, modifieLe
}
```

- Soft-delete : `actif = false` (pas de purge).
- Ordre simple (entier) pour l’affichage sur la fiche Unité.

## UX

Section **Missions / attributions** sur `/unite` :

- lecture : cartes compactes (titre + description) des attributions actives ;
- édition (`?edit=ATTRIBUTIONS`) : ajouter / modifier / désactiver / ordre ;
- redirects via `sectionSavedHref` / `sectionDraftHref`.

Les infos structurelles (code, nom, responsable, adjoint) restent administrées dans `/administration/unites` — box compacte en tête de fiche, pas de double saisie.

## Chaîne gouvernance

Voir [`GOUVERNANCE.md`](./GOUVERNANCE.md) :

**Unité → Attributions → Objectifs → Processus → Risques → Contrôles SCI**
