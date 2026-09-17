/**
 * Diagnostic initial d’onboarding — questions courtes, propositions (jamais de création silencieuse).
 */

export type DiagnosticQuestion = {
  id: string;
  prompt: string;
  options: { value: string; label: string }[];
};

export type DiagnosticProposition = {
  id: string;
  titre: string;
  detail: string;
  statut: "A_FAIRE" | "EN_COURS" | "STRUCTURE" | "A_REVOIR";
  href: string;
  cta: string;
};

export const DIAGNOSTIC_QUESTIONS: DiagnosticQuestion[] = [
  {
    id: "taille",
    prompt: "Quelle est la taille approximative de votre organisation ?",
    options: [
      { value: "micro", label: "1–9 personnes" },
      { value: "pme", label: "10–49 personnes" },
      { value: "structuree", label: "50+ ou plusieurs unités" },
    ],
  },
  {
    id: "collaborateurs",
    prompt: "Avez-vous des collaborateurs ?",
    options: [
      { value: "oui", label: "Oui" },
      { value: "non", label: "Non / indépendant" },
    ],
  },
  {
    id: "fournisseur",
    prompt: "Dépendez-vous d’un fournisseur ou prestataire essentiel ?",
    options: [
      { value: "oui", label: "Oui" },
      { value: "non", label: "Non" },
      { value: "nsp", label: "Je ne sais pas encore" },
    ],
  },
  {
    id: "si",
    prompt: "Utilisez-vous des systèmes informatiques critiques ?",
    options: [
      { value: "oui", label: "Oui" },
      { value: "non", label: "Peu / non" },
    ],
  },
  {
    id: "donnees",
    prompt: "Traitez-vous des données personnelles (clients, RH…) ?",
    options: [
      { value: "oui", label: "Oui" },
      { value: "non", label: "Non" },
      { value: "nsp", label: "À clarifier" },
    ],
  },
  {
    id: "personne_cle",
    prompt: "Une activité dépend-elle d’une seule personne ?",
    options: [
      { value: "oui", label: "Oui" },
      { value: "non", label: "Non" },
      { value: "nsp", label: "Pas sûr" },
    ],
  },
];

export function propositionsFromAnswers(
  answers: Record<string, string>,
): DiagnosticProposition[] {
  const props: DiagnosticProposition[] = [
    {
      id: "mission",
      titre: "Définir votre Mission",
      detail: "Formaliser pourquoi l’organisation existe.",
      statut: "A_FAIRE",
      href: "/strategie?edit=1",
      cta: "Ouvrir Stratégie",
    },
    {
      id: "vision",
      titre: "Définir votre Vision",
      detail: "Où voulez-vous être dans 3 à 5 ans ?",
      statut: "A_FAIRE",
      href: "/strategie?edit=1",
      cta: "Ouvrir Stratégie",
    },
    {
      id: "objectifs",
      titre: "Choisir 3–5 Objectifs",
      detail: "Objectifs mesurables reliés à un axe.",
      statut: "A_FAIRE",
      href: "/decouvrir/objectifs",
      cta: "Parcours Objectifs",
    },
    {
      id: "processus",
      titre: "Identifier vos Processus",
      detail: "Quelques processus critiques suffisent pour démarrer.",
      statut: "A_FAIRE",
      href: "/decouvrir/documenter-processus",
      cta: "Parcours Processus",
    },
  ];

  if (answers.fournisseur === "oui" || answers.personne_cle === "oui" || answers.si === "oui") {
    props.push({
      id: "risques",
      titre: "Identifier vos Risques majeurs",
      detail: "Ce qui pourrait empêcher d’atteindre vos objectifs.",
      statut: "A_FAIRE",
      href: "/decouvrir/cartographie-risques",
      cta: "Construire ma cartographie",
    });
  }

  if (answers.si === "oui") {
    props.push({
      id: "controles",
      titre: "Définir les premiers Contrôles",
      detail: "Contrôles simples sur les accès et les opérations critiques.",
      statut: "A_FAIRE",
      href: "/decouvrir/creer-controle",
      cta: "Parcours Contrôles",
    });
  }

  if (answers.donnees === "oui" || answers.donnees === "nsp") {
    props.push({
      id: "lpd",
      titre: "Faire le point LPD",
      detail: "Points examinés — jamais de conclusion automatique de conformité.",
      statut: "A_REVOIR",
      href: "/decouvrir/point-lpd",
      cta: "Parcours LPD",
    });
  }

  props.push({
    id: "projets",
    titre: "Identifier les Projets d’amélioration",
    detail: "Transformer les écarts en actions suivies.",
    statut: "A_FAIRE",
    href: "/decouvrir/creer-projet",
    cta: "Parcours Projet",
  });

  return props;
}

export const STATUT_DIAG_LABELS: Record<
  DiagnosticProposition["statut"],
  string
> = {
  A_FAIRE: "À faire",
  EN_COURS: "En cours",
  STRUCTURE: "Structuré",
  A_REVOIR: "À revoir",
};
