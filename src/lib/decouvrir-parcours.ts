/**
 * Parcours guidés « Découvrir l’outil » — pas de docs statiques seules.
 * Chaque parcours = étapes courtes + CTA dans l’app + mini-questionnaire optionnel.
 */

export type DecouvrirQuestion = {
  id: string;
  prompt: string;
  options: { value: string; label: string; hint?: string }[];
};

export type DecouvrirParcours = {
  slug: string;
  titre: string;
  resume: string;
  etapes: { titre: string; detail: string; href?: string; cta?: string }[];
  questionnaire?: DecouvrirQuestion[];
};

export const DECOUVRIR_PARCOURS: DecouvrirParcours[] = [
  {
    slug: "creer-projet",
    titre: "Créer un Projet",
    resume:
      "Cadrez un projet, définissez les étapes pondérées et suivez l’avancement.",
    etapes: [
      {
        titre: "Ouvrir l’inventaire Projets",
        detail: "Repérez les projets de votre unité et leur statut.",
        href: "/projets",
        cta: "Voir les projets",
      },
      {
        titre: "Créer le projet",
        detail: "Saisissez code, nom, responsable, dates et priorité.",
        href: "/projets/nouveau",
        cta: "Nouveau projet",
      },
      {
        titre: "Compléter les étapes",
        detail:
          "Sur la fiche, ajustez les étapes pondérées — l’avancement global en découle.",
        href: "/projets",
        cta: "Retour inventaire",
      },
    ],
    questionnaire: [
      {
        id: "quand",
        prompt: "Quand créer un Projet plutôt qu’une Mission ?",
        options: [
          {
            value: "changement",
            label: "Changement / livraison avec étapes",
            hint: "Oui — Projet = parcours de transformation.",
          },
          {
            value: "assurance",
            label: "Mission d’assurance / audit",
            hint: "Non — préférez Missions.",
          },
          {
            value: "controle",
            label: "Contrôle SCI récurrent",
            hint: "Non — Contrôles SCI.",
          },
        ],
      },
      {
        id: "avancement",
        prompt: "Comment est calculé l’avancement du projet ?",
        options: [
          {
            value: "etapes",
            label: "Somme pondérée des étapes",
            hint: "Correct.",
          },
          {
            value: "taches",
            label: "Nombre de tâches terminées",
            hint: "Les tâches aident le suivi, mais l’avancement = étapes.",
          },
        ],
      },
    ],
  },
  {
    slug: "documenter-processus",
    titre: "Documenter un Processus",
    resume:
      "Le processus décrit le « quoi » ; la procédure détaillée reste hors outil (ex. Confluence).",
    etapes: [
      {
        titre: "Explorer l’arborescence",
        detail: "Macroprocessus → Processus, vue split.",
        href: "/processus",
        cta: "Ouvrir Processus",
      },
      {
        titre: "Créer ou ouvrir une fiche",
        detail: "Nom, statut, criticité, lien documentation.",
        href: "/processus/nouveau",
        cta: "Nouveau processus",
      },
      {
        titre: "Compléter RACI et étapes",
        detail: "Rôles (Fonctions) et étapes métier sur la fiche.",
      },
    ],
    questionnaire: [
      {
        id: "quoi",
        prompt: "Que stocke la fiche Processus ?",
        options: [
          {
            value: "quoi",
            label: "Le « quoi » + gouvernance (RACI, risques…)",
            hint: "Oui.",
          },
          {
            value: "procedure",
            label: "La procédure pas-à-pas complète",
            hint: "Non — lien Confluence / référence.",
          },
        ],
      },
    ],
  },
  {
    slug: "identifier-risque",
    titre: "Identifier un Risque",
    resume: "Enregistrez un risque lié à un processus, avec catégorie et responsable.",
    etapes: [
      {
        titre: "Inventaire risques",
        detail: "Matrice et liste filtrable.",
        href: "/risques",
        cta: "Voir les risques",
      },
      {
        titre: "Créer le risque",
        detail: "Nom, catégorie, processus lié, statut Identifié.",
        href: "/risques/nouveau",
        cta: "Nouveau risque",
      },
    ],
    questionnaire: [
      {
        id: "lien",
        prompt: "Un risque devrait idéalement être lié à…",
        options: [
          {
            value: "processus",
            label: "Un processus du référentiel",
            hint: "Oui — source de vérité.",
          },
          {
            value: "rien",
            label: "Rien — libellé libre suffit",
            hint: "Possible en secours, mais le lien processus est préféré.",
          },
        ],
      },
    ],
  },
  {
    slug: "evaluer-risque",
    titre: "Évaluer un Risque",
    resume:
      "Aide déterministe (P × I) — vous retenez toujours la note finale.",
    etapes: [
      {
        titre: "Ouvrir un risque",
        detail: "Section évaluation inhérente / résiduelle.",
        href: "/risques",
        cta: "Choisir un risque",
      },
      {
        titre: "Utiliser l’aide",
        detail:
          "Répondez aux dimensions d’impact et à la fréquence — acceptez ou ajustez.",
      },
      {
        titre: "Justifier",
        detail: "La justification reste sur la fiche pour les revues suivantes.",
      },
    ],
    questionnaire: [
      {
        id: "decide",
        prompt: "Qui décide de la note finale ?",
        options: [
          {
            value: "humain",
            label: "L’évaluateur humain",
            hint: "Toujours.",
          },
          {
            value: "outil",
            label: "L’outil impose la suggestion",
            hint: "Non — suggestion seulement.",
          },
        ],
      },
      {
        id: "formule",
        prompt: "Criticité inhérente =",
        options: [
          { value: "pi", label: "Probabilité × Impact", hint: "Oui." },
          { value: "sum", label: "Probabilité + Impact", hint: "Non." },
        ],
      },
    ],
  },
  {
    slug: "creer-controle",
    titre: "Créer un Contrôle",
    resume: "Contrôle SCI en réponse à un ou plusieurs risques.",
    etapes: [
      {
        titre: "Inventaire SCI",
        detail: "Fréquence, prochaine échéance, preuves.",
        href: "/controles-sci",
        cta: "Contrôles SCI",
      },
      {
        titre: "Créer le contrôle",
        detail: "Lier aux risques concernés.",
        href: "/controles-sci/nouveau",
        cta: "Nouveau contrôle",
      },
    ],
  },
  {
    slug: "revue-qualite",
    titre: "Revue Qualité",
    resume: "Sur la fiche Processus : fréquence, revue, écarts.",
    etapes: [
      {
        titre: "Ouvrir un processus",
        detail: "Panneau Qualité en bas de fiche.",
        href: "/processus",
        cta: "Processus",
      },
      {
        titre: "Configurer la revue",
        detail: "Responsable, fréquence, lien Confluence, première revue.",
      },
    ],
    questionnaire: [
      {
        id: "ou",
        prompt: "Où documenter une revue qualité ?",
        options: [
          {
            value: "fiche",
            label: "Sur la fiche Processus (panneau Qualité)",
            hint: "Oui.",
          },
          {
            value: "risque",
            label: "Uniquement sur le risque",
            hint: "Non — qualité = processus.",
          },
        ],
      },
    ],
  },
  {
    slug: "documenter-arbitrage",
    titre: "Documenter un Arbitrage",
    resume: "Règle retenue face à une problématique (lien processus / risque).",
    etapes: [
      {
        titre: "Liste des arbitrages",
        href: "/arbitrages",
        cta: "Arbitrages",
        detail: "Statut en vigueur / caduc.",
      },
      {
        titre: "Créer l’arbitrage",
        href: "/arbitrages/nouveau",
        cta: "Nouvel arbitrage",
        detail: "Problématique, règle retenue, justification.",
      },
    ],
  },
  {
    slug: "documenter-decision",
    titre: "Documenter une Décision",
    resume: "Acte daté, décideur, chaînage éventuel avec une décision précédente.",
    etapes: [
      {
        titre: "Inventaire décisions",
        href: "/decisions",
        cta: "Décisions",
        detail: "Suivi du cycle proposé → décidée.",
      },
      {
        titre: "Créer la décision",
        href: "/decisions/nouveau",
        cta: "Nouvelle décision",
        detail: "Texte de décision, date, décideur.",
      },
    ],
  },
  {
    slug: "planning",
    titre: "Planning",
    resume:
      "Planification visuelle ≠ échéance métier. Glisser replanifie sans changer la deadline.",
    etapes: [
      {
        titre: "Dashboard collaborateur",
        detail: "Vue Semaine / 4 semaines / Mois.",
        href: "/",
        cta: "Ma journée",
      },
      {
        titre: "Dashboard responsable",
        detail: "Charge équipe et horizons plus larges.",
        href: "/responsable",
        cta: "Vue responsable",
      },
    ],
    questionnaire: [
      {
        id: "plan",
        prompt: "Déplacer une barre de planning…",
        options: [
          {
            value: "planif",
            label: "Modifie la planification, pas l’échéance",
            hint: "Oui.",
          },
          {
            value: "echeance",
            label: "Change toujours la deadline métier",
            hint: "Non.",
          },
        ],
      },
    ],
  },
  {
    slug: "objectifs",
    titre: "Fixer mes objectifs",
    resume: "Objectifs mesurables reliés à la mission / un axe — SMART léger.",
    etapes: [
      {
        titre: "Voir la stratégie",
        detail: "Mission, vision et axes avant de fixer des objectifs.",
        href: "/strategie",
        cta: "Stratégie",
      },
      {
        titre: "Inventaire Objectifs",
        detail: "Suivre progression et échéances.",
        href: "/objectifs",
        cta: "Objectifs",
      },
      {
        titre: "Créer un objectif",
        href: "/objectifs/nouveau",
        cta: "Nouvel objectif",
        detail: "Indicateur, cible, échéance, axe — pas de gros champs S/M/A/R/T.",
      },
    ],
  },
  {
    slug: "definir-strategie",
    titre: "Définir ma stratégie",
    resume: "Mission → Vision → Axes → Objectifs — sans jargon inutile.",
    etapes: [
      {
        titre: "Formaliser Mission et Vision",
        detail: "Raison d’être permanente + horizon 3–5 ans.",
        href: "/strategie?edit=1",
        cta: "Modifier Stratégie",
      },
      {
        titre: "Créer 3–5 axes",
        detail: "Priorités structurantes (développement, opérations, gouvernance…).",
        href: "/strategie",
        cta: "Axes",
      },
      {
        titre: "Relier des objectifs",
        detail: "Chaque objectif peut porter un axe et un indicateur.",
        href: "/objectifs/nouveau",
        cta: "Nouvel objectif",
      },
    ],
    questionnaire: [
      {
        id: "mission_vs_assurance",
        prompt: "Une « Mission » stratégique, c’est…",
        options: [
          {
            value: "raison",
            label: "La raison d’être permanente de l’organisation",
            hint: "Correct.",
          },
          {
            value: "audit",
            label: "Une mission d’assurance / audit",
            hint: "Non — celle-ci est dans le module Métier.",
          },
        ],
      },
    ],
  },
  {
    slug: "cartographie-risques",
    titre: "Construire ma cartographie des risques",
    resume:
      "Proposer des risques à partir de questions simples — vous confirmez avant création.",
    etapes: [
      {
        titre: "Lister les processus critiques",
        detail: "Sans processus, la cartographie reste abstraite.",
        href: "/processus",
        cta: "Processus",
      },
      {
        titre: "Identifier un risque",
        detail: "Qu’est-ce qui pourrait empêcher d’atteindre un objectif ?",
        href: "/risques/nouveau",
        cta: "Nouveau risque",
      },
      {
        titre: "Évaluer (RiskQuant)",
        detail: "Suggestion → valeur retenue → justification. L’humain décide.",
        href: "/decouvrir/evaluer-risque",
        cta: "Évaluer un risque",
      },
    ],
    questionnaire: [
      {
        id: "dep",
        prompt: "Dépendez-vous d’un fournisseur essentiel ?",
        options: [
          {
            value: "oui",
            label: "Oui — à examiner comme risque opérationnel",
            hint: "Proposition typique : dépendance fournisseur clé.",
          },
          { value: "non", label: "Non" },
        ],
      },
      {
        id: "personne",
        prompt: "Une activité dépend-elle d’une seule personne ?",
        options: [
          {
            value: "oui",
            label: "Oui — risque de concentration de compétences",
            hint: "À confirmer dans Risques, pas créé automatiquement.",
          },
          { value: "non", label: "Non" },
        ],
      },
    ],
  },
  {
    slug: "point-lpd",
    titre: "Faire le point sur la protection des données",
    resume:
      "Points examinés / à compléter / à valider — jamais « vous êtes conforme LPD ».",
    etapes: [
      {
        titre: "Personnes et données",
        detail: "Qui est concerné ? Quelles données ? Quelles finalités ?",
        href: "/guide/bonnes-pratiques",
        cta: "Bonnes pratiques",
      },
      {
        titre: "Prestataires et accès",
        detail: "Destinataires, prestataires, transferts, droits d’accès.",
        href: "/processus",
        cta: "Processus (données perso)",
      },
      {
        titre: "Conservation et incidents",
        detail: "Durées, sécurité, demandes des personnes, violations.",
        href: "/decouvrir/documenter-decision",
        cta: "Documenter une décision",
      },
    ],
    questionnaire: [
      {
        id: "conclusion",
        prompt: "À la fin d’un point LPD, l’outil doit…",
        options: [
          {
            value: "points",
            label: "Lister points examinés / à compléter / à valider",
            hint: "Correct — jamais de conclusion automatique de conformité.",
          },
          {
            value: "conforme",
            label: "Déclarer « vous êtes conforme LPD »",
            hint: "Incorrect — l’humain valide.",
          },
        ],
      },
    ],
  },
  {
    slug: "gouvernance-fondamentaux",
    titre: "Structurer ma gouvernance",
    resume: "Fondamentaux accessibles : décisions, documents, responsabilités.",
    etapes: [
      {
        titre: "Qui fait quoi",
        detail: "Fonctions et responsabilités opérationnelles.",
        href: "/fonctions",
        cta: "Fonctions",
      },
      {
        titre: "Décisions",
        detail: "Mémoire institutionnelle (DEC).",
        href: "/decisions",
        cta: "Décisions",
      },
      {
        titre: "Bonnes pratiques",
        detail: "Bibliothèque — distinguer obligation et bonne pratique.",
        href: "/guide/bonnes-pratiques",
        cta: "Bibliothèque",
      },
    ],
  },
  {
    slug: "fonctions-roles",
    titre: "Fonctions / Rôles",
    resume:
      "Fonction (FCT) = organisation durable ; rôle applicatif = droits dans l’outil.",
    etapes: [
      {
        titre: "Référentiel Fonctions",
        href: "/fonctions",
        cta: "Fonctions",
        detail: "Titulaires / suppléants.",
      },
      {
        titre: "Rôles applicatifs (admin)",
        href: "/administration/roles",
        cta: "Rôles",
        detail: "Matrice de permissions — distinct des FCT.",
      },
    ],
    questionnaire: [
      {
        id: "fct",
        prompt: "Une Fonction FCT sert surtout à…",
        options: [
          {
            value: "org",
            label: "Ancrer responsabilités structurelles (RACI…)",
            hint: "Oui.",
          },
          {
            value: "login",
            label: "Remplacer le compte utilisateur",
            hint: "Non.",
          },
        ],
      },
    ],
  },
];

export function getParcours(slug: string): DecouvrirParcours | undefined {
  return DECOUVRIR_PARCOURS.find((p) => p.slug === slug);
}
