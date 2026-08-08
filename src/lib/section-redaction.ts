import type {
  EtatSectionRedaction,
  TypeObjetMetier,
} from "@/generated/prisma/client";
import { formatDateDot } from "@/lib/labels";
import { deriveInitiales } from "@/lib/initiales";
import { prisma } from "@/lib/prisma";

export type SectionRedactionVue = {
  sectionKey: string;
  etat: EtatSectionRedaction;
  contenuVersion: number;
  modifieLe: Date;
  modifiePar: { nom: string; initiales: string | null };
};

export async function listSectionRedactions(
  typeObjet: TypeObjetMetier,
  objetId: string,
): Promise<Map<string, SectionRedactionVue>> {
  const rows = await prisma.sectionRedaction.findMany({
    where: { typeObjet, objetId },
    include: {
      modifiePar: { select: { nom: true, initiales: true } },
    },
  });
  return new Map(
    rows.map((r) => [
      r.sectionKey,
      {
        sectionKey: r.sectionKey,
        etat: r.etat,
        contenuVersion: r.contenuVersion,
        modifieLe: r.modifieLe,
        modifiePar: r.modifiePar,
      },
    ]),
  );
}

export async function markSectionRedaction(params: {
  uniteId: string;
  typeObjet: TypeObjetMetier;
  objetId: string;
  sectionKey: string;
  etat: EtatSectionRedaction;
  modifieParId: string;
  /** Si true, incrémente contenuVersion (finalisation ou invalidation). */
  bumpVersion?: boolean;
}): Promise<void> {
  const existing = await prisma.sectionRedaction.findUnique({
    where: {
      typeObjet_objetId_sectionKey: {
        typeObjet: params.typeObjet,
        objetId: params.objetId,
        sectionKey: params.sectionKey,
      },
    },
  });

  const nextVersion = existing
    ? params.bumpVersion
      ? existing.contenuVersion + 1
      : existing.contenuVersion
    : 1;

  await prisma.sectionRedaction.upsert({
    where: {
      typeObjet_objetId_sectionKey: {
        typeObjet: params.typeObjet,
        objetId: params.objetId,
        sectionKey: params.sectionKey,
      },
    },
    create: {
      uniteId: params.uniteId,
      typeObjet: params.typeObjet,
      objetId: params.objetId,
      sectionKey: params.sectionKey,
      etat: params.etat,
      contenuVersion: 1,
      modifieParId: params.modifieParId,
    },
    update: {
      etat: params.etat,
      contenuVersion: nextVersion,
      modifieParId: params.modifieParId,
    },
  });
}

export function parseSaveIntent(
  formData: FormData,
): "brouillon" | "finaliser" {
  const raw = String(formData.get("intent") ?? "finaliser");
  return raw === "brouillon" ? "brouillon" : "finaliser";
}

export function etatFromIntent(
  intent: "brouillon" | "finaliser",
): EtatSectionRedaction {
  return intent === "brouillon" ? "BROUILLON" : "FINALISE";
}

/** Badge consultation : « Brouillon — JD — 08.08.2026 » */
export function formatSectionEtatBadge(
  redaction: SectionRedactionVue | undefined,
): string | null {
  if (!redaction || redaction.etat !== "BROUILLON") return null;
  const initials =
    redaction.modifiePar.initiales?.trim() ||
    deriveInitiales(redaction.modifiePar.nom);
  return `Brouillon — ${initials} — ${formatDateDot(redaction.modifieLe)}`;
}

export function formatSectionEtatLabel(
  redaction: SectionRedactionVue | undefined,
): string | null {
  if (!redaction) return null;
  switch (redaction.etat) {
    case "BROUILLON":
      return formatSectionEtatBadge(redaction);
    case "A_VALIDER":
      return "À valider";
    case "VALIDE":
      return `Validé (v${redaction.contenuVersion})`;
    case "OBSOLETE":
      return "Visa obsolète — à revalider";
    case "FINALISE":
      return null;
    default:
      return null;
  }
}
