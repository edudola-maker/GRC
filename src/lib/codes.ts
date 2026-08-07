import { prisma } from "@/lib/prisma";

const PREFIXES = {
  PROJET: "PRO",
  CONSEIL: "CNS",
  AUDIT: "AUD",
  RISQUE: "RSK",
  CONTROLE_SCI: "CTL",
  DOCUMENT: "DOC",
} as const;

export type PrefixeCode = keyof typeof PREFIXES;

/** Génère le prochain code stable (ex. PRO-0001). */
export async function nextCode(type: PrefixeCode): Promise<string> {
  const prefixe = PREFIXES[type];
  const row = await prisma.sequenceCode.upsert({
    where: { prefixe },
    create: { prefixe, dernier: 1 },
    update: { dernier: { increment: 1 } },
  });
  return `${prefixe}-${String(row.dernier).padStart(4, "0")}`;
}

export async function assertNomUnique(
  type: PrefixeCode,
  nom: string,
  excludeId?: string,
): Promise<string | null> {
  const n = nom.trim();
  if (!n) return "Le nom est obligatoire.";

  if (type === "PROJET") {
    const existing = await prisma.projet.findFirst({
      where: {
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
        nom: n,
        archive: false,
        ...(excludeId ? { id: { not: excludeId } } : {}),
      },
    });
    if (existing) return "Un document actif porte déjà ce nom.";
  }
  if (type === "AUDIT") {
    const existing = await prisma.audit.findFirst({
      where: {
        titre: n,
        archive: false,
        ...(excludeId ? { id: { not: excludeId } } : {}),
      },
    });
    if (existing) return "Un audit actif porte déjà ce titre.";
  }
  return null;
}
