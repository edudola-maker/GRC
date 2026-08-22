/** Sections du rapport Processus (query `?sections=`). */

export const PROCESSUS_REPORT_SECTIONS = [
  "presentation",
  "etapes",
  "raci",
  "risques",
  "controles",
  "arbitrages",
  "conformite",
  "qualite",
  "actifs",
  "continuite",
  "documentation",
] as const;

export type ProcessusReportSection = (typeof PROCESSUS_REPORT_SECTIONS)[number];

export const PROCESSUS_SECTION_LABELS: Record<ProcessusReportSection, string> = {
  presentation: "Présentation",
  etapes: "Étapes",
  raci: "RACI",
  risques: "Risques",
  controles: "Contrôles",
  arbitrages: "Arbitrages",
  conformite: "Conformité",
  qualite: "Qualité",
  actifs: "Actifs",
  continuite: "Continuité",
  documentation: "Documentation",
};

export function parseProcessusSections(
  raw: string | undefined | null,
): Set<ProcessusReportSection> {
  if (!raw || raw.trim() === "" || raw.trim() === "all") {
    return new Set(PROCESSUS_REPORT_SECTIONS);
  }
  const requested = raw
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
  const set = new Set<ProcessusReportSection>();
  for (const key of requested) {
    if ((PROCESSUS_REPORT_SECTIONS as readonly string[]).includes(key)) {
      set.add(key as ProcessusReportSection);
    }
  }
  return set.size > 0 ? set : new Set(PROCESSUS_REPORT_SECTIONS);
}

export function hasSection(
  sections: Set<ProcessusReportSection>,
  key: ProcessusReportSection,
): boolean {
  return sections.has(key);
}
