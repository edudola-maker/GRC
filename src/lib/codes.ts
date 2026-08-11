import { prisma } from "@/lib/prisma";

const PREFIXES = {
  PROJET: "PRO",
  CONSEIL: "CNS",
  MISSION: "MIS",
  RECOMMANDATION: "REC",
  RISQUE: "RIS",
  CONTROLE_SCI: "CTL",
  DOCUMENT: "DOC",
  PROCESSUS: "PRC",
  MODELE_TACHE: "MDL",
  OBJECTIF: "OBJ",
  UNITE: "UNT",
} as const;

export type PrefixeCode = keyof typeof PREFIXES;

const CODE_PATTERN = /^[A-Z]{2,5}-\d{1,6}$/;

/** Normalise un code saisi (trim, majuscules). */
export function normalizeCode(raw: string): string {
  return raw.trim().toUpperCase().replace(/\s+/g, "");
}

/** Valide le format PREFIXE-nnnn (ex. MIS-0001). */
export function assertCodeFormat(
  type: PrefixeCode,
  code: string,
): string | null {
  const c = normalizeCode(code);
  if (!c) return "Le code est obligatoire.";
  if (!CODE_PATTERN.test(c)) {
    return `Format de code invalide (attendu : ${PREFIXES[type]}-0001).`;
  }
  const prefix = PREFIXES[type];
  // Legacy RISQUE : RSK-xxxx encore accepté à l’édition.
  if (type === "RISQUE") {
    if (!c.startsWith("RIS-") && !c.startsWith("RSK-")) {
      return "Le code doit commencer par RIS- (ou RSK- pour les codes existants).";
    }
    return null;
  }
  if (!c.startsWith(`${prefix}-`)) {
    return `Le code doit commencer par ${prefix}-.`;
  }
  return null;
}

/** Unicité du code dans l’unité (hors excludeId). */
export async function assertCodeUnique(
  type: PrefixeCode,
  code: string,
  uniteId: string,
  excludeId?: string,
): Promise<string | null> {
  const c = normalizeCode(code);
  const formatErr = assertCodeFormat(type, c);
  if (formatErr) return formatErr;

  if (type === "MISSION") {
    const existing = await prisma.mission.findFirst({
      where: {
        uniteId,
        code: c,
        ...(excludeId ? { id: { not: excludeId } } : {}),
      },
    });
    if (existing) return "Une mission porte déjà ce code.";
  }
  if (type === "PROJET") {
    const existing = await prisma.projet.findFirst({
      where: {
        uniteId,
        code: c,
        ...(excludeId ? { id: { not: excludeId } } : {}),
      },
    });
    if (existing) return "Un projet porte déjà ce code.";
  }
  if (type === "RISQUE") {
    const existing = await prisma.risque.findFirst({
      where: {
        uniteId,
        code: c,
        ...(excludeId ? { id: { not: excludeId } } : {}),
      },
    });
    if (existing) return "Un risque porte déjà ce code.";
  }
  if (type === "PROCESSUS") {
    const existing = await prisma.processus.findFirst({
      where: {
        uniteId,
        code: c,
        ...(excludeId ? { id: { not: excludeId } } : {}),
      },
    });
    if (existing) return "Un processus porte déjà ce code.";
  }
  return null;
}

/** Génère le prochain code stable par unité (ex. PRO-0001). */
export async function nextCode(
  type: PrefixeCode,
  uniteId: string,
): Promise<string> {
  const prefixe = PREFIXES[type];
  const existing = await prisma.sequenceCode.findUnique({
    where: { uniteId_prefixe: { uniteId, prefixe } },
  });
  if (!existing) {
    await prisma.sequenceCode.create({
      data: { uniteId, prefixe, dernier: 1 },
    });
    return `${prefixe}-0001`;
  }
  const row = await prisma.sequenceCode.update({
    where: { uniteId_prefixe: { uniteId, prefixe } },
    data: { dernier: { increment: 1 } },
  });
  return `${prefixe}-${String(row.dernier).padStart(4, "0")}`;
}

export async function assertNomUnique(
  type: PrefixeCode,
  nom: string,
  uniteId: string,
  excludeId?: string,
): Promise<string | null> {
  const n = nom.trim();
  if (!n) return "Le nom est obligatoire.";

  if (type === "PROJET") {
    const existing = await prisma.projet.findFirst({
      where: {
        uniteId,
        nom: n,
        archive: false,
        ...(excludeId ? { id: { not: excludeId } } : {}),
      },
    });
    if (existing) return "Un projet actif porte déjà ce nom.";
  }
  if (type === "CONSEIL") {
    const existing = await prisma.conseil.findFirst({
      where: {
        uniteId,
        objet: n,
        archive: false,
        ...(excludeId ? { id: { not: excludeId } } : {}),
      },
    });
    if (existing) return "Un conseil actif porte déjà cet objet.";
  }
  if (type === "RISQUE") {
    const existing = await prisma.risque.findFirst({
      where: {
        uniteId,
        nom: n,
        archive: false,
        ...(excludeId ? { id: { not: excludeId } } : {}),
      },
    });
    if (existing) return "Un risque actif porte déjà ce nom.";
  }
  if (type === "CONTROLE_SCI") {
    const existing = await prisma.controleSCI.findFirst({
      where: {
        uniteId,
        nom: n,
        archive: false,
        ...(excludeId ? { id: { not: excludeId } } : {}),
      },
    });
    if (existing) return "Un contrôle actif porte déjà ce nom.";
  }
  if (type === "DOCUMENT") {
    const existing = await prisma.document.findFirst({
      where: {
        uniteId,
        nom: n,
        archive: false,
        ...(excludeId ? { id: { not: excludeId } } : {}),
      },
    });
    if (existing) return "Un document actif porte déjà ce nom.";
  }
  if (type === "MISSION") {
    const existing = await prisma.mission.findFirst({
      where: {
        uniteId,
        titre: n,
        archive: false,
        ...(excludeId ? { id: { not: excludeId } } : {}),
      },
    });
    if (existing) return "Une mission active porte déjà ce titre.";
  }
  if (type === "PROCESSUS") {
    const existing = await prisma.processus.findFirst({
      where: {
        uniteId,
        nom: n,
        archive: false,
        ...(excludeId ? { id: { not: excludeId } } : {}),
      },
    });
    if (existing) return "Un processus actif porte déjà ce nom.";
  }
  if (type === "MODELE_TACHE") {
    const existing = await prisma.modeleTache.findFirst({
      where: {
        uniteId,
        nom: n,
        actif: true,
        ...(excludeId ? { id: { not: excludeId } } : {}),
      },
    });
    if (existing) return "Un modèle de tâche actif porte déjà ce nom.";
  }
  if (type === "OBJECTIF") {
    const existing = await prisma.objectif.findFirst({
      where: {
        uniteId,
        intitule: n,
        statut: { not: "ABANDONNE" },
        ...(excludeId ? { id: { not: excludeId } } : {}),
      },
    });
    if (existing) return "Un objectif actif porte déjà cet intitulé.";
  }
  if (type === "UNITE") {
    const existing = await prisma.unite.findFirst({
      where: {
        nom: n,
        actif: true,
        ...(excludeId ? { id: { not: excludeId } } : {}),
      },
    });
    if (existing) return "Une unité active porte déjà ce nom.";
  }
  return null;
}
