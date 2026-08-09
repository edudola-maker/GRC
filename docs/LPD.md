# Protection des données — LPD by design (vision)

> **Ne pas développer un gros module LPD maintenant.**  
> Documenter la vision, rester compatible architecturalement, éviter les dépendances qui bloqueraient une consolidation ultérieure.

## Principe directeur

Protection des données **documentée, traçable et démontrable**, mais **discrète** dans l’expérience utilisateur.

- Approche **légère et intégrée au travail quotidien** — pas un workflow de conformité lourd.
- Objectif : démontrer que les bonnes réflexions ont été faites, **sans** transformer chaque objet en questionnaire LPD.
- Chaîne cible :

```
Réflexion légère au fil du travail
  → données structurées (secondaires, repliables)
  → consolidation (onglet pilotage)
  → rapport / extraction LPD
```

## Informations structurées (simples)

Lorsqu’un objet ou une activité traite des données personnelles, prévoir quelques champs **secondaires, repliables, peu contraignants** :

| Information | Rôle |
|-------------|------|
| Présence de données personnelles | Oui / non (socle déjà : `contientDonneesPersonnelles`) |
| Niveau de confidentialité / sensibilité | Classification (socle : `niveauConfidentialite`) |
| Courte réflexion ou mesures prises | Texte court documenté |
| Règle de conservation (si connue) | Référence / durée / politique |
| Périmètre d’accès (éventuel) | Qui peut voir / traiter |

Ne pas imposer un questionnaire exhaustif à chaque enregistrement.

## Éviter la ressaisie — héritage

Une partie de ces informations doit pouvoir être **héritée** d’un Processus, d’un Template (ex. template de mission) ou d’un autre référentiel.

- À la création d’une instance : préremplir depuis le template / processus lié.
- L’utilisateur **confirme ou adapte** — il ne refait pas toute l’analyse.
- Pas de sync rétroactive obligatoire modèle → instances (même logique que les modèles de tâches) ; l’héritage est un **démarrage**, pas un couplage fort.

Compatibilité : stocker les champs LPD sur les objets métier (ou une structure partagée stable), pas dans un silo LPD isolé qui forcerait une double saisie.

## Onglet transversal « Protection des données »

Vue de **pilotage / consolidation**, pas principalement un écran de saisie.

Agrège ce qui est déjà documenté ailleurs :

- processus / missions / documents (etc.) concernés par des données personnelles ;
- classifications ;
- mesures / réflexions documentées ;
- règles de conservation ;
- éléments **non qualifiés** ;
- points nécessitant une attention ;
- indicateurs synthétiques.

Entrée nav : prévue en Roadmap (pas d’implémentation maintenant).

## Rapport / extraction LPD

À terme : générer un rapport à partir des informations **déjà présentes** dans le système.

- Paramétrable : unité, période, processus, autres critères.
- Restitue réflexions et mesures documentées.
- Évite de maintenir en parallèle un document manuel qui reprend les mêmes infos.
- Exports / rapports soumis aux **mêmes permissions** que les fiches sources.

## Versioning / traçabilité

Les informations structurantes LPD doivent pouvoir être **historisées** via le socle générique (`HistoriqueModification`), comme les autres champs structurants.

On doit pouvoir retrouver, lorsque pertinent :

- quelle classification / réflexion s’appliquait à une période ;
- comment elle a évolué.

Voir [`VERSIONING.md`](./VERSIONING.md). Conservation / purge des historiques : règles **paramétrables** (pas de durée unique en dur) — ce chantier LPD en est le propriétaire naturel.

## Architecture compatible (garde-fous)

Pour les développements futurs (versioning, Processus, Documents, Missions, Éditeur) :

1. **Champs LPD sur les objets métier** (ou structure partagée réutilisable) — pas un module juridique parallèle.
2. **UI secondaire** : section repliable « Protection des données », jamais au premier plan du hero / inventaire.
3. **Héritage template → instance** prévu dès la conception des templates / Éditeur.
4. **Historisation** des champs LPD structurants via `enregistrerModifications` (même pipeline que le reste).
5. **Pas de dépendance** qui rendrait l’agrégation difficile : éviter les textes libres uniquement dans Confluence pour les faits structurants ; Confluence peut rester la référence documentaire détaillée.
6. **Pas de données personnelles réelles** en seed / démo.

## Socle déjà présent

Flags sur Mission / Template mission / Document / Processus :

- `contientDonneesPersonnelles`
- `niveauConfidentialite`

À enrichir plus tard (réflexion / mesures, conservation, périmètre) sans casser ces clés.

## Hors scope immédiat

- Gros module LPD / registre juridique complet
- Questionnaires obligatoires à chaque objet
- Purge automatique des historiques (Phase 1 versioning : conservation sans purge)
- Onglet / rapport LPD (roadmap uniquement)
