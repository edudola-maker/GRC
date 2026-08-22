/** Options métier centralisées — listes configurables à terme (Administration). */

/** @deprecated Ancien thème « taxinomie » — ne plus utiliser dans les formulaires. */
export const TAXINOMIE_OPTIONS = [
  { value: "GOUVERNANCE", label: "Gouvernance" },
  { value: "FINANCES", label: "Finances" },
  { value: "RH", label: "RH" },
  { value: "JURIDIQUE", label: "Juridique" },
  { value: "SI", label: "Systèmes d'information" },
  { value: "ACHATS", label: "Achats" },
  { value: "AUTRE", label: "Autre" },
] as const;

export const CONSEIL_DELAI_CIBLE_JOURS = 5;

export const PRIORITE_OPTIONS = [
  { value: "BASSE", label: "Basse" },
  { value: "MOYENNE", label: "Moyenne" },
  { value: "HAUTE", label: "Haute" },
  { value: "CRITIQUE", label: "Critique" },
] as const;

export const STATUT_PROJET_OPTIONS = [
  { value: "IDEE", label: "Idée" },
  { value: "A_ETUDIER", label: "À étudier" },
  { value: "VALIDE", label: "Validé" },
  { value: "PLANIFIE", label: "Planifié" },
  { value: "EN_COURS", label: "En cours" },
  { value: "EN_VALIDATION", label: "En validation" },
  { value: "DEPLOYE", label: "Déployé" },
  { value: "CLOTURE", label: "Clôturé" },
  { value: "ABANDONNE", label: "Abandonné" },
] as const;

export const STATUT_TACHE_OPTIONS = [
  { value: "A_FAIRE", label: "À faire" },
  { value: "EN_COURS", label: "En cours" },
  { value: "EN_ATTENTE", label: "En attente" },
  { value: "A_VALIDER", label: "À valider" },
  { value: "TERMINE", label: "Terminé" },
  { value: "ANNULE", label: "Annulé" },
] as const;

/** Statut de la définition du contrôle (pas de l'occurrence / tâche). */
export const STATUT_CONTROLE_OPTIONS = [
  { value: "ACTIF", label: "Actif" },
  { value: "SUSPENDU", label: "Suspendu" },
] as const;

export const TYPE_CONTROLE_OPTIONS = [
  { value: "MANUEL", label: "Manuel" },
  { value: "SEMI_AUTOMATIQUE", label: "Semi-automatique" },
  { value: "AUTOMATIQUE", label: "Automatique" },
] as const;

export const STATUT_CONSEIL_OPTIONS = [
  { value: "RECU", label: "Reçu" },
  { value: "EN_COURS", label: "En cours" },
  { value: "EN_ATTENTE", label: "En attente" },
  { value: "REPONDU", label: "Répondu" },
  { value: "CLOTURE", label: "Clôturé" },
  { value: "ANNULE", label: "Annulé" },
] as const;

export const STATUT_RISQUE_OPTIONS = [
  { value: "IDENTIFIE", label: "Identifié" },
  { value: "EN_EVALUATION", label: "En évaluation" },
  { value: "EN_TRAITEMENT", label: "En traitement" },
  { value: "MAITRISE", label: "Maîtrisé" },
  { value: "ACCEPTE", label: "Accepté" },
  { value: "CLOTURE", label: "Clôturé" },
] as const;

export const STRATEGIE_RISQUE_OPTIONS = [
  { value: "EVITER", label: "Éviter" },
  { value: "REDUIRE", label: "Réduire" },
  { value: "TRANSFERER", label: "Transférer" },
  { value: "ACCEPTER", label: "Accepter" },
] as const;

export const CATEGORIE_RISQUE_OPTIONS = [
  { value: "FINANCIER", label: "Financier" },
  { value: "OPERATIONNEL", label: "Opérationnel" },
  { value: "CONFORMITE", label: "Conformité" },
  { value: "CYBERSECURITE", label: "Cybersécurité" },
  { value: "REPORTING", label: "Reporting" },
  { value: "JURIDIQUE", label: "Juridique" },
  { value: "SYSTEME_INFORMATION", label: "Système d'information" },
] as const;

/** @deprecated Les types de mission viennent de MissionType (DB). */
export const TYPE_MISSION_OPTIONS = [] as const;

export const TYPE_DOCUMENT_OPTIONS = [
  { value: "DIRECTIVE", label: "Directive" },
  { value: "PROCEDURE", label: "Procédure" },
  { value: "CHARTE", label: "Charte" },
  { value: "POLITIQUE", label: "Politique" },
  { value: "INSTRUCTION", label: "Instruction" },
  { value: "MODELE", label: "Modèle" },
  { value: "AUTRE", label: "Autre" },
] as const;

export const STATUT_DOCUMENT_OPTIONS = [
  { value: "BROUILLON", label: "Brouillon" },
  { value: "EN_VIGUEUR", label: "En vigueur" },
  { value: "A_REVOIR", label: "À revoir" },
  { value: "OBSOLETE", label: "Obsolète" },
  { value: "ARCHIVE", label: "Archivé" },
] as const;

export const STATUT_MISSION_OPTIONS = [
  { value: "PLANIFIE", label: "Planifié" },
  { value: "EN_COURS", label: "En cours" },
  { value: "EN_REVUE", label: "En revue" },
  { value: "TERMINE", label: "Terminé" },
  { value: "ANNULE", label: "Annulé" },
] as const;

export const NIVEAU_CONFIDENTIALITE_OPTIONS = [
  { value: "PUBLIC", label: "Public" },
  { value: "INTERNE", label: "Interne" },
  { value: "CONFIDENTIEL", label: "Confidentiel" },
  { value: "SENSIBLE", label: "Sensible" },
] as const;

/** @deprecated Utiliser STATUT_MISSION_OPTIONS */
export const STATUT_AUDIT_OPTIONS = STATUT_MISSION_OPTIONS;

export const STATUT_PROCESSUS_OPTIONS = [
  { value: "ACTIF", label: "Actif" },
  { value: "SUSPENDU", label: "Suspendu" },
] as const;

export const TYPE_ACTIF_IT_OPTIONS = [
  { value: "APPLICATION", label: "IT — Application" },
  { value: "SYSTEME", label: "IT — Système" },
  { value: "INFRASTRUCTURE", label: "IT — Infrastructure" },
  { value: "SERVICE", label: "IT — Service / outil" },
  { value: "AUTRE", label: "IT — Autre" },
  { value: "LOCAL", label: "Physique — Local" },
  { value: "BATIMENT", label: "Physique — Bâtiment" },
  { value: "SALLE", label: "Physique — Salle" },
  { value: "MATERIEL", label: "Physique — Matériel" },
  { value: "COMPETENCE_CRITIQUE", label: "Humain — Compétence critique" },
  { value: "FONCTION_CRITIQUE", label: "Humain — Fonction critique" },
  { value: "PRESTATAIRE", label: "Prestataire / tiers" },
] as const;

export const STATUT_ACTIF_IT_OPTIONS = [
  { value: "ACTIF", label: "Actif" },
  { value: "EN_PROJET", label: "En projet" },
  { value: "OBSOLETE", label: "Obsolète" },
  { value: "ARCHIVE", label: "Archivé" },
] as const;

export const CRITICITE_CONTINUITE_OPTIONS = [
  { value: "FAIBLE", label: "Faible" },
  { value: "MODEREE", label: "Modérée" },
  { value: "ELEVEE", label: "Élevée" },
  { value: "CRITIQUE", label: "Critique" },
] as const;

export const UNITE_DUREE_CONTINUITE_OPTIONS = [
  { value: "HEURES", label: "heures" },
  { value: "JOURS", label: "jours" },
] as const;

export const ROLE_RACI_OPTIONS = [
  { value: "R", label: "R — Responsible" },
  { value: "A", label: "A — Accountable" },
  { value: "C", label: "C — Consulted" },
  { value: "I", label: "I — Informed" },
] as const;

export const STATUT_OBJECTIF_OPTIONS = [
  { value: "EN_COURS", label: "En cours" },
  { value: "ATTEINT", label: "Atteint" },
  { value: "REPORTE", label: "Reporté" },
  { value: "ABANDONNE", label: "Abandonné" },
] as const;

export const FREQUENCE_CONTROLE_OPTIONS = [
  { value: "MENSUELLE", label: "Mensuelle" },
  { value: "TRIMESTRIELLE", label: "Trimestrielle" },
  { value: "SEMESTRIELLE", label: "Semestrielle" },
  { value: "ANNUELLE", label: "Annuelle" },
  { value: "PONCTUELLE", label: "Ponctuelle" },
] as const;

export const FREQUENCE_REVUE_OPTIONS = [
  { value: "ANNUELLE", label: "Annuelle" },
  { value: "BIANNUELLE", label: "Tous les 2 ans" },
  { value: "TRIANNUELLE", label: "Tous les 3 ans" },
  { value: "PONCTUELLE", label: "Ponctuelle" },
] as const;

export const CATEGORIE_TACHE_OPTIONS = [
  { value: "PROJET", label: "Projet" },
  { value: "CONSEIL", label: "Conseil" },
  { value: "SCI", label: "Contrôle SCI" },
  { value: "MISSION", label: "Mission" },
  { value: "DOCUMENT", label: "Document" },
  { value: "ADMINISTRATIF", label: "Administratif" },
  { value: "AUTRE", label: "Autre" },
] as const;

export const STATUT_RECO_OPTIONS = [
  { value: "OUVERTE", label: "Ouverte" },
  { value: "EN_COURS", label: "En cours" },
  { value: "CLOTUREE", label: "Clôturée" },
  { value: "ANNULEE", label: "Annulée" },
] as const;

export const ECHELLE_RISQUE = [1, 2, 3, 4, 5] as const;

export const TACHE_STATUTS_CLOS = ["TERMINE", "ANNULE"] as const;
export const PROJET_STATUTS_CLOS = ["CLOTURE", "ABANDONNE"] as const;
export const PROJET_STATUTS_ACTIFS = [
  "VALIDE",
  "PLANIFIE",
  "EN_COURS",
  "EN_VALIDATION",
  "DEPLOYE",
] as const;
export const CONSEIL_STATUTS_CLOS = ["CLOTURE", "ANNULE", "REPONDU"] as const;
export const RISQUE_STATUTS_MAITRISES = ["MAITRISE", "ACCEPTE", "CLOTURE"] as const;

/** Aides modules — ~1–2 min de lecture, structurées. */
export const MODULE_HELP = {
  projets: {
    title: "Comprendre le module Projets",
    sections: [
      {
        heading: "À quoi ça sert ?",
        body: "Un projet est une initiative structurée visant un livrable, avec plusieurs étapes et une durée significative. Une demande ponctuelle d’analyse relève plutôt d’un Conseil. Le statut Idée sert de boîte à idées.",
      },
      {
        heading: "Que saisir ?",
        body: "Nom, description, responsable, statut, priorité, dates et avancement. Les tags (en bas) aident la recherche sans être obligatoires.",
      },
      {
        heading: "Lien avec les autres objets",
        body: "Un projet génère des tâches d’avancement. Vous pouvez l’associer librement à des risques, documents, missions ou processus via Éléments associés (en mode Modifier).",
      },
      {
        heading: "Points d’attention",
        body: "Surveillez les échéances et l’avancement. Les éléments « À traiter » listent les projets en retard sans colorer toute la page en alerte.",
      },
    ],
  },
  conseils: {
    title: "Comprendre le module Conseils",
    sections: [
      {
        heading: "À quoi ça sert ?",
        body: "Un conseil est une demande ponctuelle d’analyse ou d’avis. Délai cible indicatif : 5 jours ouvrés (paramétrable par unité).",
      },
      {
        heading: "Que saisir ?",
        body: "Objet, description, demandeur, responsable, dates (réception, échéance, réponse, clôture) et statut. Les tags facilitent le classement thématique (ex. gouvernance).",
      },
      {
        heading: "Lien avec les autres objets",
        body: "Un conseil peut générer des tâches. Il peut être lié à un projet, un risque ou un document via Éléments associés.",
      },
      {
        heading: "Points d’attention",
        body: "Distinguez « en attente » (pending) et « en retard » (échéance dépassée). Le pilotage suit le respect du délai cible.",
      },
    ],
  },
  risques: {
    title: "Comprendre le module Risques",
    sections: [
      {
        heading: "À quoi ça sert ?",
        body: "Cartographier et piloter les risques de l’unité : identification, évaluation, traitement, suivi. La chaîne cible est Processus → Risques → Contrôles SCI → Occurrences.",
      },
      {
        heading: "Notions clés",
        body: "Risque inhérent = avant maîtrise (probabilité × impact). Risque résiduel = après maîtrise. Stratégie : éviter, réduire, transférer ou accepter. La cartographie 5×5 affiche inhérent ou résiduel selon le filtre.",
      },
      {
        heading: "Que saisir ?",
        body: "Description et catégorie, puis évaluation (P/I inhérent et résiduel, stratégie), puis pilotage (responsable, statut). Les tags restent secondaires.",
      },
      {
        heading: "Lien avec les contrôles SCI",
        body: "Un traitement « réduire » s’appuie souvent sur des contrôles SCI. Associez-les en mode Modifier. Les preuves d’exécution restent sur les occurrences (tâches), pas sur la définition du contrôle.",
      },
    ],
  },
  controles: {
    title: "Comprendre les Contrôles SCI",
    sections: [
      {
        heading: "Définition vs exécution",
        body: "Le contrôle SCI est la définition permanente (ex. rapprochement bancaire trimestriel). L’exécution est une tâche / occurrence (T1, T2…). Le contrôle est Actif ou Suspendu — jamais « Réalisé » définitivement.",
      },
      {
        heading: "Que saisir ?",
        body: "Nom, objectif/description, processus concerné, type (manuel / semi-auto / auto), fréquence, fenêtre de déclenchement, responsable et statut.",
      },
      {
        heading: "Preuves",
        body: "Les preuves se rattachent à l’occurrence réalisée (commentaire, pièce, date), pas à la fiche définition du contrôle.",
      },
      {
        heading: "Chaîne SCI",
        body: "Processus → Risques → Contrôles → Occurrences. Liez le contrôle aux risques et processus via Éléments associés.",
      },
    ],
  },
  documents: {
    title: "Comprendre le module Documents",
    sections: [
      {
        heading: "À quoi ça sert ?",
        body: "Référentiel de pilotage documentaire (métadonnées, revues, liens). Le contenu détaillé reste dans Confluence — cette application n’est pas une GED.",
      },
      {
        heading: "Que saisir ?",
        body: "Nom, type, version, lien Confluence, responsable, statut, fréquence et dates de revue.",
      },
      {
        heading: "Revues",
        body: "Une revue due crée une tâche pour le responsable. Sur la fiche, les tâches de revue sont volontairement secondaires par rapport aux informations du document.",
      },
      {
        heading: "Points d’attention",
        body: "Surveillez les documents à revoir ou en retard de revue. Associez le document aux processus, risques ou contrôles concernés.",
      },
    ],
  },
  audits: {
    title: "Comprendre le module Missions",
    sections: [
      {
        heading: "À quoi ça sert ?",
        body: "Travaux structurés (audits, revues…) via un moteur unique : Type → Template → Instance. Le nom du module pourra encore évoluer.",
      },
      {
        heading: "Que saisir ?",
        body: "Type, intitulé, descriptif (liste standard ou « Mission spécifique » libre), unité, dates, équipe avec rôles de mission. Codes MIS-xxxx.",
      },
      {
        heading: "Équipe & initiales",
        body: "Les rôles (ex. Responsable de mandat, Auditeur) sont propres à la mission. Les initiales (JD, TZ…) sont un affichage compact — jamais l’identifiant technique.",
      },
      {
        heading: "Check-lists ≠ tâches",
        body: "Les check-lists qualité confirment une exigence méthodologique. Les tâches sont du travail opérationnel (Dashboard collaborateur).",
      },
      {
        heading: "Recommandations",
        body: "Objets REC-xxxx suivis dans le temps, indépendants de la clôture / archivage de la mission.",
      },
    ],
  },
  processus: {
    title: "Comprendre le référentiel Processus",
    sections: [
      {
        heading: "À quoi ça sert ?",
        body: "Décrire ce que l’unité fait (processus), pas comment elle le fait (procédure → Confluence). Point d’entrée vers risques, contrôles, documents et missions via Éléments associés.",
      },
      {
        heading: "Que saisir ?",
        body: "Code (PRC-xxxx), nom, description courte, responsable, statut, lien Confluence, étapes ordonnées. Pas de moteur BPMN : une simple séquence d’étapes suffit.",
      },
      {
        heading: "Chaîne cible",
        body: "Unité → Macroprocessus → Processus → (RACI, Risques & Contrôles, Actifs IT, Continuité) → vues transversales. Un objet peut être lié au processus ou à une étape précise.",
      },
      {
        heading: "Arborescence",
        body: "L’arborescence regroupe les processus sous leurs macroprocessus (MAC-xxxx). Les processus sans rattachement apparaissent sous « Sans macroprocessus ».",
      },
    ],
  },
  macroprocessus: {
    title: "Comprendre les Macroprocessus",
    sections: [
      {
        heading: "À quoi ça sert ?",
        body: "Regrouper les processus en grandes familles d’activités de l’unité. Objet volontairement léger : pas de RACI, risques, contrôles ou continuité ici — ceux-ci restent sur le Processus.",
      },
      {
        heading: "Que saisir ?",
        body: "Code (MAC-xxxx), nom, narratif / finalité, responsable, ordre d’affichage, unité propriétaire. Optionnel : unités applicables (visibilité hors propriétaire).",
      },
      {
        heading: "Hiérarchie",
        body: "Unité → Macroprocessus → Processus. L’arborescence Processus s’appuie sur ce niveau pour structurer le référentiel.",
      },
    ],
  },
  actifsIT: {
    title: "Comprendre le référentiel Actifs",
    sections: [
      {
        heading: "À quoi ça sert ?",
        body: "Référentiel généralisé (IT, physique, humain, prestataire) pour identifier ce qui supporte les processus. Vue inverse : si un actif est indisponible, quels processus sont impactés ?",
      },
      {
        heading: "Que saisir ?",
        body: "Code AIT-xxxx, nom, type (catégories IT / physique / humain / prestataire), description, responsable, statut. Optionnel : fournisseur, hébergement, service fourni, criticité 1–5. Pas une CMDB complète.",
      },
      {
        heading: "Liens",
        body: "Relation N–N avec les Processus. Les risques et la continuité s’appuient ensuite sur ces dépendances — sans ressaisie.",
      },
    ],
  },
  modelesTaches: {
    title: "Comprendre les modèles de tâches",
    sections: [
      {
        heading: "À quoi ça sert ?",
        body: "Un modèle définit une checklist standard réutilisable. À la création d’une tâche, la checklist est copiée — les occurrences ne se resynchronisent pas ensuite.",
      },
      {
        heading: "Chaîne",
        body: "Processus (optionnel) → Modèle de tâche → Tâche → Checklist d’occurrence. Distinct de la checklist de mission d’audit.",
      },
      {
        heading: "Que saisir ?",
        body: "Nom, description, délai standard, responsable et catégorie par défaut, étapes ordonnées, processus associés.",
      },
    ],
  },
  unite: {
    title: "Comprendre la fiche Unité",
    sections: [
      {
        heading: "À quoi ça sert ?",
        body: "Point d’entrée synthétique : identité, objectifs, équipe et organisation. Les listes d’activité restent dans les modules et les Dashboards — pas de double Dashboard ici.",
      },
      {
        heading: "Objectifs",
        body: "Les Objectifs (OBJ-xxxx) sont stratégiques pour l’unité. Distincts des objectifs individuels et des KPI modules. Liez-les librement aux projets, missions, processus, etc.",
      },
      {
        heading: "Création",
        body: "Les boutons Nouveau projet / mission / tâche… ouvrent les formulaires des modules existants — l’unité est déjà celle de votre session.",
      },
    ],
  },
  objectifs: {
    title: "Comprendre les objectifs d’unité",
    sections: [
      {
        heading: "À quoi ça sert ?",
        body: "Un Objectif donne le pourquoi. Les projets, missions, contrôles et tâches liés représentent ce qui est réalisé pour l’atteindre.",
      },
      {
        heading: "Simplicité",
        body: "Pas d’OKR ni de scoring automatique dans cette version. Progression calculée = roadmap.",
      },
    ],
  },
  taches: {
    title: "Comprendre l’inventaire des Tâches",
    sections: [
      {
        heading: "À quoi ça sert ?",
        body: "Vue transversale de toutes les tâches, quels que soient leur objet d’origine (projet, conseil, contrôle, mission, document…) ou leur unité.",
      },
      {
        heading: "Dashboard vs Tâches",
        body: "Le Dashboard collaborateur reste la vue personnelle du quotidien. L’onglet Tâches est l’inventaire complet pour rechercher, filtrer et mesurer.",
      },
      {
        heading: "Filtres",
        body: "Filtrez par statut, responsable, unité, objet source ; combinez avec la recherche. Le compteur indique combien d’éléments correspondent.",
      },
    ],
  },
} as const;
