import { prisma } from "@/lib/prisma";

const PREFIXES = {
  PROJET: "PRO",
  CONSEIL: "CNS",
  MISSION: "MIS",
  RECOMMANDATION: "REC",
  RISQUE: "RSK",
  CONTROLE_SCI: "CTL",
  DOCUMENT: "DOC",
  PROCESSUS: "PRC",
  MACROPROCESSUS: "MAC",
  MODELE_TACHE: "MDL",
  OBJECTIF: "OBJ",
  UNITE: "UNT",
  /// Actifs (référentiel généralisé) — préfixe AIT conservé.
  ACTIF_IT: "AIT",
} as const;

export type PrefixeCode = keyof typeof PREFIXES;

export function prefixeFor(type: PrefixeCode): string {
  return PREFIXES[type];
}

const CODE_PATTERN = /^[A-Z]{2,5}-\d{1,6}$/;

/** Normalise un code saisi (trim, majuscules). */
export function normalizeCode(raw: string): string {
  return raw.trim().toUpperCase().replace(/\s+/g, "");
}

function parseCodeNumber(code: string): number | null {
  const m = normalizeCode(code).match(/-(\d+)$/);
  if (!m) return null;
  return Number.parseInt(m[1]!, 10);
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
  if (!c.startsWith(`${prefix}-`)) {
    return `Le code doit commencer par ${prefix}-.`;
  }
  return null;
}

async function findCodeCollision(
  type: PrefixeCode,
  code: string,
  uniteId: string,
  excludeId?: string,
): Promise<boolean> {
  const c = normalizeCode(code);
  const notId = excludeId ? { id: { not: excludeId } } : {};

  switch (type) {
    case "MISSION":
      return Boolean(
        await prisma.mission.findFirst({ where: { uniteId, code: c, ...notId } }),
      );
    case "PROJET":
      return Boolean(
        await prisma.projet.findFirst({ where: { uniteId, code: c, ...notId } }),
      );
    case "CONSEIL":
      return Boolean(
        await prisma.conseil.findFirst({ where: { uniteId, code: c, ...notId } }),
      );
    case "RISQUE":
      return Boolean(
        await prisma.risque.findFirst({ where: { uniteId, code: c, ...notId } }),
      );
    case "PROCESSUS":
      return Boolean(
        await prisma.processus.findFirst({
          where: { uniteId, code: c, ...notId },
        }),
      );
    case "MACROPROCESSUS":
      return Boolean(
        await prisma.macroprocessus.findFirst({
          where: { uniteId, code: c, ...notId },
        }),
      );
    case "CONTROLE_SCI":
      return Boolean(
        await prisma.controleSCI.findFirst({
          where: { uniteId, code: c, ...notId },
        }),
      );
    case "DOCUMENT":
      return Boolean(
        await prisma.document.findFirst({
          where: { uniteId, code: c, ...notId },
        }),
      );
    case "ACTIF_IT":
      return Boolean(
        await prisma.actifIT.findFirst({
          where: { uniteId, code: c, ...notId },
        }),
      );
    case "MODELE_TACHE":
      return Boolean(
        await prisma.modeleTache.findFirst({
          where: { uniteId, code: c, ...notId },
        }),
      );
    case "RECOMMANDATION":
      return Boolean(
        await prisma.recommandation.findFirst({
          where: { uniteId, code: c, ...notId },
        }),
      );
    case "OBJECTIF":
      return Boolean(
        await prisma.objectif.findFirst({
          where: { uniteId, code: c, ...notId },
        }),
      );
    case "UNITE":
      return Boolean(
        await prisma.unite.findFirst({
          where: { code: c, ...(excludeId ? { id: { not: excludeId } } : {}) },
        }),
      );
    default:
      return false;
  }
}

const UNIQUE_MESSAGES: Partial<Record<PrefixeCode, string>> = {
  MISSION: "Une mission porte déjà ce code.",
  PROJET: "Un projet porte déjà ce code.",
  CONSEIL: "Un conseil porte déjà ce code.",
  RISQUE: "Un risque porte déjà ce code.",
  PROCESSUS: "Un processus porte déjà ce code.",
  MACROPROCESSUS: "Un macroprocessus porte déjà ce code.",
  CONTROLE_SCI: "Un contrôle porte déjà ce code.",
  DOCUMENT: "Un document porte déjà ce code.",
  ACTIF_IT: "Un actif porte déjà ce code.",
  MODELE_TACHE: "Un modèle de tâche porte déjà ce code.",
  RECOMMANDATION: "Une recommandation porte déjà ce code.",
  OBJECTIF: "Un objectif porte déjà ce code.",
  UNITE: "Une unité porte déjà ce code.",
};

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
  if (await findCodeCollision(type, c, uniteId, excludeId)) {
    return UNIQUE_MESSAGES[type] ?? "Ce code est déjà utilisé.";
  }
  return null;
}

/** Propose le prochain code sans consommer la séquence (préremplissage formulaire). */
export async function peekNextCode(
  type: PrefixeCode,
  uniteId: string,
): Promise<string> {
  const prefixe = PREFIXES[type];
  const existing = await prisma.sequenceCode.findUnique({
    where: { uniteId_prefixe: { uniteId, prefixe } },
  });
  const next = (existing?.dernier ?? 0) + 1;
  return `${prefixe}-${String(next).padStart(4, "0")}`;
}

/** Aligne la séquence au moins sur n (après allocation d’un code saisi). */
async function bumpSequenceAtLeast(
  uniteId: string,
  prefixe: string,
  n: number,
): Promise<void> {
  const existing = await prisma.sequenceCode.findUnique({
    where: { uniteId_prefixe: { uniteId, prefixe } },
  });
  if (!existing) {
    await prisma.sequenceCode.create({
      data: { uniteId, prefixe, dernier: n },
    });
    return;
  }
  if (existing.dernier < n) {
    await prisma.sequenceCode.update({
      where: { uniteId_prefixe: { uniteId, prefixe } },
      data: { dernier: n },
    });
  }
}

/**
 * Alloue un code à la création.
 * - Si `requested` est fourni : valide format + unicité, bump séquence si besoin.
 * - Sinon : consomme `nextCode` (incrément atomique SequenceCode).
 * Les relations restent sur les IDs internes — le code n’est jamais clé technique.
 */
export async function allocateCreateCode(
  type: PrefixeCode,
  uniteId: string,
  requested?: string | null,
): Promise<{ ok: true; code: string } | { ok: false; error: string }> {
  const raw = requested?.trim();
  if (!raw) {
    try {
      const code = await nextCode(type, uniteId);
      return { ok: true, code };
    } catch {
      return { ok: false, error: "Impossible d’attribuer un code." };
    }
  }

  const code = normalizeCode(raw);
  const err = await assertCodeUnique(type, code, uniteId);
  if (err) return { ok: false, error: err };

  const n = parseCodeNumber(code);
  if (n != null) {
    await bumpSequenceAtLeast(uniteId, PREFIXES[type], n);
  }
  return { ok: true, code };
}

/** Génère le prochain code stable par unité (ex. PRO-0001). Incrémente la séquence. */
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
  if (type === "ACTIF_IT") {
    const existing = await prisma.actifIT.findFirst({
      where: {
        uniteId,
        nom: n,
        archive: false,
        ...(excludeId ? { id: { not: excludeId } } : {}),
      },
    });
    if (existing) return "Un actif non archivé porte déjà ce nom.";
  }
  return null;
}
