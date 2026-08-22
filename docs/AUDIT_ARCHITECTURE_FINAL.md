# Audit architecture final — carte des relations

Vérification de cohérence des liens métier (état code fin PR F).

## Carte des objets (unité-scopés)

```text
Unite
 ├── Utilisateur ─── FonctionAffectation ─── Fonction (FCT)
 ├── Projet ─── ProjetEtape
 │     └── Tache (projetId)
 ├── Mission ─── (étapes / checklist / visas…)
 │     └── Tache (missionId)
 ├── Conseil ─── Tache (conseilId)
 ├── ControleSCI ─── Tache ; ControlesDocument ; RisqueControle
 ├── Document ─── revues → Tache ; liens Projet/Mission/Processus/Contrôle
 ├── Processus
 │     ├── ProcessusEtape
 │     ├── ProcessusRaciLigne ─── Participant (Fonction | Utilisateur)
 │     ├── ProcessusActifIT ─── ActifIT
 │     ├── ProcessusContinuité ; Dependance
 │     ├── ProcessusQualite ; QualiteRevue ; EcartQualite
 │     ├── Risque (processusId)
 │     ├── ExigenceProcessus ─── Exigence
 │     ├── Arbitrage ; Decision
 │     └── DocumentProcessus
 ├── Risque ─── RisqueReevaluation ; RisqueControle
 ├── Exigence ─── (processus, contrôles, documents, décisions)
 ├── Arbitrage ─── (processus?, risque?, décision?)
 ├── Decision ─── (processus?, précédente?, exigences)
 ├── Objectif* / UniteAttribution (unité)
 └── Macroprocessus ─── Processus
```

\* Objectifs : module unité (SMART + attributions).

## Chaînes critiques — statut

| Chaîne | Statut | Commentaire |
|--------|--------|-------------|
| Risque → Contrôle SCI | OK | `RisqueControle` ; UI inventaire + fiches |
| Processus → Risques | OK | `processusId` ; libellé libre déprécié |
| Processus → RACI → Fonction | OK | Fonction privilégiée ; collab. exception |
| Processus → Qualité / Continuité | OK | 1–1 optionnels |
| Processus → Exigences | OK | N–N ; couverture lit le count |
| Document → Revue → Tâche | OK | Fenêtre de déclenchement |
| Conseil / SCI / Mission → Tâche | OK | Origines distinctes |
| Projet → Étapes → Avancement | OK | Pondération |
| Décision ↔ Arbitrage / Exigence | Partiel | Liens schéma + CRUD ; parcours UX simples |
| Fonction → Rôle applicatif | Soft | Champ indicatif ; RBAC enforce off |

## Libs « intelligence » (PR F) — frontières

| Lib | Entrées | Sortie | Persistance |
|-----|---------|--------|-------------|
| `risque-evaluation-aide` | Réponses impact/proba | Suggestion P/I + texte | Via formulaire Risque uniquement |
| `recherche-globale` | `uniteId`, `q` | Hits href | Aucune |
| `a-faire-maintenant` | User / Projet / Mission | Liste reco | Aucune |
| `processus-couverture` | Flags/counts | Badges ok/warn | Aucune |
| `decouvrir-parcours` | Statique | Contenu guide | Questionnaire local client |

Aucune de ces libs n’écrit en base ni n’appelle d’IA.

## Incohérences / dettes architecture

1. **RBAC** : modèle présent, pages encore permissives — écart doc/produit.
2. **Contrôle ↔ Processus** : `processusConcerne` string sur SCI vs lien via Risque — double voie.
3. **Recherche** : N requêtes `findMany` + filtre JS — acceptable prototype, pas scalable.
4. **Couverture** : contrôles = agrégat via risques liés, pas contrôles « directs » processus.
5. **ARCHITECTURE.md** racine : encore partiellement MVP historique — la vérité opérationnelle est dans `docs/` PR_* + ce fichier.

## Verdict

Le graphe métier **Processus ↔ Risque ↔ Contrôle ↔ Document ↔ Qualité/Conformité/Décision** est **cohérent** pour une démo bout-en-bout.  
Les couches Adoption (PR F) sont **read-mostly** et n’altèrent pas le modèle.  
Priorité architecture suivante : **enforcement RBAC** et clarification **Contrôle–Processus**.
