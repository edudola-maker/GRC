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
    titre: "Objectifs",
    resume: "Objectifs d’unité / collaborateurs, critères SMART, attributions.",
    etapes: [
      {
        titre: "Mon unité",
        detail: "Objectifs annuels et attributions.",
        href: "/unite",
        cta: "Mon unité",
      },
      {
        titre: "Créer un objectif",
        href: "/objectifs/nouveau",
        cta: "Nouvel objectif",
        detail: "SMART, mode de progression, liens attributions.",
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
