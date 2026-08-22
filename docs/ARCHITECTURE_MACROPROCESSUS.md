# Macroprocessus & multi-unités

## Hiérarchie (appartenance)

Unité → **Macroprocessus** → Processus → Étapes

- `Macroprocessus` = famille d’activités (objet dédié, code MAC-xxxx).
- `Processus.macroprocessusId` = rattachement.
- `Processus.parentId` = **réservé** aux futurs sous-processus (non exposé UX).

## Dépendance (continuité)

`ProcessusDependance` = Processus A dépend de Processus B.  
**Ne jamais** confondre avec la hiérarchie Macro → Processus.

## Multi-unités

- `uniteId` = propriétaire (modifiable, référentiel Unités).
- `*UniteApplicable` = visibilité pour d’autres unités.
- **Pas d’héritage automatique** Macro → Processus.
