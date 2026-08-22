# Audit UX final (PR F)

Audit documentaire — **constats**, pas remediation silencieuse de tout.

## Doublons / redondances

| Constat | Sévérité | Note |
|---------|----------|------|
| Dashboard « À faire » (buckets) **et** « À faire maintenant » | Moyenne | Deux couches : buckets = inventaire échéances ; AFaireMaintenant = 3–5 reco. Risque de confusion si titres trop proches. |
| Processus : arborescence **et** inventaire | Faible | Intentionnel (exploration vs liste). |
| Couverture badges fiche **et** explorer | Faible | Même lib — cohérent. |
| Nav Gouvernance longue (10+ entrées) | Moyenne | Découvrabilité faible pour novices — partiellement mitigé par `/decouvrir` et Recherche. |
| Rapports hub vs boutons Exporter sur fiches | Faible | Redondance utile. |

## Boîtes / densité

| Constat | Sévérité |
|---------|----------|
| Fiches Processus / Projet : nombreuses `CollapsibleSection` — dense mais repliable | Faible |
| RiskQuant panel ouvert : grille dimensions large sur mobile | Moyenne |
| EmptyGuidance : bordure dashed — cohérent avec `.empty` existant | OK |
| KPI zones + matrices sur inventaires | OK si section unique |

## Responsive

| Constat | Sévérité |
|---------|----------|
| Topbar + drawer &lt; 760px | OK |
| Recherche topbar **mobile only** ; desktop via nav + Cmd+K | Faible (à documenter pour users) |
| Planning : desktop drag / mobile liste | OK (PR B) |
| Table inventaire risques dense : colonnes masquées SM/MD | OK |
| Parcours Découvrir : CTA empilés — OK |

## Icônes / chrome

| Constat | Sévérité |
|---------|----------|
| Icônes SVG nav monochromes | OK |
| Nouvelles : `search`, `guide` | OK |
| Couverture utilise ✓ / ⚠ texte (demandé) — pas d’emoji décor | OK |
| Pas d’icône distincte Exigences (réutilise `risk`) | Faible |

## Accessibilité

| Constat | Sévérité |
|---------|----------|
| Hotkey Cmd+K sans annonce visuelle desktop (hors nav) | Moyenne |
| Radios questionnaire Découvrir : fieldset/legend OK | OK |
| Chips couverture : `title` pour détail — pas d’explication clavier dédiée | Faible |

## Parcours / empty states

| Page | État |
|------|------|
| Processus inventaire vide | Guidé + lien guide |
| Risques vide | Guidé |
| Fonctions vide | Guidé |
| Rapports sans processus | Guidé |
| Autres inventaires (arbitrages, décisions…) | Empty minimal legacy — **non** tous peaufinés |

## Recommandations (backlog UX, non faites ici)

1. Regrouper ou clarifier libellés « À faire » vs « À faire maintenant ».
2. Afficher un hint « Ctrl+K » dans le header desktop.
3. Sous-grouper la nav Gouvernance (Référentiel / Pilotage / Actes).
4. Étendre EmptyGuidance aux listes ARB/DEC/EXI.
5. RiskQuant : accordion par dimension sur viewport étroit.
