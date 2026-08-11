import type { EtatSectionRedaction } from "@/generated/prisma/client";
import type { SectionRedactionVue } from "@/lib/section-redaction";

/** Les 5 étapes du cockpit Mission (hors vue d’ensemble). */
export const MISSION_ETAPES = [
  {
    key: "PLANIFICATION",
    slug: "planification",
    ordre: 1,
    title: "Planification",
    question: "Sommes-nous prêts à démarrer ?",
  },
  {
    key: "SUBSTANTIF",
    slug: "substantif",
    ordre: 2,
    title: "Substantif",
    question: "Qu’avons-nous observé / analysé ?",
  },
  {
    key: "RECOMMANDATIONS",
    slug: "recommandations",
    ordre: 3,
    title: "Recommandations",
    question: "Que demandons-nous de corriger / améliorer ?",
  },
  {
    key: "RAPPORT",
    slug: "rapport",
    ordre: 4,
    title: "Rapport",
    question: "Quelle restitution formalisée ?",
  },
  {
    key: "SUIVI",
    slug: "suivi",
    ordre: 5,
    title: "Suivi",
    question: "Les recommandations avancent-elles ?",
  },
] as const;

export type MissionEtapeKey = (typeof MISSION_ETAPES)[number]["key"];
export type MissionEtapeSlug = (typeof MISSION_ETAPES)[number]["slug"];

export type MissionEtapeProgressEtat =
  | "NON_COMMENCE"
  | "EN_COURS"
  | "A_VALIDER"
  | "TERMINE";

export const MISSION_ETAPE_PROGRESS_LABELS: Record<
  MissionEtapeProgressEtat,
  string
> = {
  NON_COMMENCE: "Non commencé",
  EN_COURS: "En cours",
  A_VALIDER: "À valider",
  TERMINE: "Validé / Terminé",
};

const RECO_STATUTS_CLOS = new Set(["CLOTUREE", "ANNULEE"]);

export function isMissionEtapeSlug(raw: string): raw is MissionEtapeSlug {
  return MISSION_ETAPES.some((e) => e.slug === raw);
}

export function etapeBySlug(slug: MissionEtapeSlug) {
  return MISSION_ETAPES.find((e) => e.slug === slug)!;
}

export function etapeByKey(key: MissionEtapeKey) {
  return MISSION_ETAPES.find((e) => e.key === key)!;
}

/** Href d’une étape (ou cockpit si slug null). */
export function missionEtapeHref(
  missionId: string,
  slug: MissionEtapeSlug | null,
  opts?: { edit?: string },
) {
  const base = slug
    ? `/missions/${missionId}/${slug}`
    : `/missions/${missionId}`;
  if (opts?.edit) return `${base}?edit=${opts.edit}`;
  return base;
}

/** Map sectionKey → slug pour les redirects d’actions. */
export function slugFromSectionKey(sectionKey: string): MissionEtapeSlug | null {
  const found = MISSION_ETAPES.find((e) => e.key === sectionKey);
  return found?.slug ?? null;
}

/**
 * États métier lisibles — pas de % artificiel.
 * Mapping SectionRedaction → progression d’étape.
 */
export function progressEtatFromRedaction(
  redaction: SectionRedactionVue | undefined,
): MissionEtapeProgressEtat {
  if (!redaction) return "NON_COMMENCE";
  switch (redaction.etat as EtatSectionRedaction) {
    case "BROUILLON":
    case "OBSOLETE":
      return "EN_COURS";
    case "A_VALIDER":
      return "A_VALIDER";
    case "FINALISE":
    case "VALIDE":
      return "TERMINE";
    default:
      return "EN_COURS";
  }
}

export type MissionEtapeMetricsInput = {
  checklistPlanif: { total: number; faits: number };
  /** Placeholders souples — enrichis progressivement. */
  papiersTravail: number;
  constats: number;
  recommandations: { total: number; aValiderSection: boolean; ouvertes: number };
  suivi: { total: number; cloturees: number };
};

export type MissionEtapeVue = {
  key: MissionEtapeKey;
  slug: MissionEtapeSlug;
  ordre: number;
  title: string;
  question: string;
  href: string;
  progressEtat: MissionEtapeProgressEtat;
  progressLabel: string;
  /** Métrique complémentaire lisible (pas un % sauf Suivi). */
  metric: string | null;
};

export function buildMissionEtapesVue(
  missionId: string,
  redactions: Map<string, SectionRedactionVue>,
  metrics: MissionEtapeMetricsInput,
): MissionEtapeVue[] {
  return MISSION_ETAPES.map((etape) => {
    const progressEtat = progressEtatFromRedaction(redactions.get(etape.key));
    return {
      key: etape.key,
      slug: etape.slug,
      ordre: etape.ordre,
      title: etape.title,
      question: etape.question,
      href: missionEtapeHref(missionId, etape.slug),
      progressEtat,
      progressLabel: MISSION_ETAPE_PROGRESS_LABELS[progressEtat],
      metric: metricForEtape(etape.key, metrics),
    };
  });
}

function metricForEtape(
  key: MissionEtapeKey,
  m: MissionEtapeMetricsInput,
): string | null {
  switch (key) {
    case "PLANIFICATION": {
      const { total, faits } = m.checklistPlanif;
      if (total === 0) return null;
      return `${faits}/${total} éléments de checklist`;
    }
    case "SUBSTANTIF": {
      const parts: string[] = [];
      if (m.papiersTravail > 0) {
        parts.push(
          `${m.papiersTravail} papier${m.papiersTravail > 1 ? "s" : ""} de travail`,
        );
      }
      if (m.constats > 0) {
        parts.push(`${m.constats} constat${m.constats > 1 ? "s" : ""}`);
      }
      return parts.length ? parts.join(" · ") : null;
    }
    case "RECOMMANDATIONS": {
      if (m.recommandations.total === 0) return null;
      const parts = [
        `${m.recommandations.total} recommandation${m.recommandations.total > 1 ? "s" : ""}`,
      ];
      if (m.recommandations.aValiderSection) {
        parts.push("section à valider");
      } else if (m.recommandations.ouvertes > 0) {
        parts.push(`${m.recommandations.ouvertes} ouverte${m.recommandations.ouvertes > 1 ? "s" : ""}`);
      }
      return parts.join(" · ");
    }
    case "RAPPORT":
      return null;
    case "SUIVI": {
      const { total, cloturees } = m.suivi;
      if (total === 0) return null;
      const pct = Math.round((cloturees / total) * 100);
      return `${cloturees}/${total} clôturées (${pct} %)`;
    }
    default:
      return null;
  }
}

export function metricsFromMissionData(data: {
  checklistItems: { sectionKey: string; fait: boolean }[];
  recommandations: { statut: string }[];
  redactions: Map<string, SectionRedactionVue>;
  /** Futurs objets — Phase 1 à 0. */
  papiersTravailCount?: number;
  constatsCount?: number;
}): MissionEtapeMetricsInput {
  const checklist = data.checklistItems.filter(
    (c) => c.sectionKey === "PLANIFICATION",
  );
  const recos = data.recommandations;
  const cloturees = recos.filter((r) => RECO_STATUTS_CLOS.has(r.statut)).length;
  const ouvertes = recos.length - cloturees;
  return {
    checklistPlanif: {
      total: checklist.length,
      faits: checklist.filter((c) => c.fait).length,
    },
    papiersTravail: data.papiersTravailCount ?? 0,
    constats: data.constatsCount ?? 0,
    recommandations: {
      total: recos.length,
      aValiderSection:
        data.redactions.get("RECOMMANDATIONS")?.etat === "A_VALIDER",
      ouvertes,
    },
    suivi: { total: recos.length, cloturees },
  };
}

/** Première étape non terminée — guidance cockpit (pas de blocage). */
export function etapeCouranteRecommandee(
  etapes: MissionEtapeVue[],
): MissionEtapeVue | null {
  return etapes.find((e) => e.progressEtat !== "TERMINE") ?? null;
}

export { RECO_STATUTS_CLOS };
