import { prisma } from "@/lib/prisma";
import { TYPE_OBJET_LABELS } from "@/lib/labels";
import type { TypeObjetMetier } from "@/generated/prisma/client";

export type ObjetRef = {
  type: TypeObjetMetier;
  id: string;
  code: string;
  titre: string;
  href: string;
};

export type LienVue = {
  lienId: string;
  libelle: string | null;
  autre: ObjetRef;
};

function hrefFor(type: TypeObjetMetier, id: string): string {
  switch (type) {
    case "PROJET":
      return `/projets/${id}`;
    case "CONSEIL":
      return `/conseils/${id}`;
    case "MISSION":
      return `/audits/${id}`;
    case "RISQUE":
      return `/risques/${id}`;
    case "CONTROLE_SCI":
      return `/controles-sci/${id}`;
    case "DOCUMENT":
      return `/documents/${id}`;
    case "TACHE":
      return `/taches/${id}`;
    case "PROCESSUS":
      return `/processus/${id}`;
    default:
      return "/";
  }
}

async function resolveObjet(
  uniteId: string,
  type: TypeObjetMetier,
  id: string,
): Promise<ObjetRef | null> {
  switch (type) {
    case "PROJET": {
      const o = await prisma.projet.findFirst({
        where: { id, uniteId },
        select: { id: true, code: true, nom: true },
      });
      return o
        ? { type, id: o.id, code: o.code, titre: o.nom, href: hrefFor(type, o.id) }
        : null;
    }
    case "CONSEIL": {
      const o = await prisma.conseil.findFirst({
        where: { id, uniteId },
        select: { id: true, code: true, objet: true },
      });
      return o
        ? {
            type,
            id: o.id,
            code: o.code,
            titre: o.objet,
            href: hrefFor(type, o.id),
          }
        : null;
    }
    case "MISSION": {
      const o = await prisma.mission.findFirst({
        where: { id, uniteId },
        select: { id: true, code: true, titre: true },
      });
      return o
        ? {
            type,
            id: o.id,
            code: o.code,
            titre: o.titre,
            href: hrefFor(type, o.id),
          }
        : null;
    }
    case "RISQUE": {
      const o = await prisma.risque.findFirst({
        where: { id, uniteId },
        select: { id: true, code: true, nom: true },
      });
      return o
        ? { type, id: o.id, code: o.code, titre: o.nom, href: hrefFor(type, o.id) }
        : null;
    }
    case "CONTROLE_SCI": {
      const o = await prisma.controleSCI.findFirst({
        where: { id, uniteId },
        select: { id: true, code: true, nom: true },
      });
      return o
        ? { type, id: o.id, code: o.code, titre: o.nom, href: hrefFor(type, o.id) }
        : null;
    }
    case "DOCUMENT": {
      const o = await prisma.document.findFirst({
        where: { id, uniteId },
        select: { id: true, code: true, nom: true },
      });
      return o
        ? { type, id: o.id, code: o.code, titre: o.nom, href: hrefFor(type, o.id) }
        : null;
    }
    case "TACHE": {
      const o = await prisma.tache.findFirst({
        where: { id, uniteId },
        select: { id: true, titre: true },
      });
      return o
        ? {
            type,
            id: o.id,
            code: "ACT",
            titre: o.titre,
            href: hrefFor(type, o.id),
          }
        : null;
    }
    case "PROCESSUS": {
      const o = await prisma.processus.findFirst({
        where: { id, uniteId },
        select: { id: true, code: true, nom: true },
      });
      return o
        ? {
            type,
            id: o.id,
            code: o.code,
            titre: o.nom,
            href: hrefFor(type, o.id),
          }
        : null;
    }
    default:
      return null;
  }
}

export async function listLiensFor(
  uniteId: string,
  type: TypeObjetMetier,
  id: string,
): Promise<LienVue[]> {
  const liens = await prisma.lienObjet.findMany({
    where: {
      uniteId,
      OR: [
        { typeA: type, idA: id },
        { typeB: type, idB: id },
      ],
    },
    orderBy: { creeLe: "desc" },
  });

  const out: LienVue[] = [];
  for (const lien of liens) {
    const otherType = lien.typeA === type && lien.idA === id ? lien.typeB : lien.typeA;
    const otherId = lien.typeA === type && lien.idA === id ? lien.idB : lien.idA;
    const autre = await resolveObjet(uniteId, otherType, otherId);
    if (autre) {
      out.push({ lienId: lien.id, libelle: lien.libelle, autre });
    }
  }
  return out;
}

export async function listCandidatsLien(
  uniteId: string,
  typeCible: TypeObjetMetier,
  excludeId?: string,
): Promise<Array<{ id: string; label: string }>> {
  switch (typeCible) {
    case "PROJET": {
      const rows = await prisma.projet.findMany({
        where: { uniteId, archive: false },
        select: { id: true, code: true, nom: true },
        orderBy: { nom: "asc" },
        take: 200,
      });
      return rows
        .filter((r) => r.id !== excludeId)
        .map((r) => ({ id: r.id, label: `${r.code} — ${r.nom}` }));
    }
    case "CONSEIL": {
      const rows = await prisma.conseil.findMany({
        where: { uniteId, archive: false },
        select: { id: true, code: true, objet: true },
        orderBy: { objet: "asc" },
        take: 200,
      });
      return rows
        .filter((r) => r.id !== excludeId)
        .map((r) => ({ id: r.id, label: `${r.code} — ${r.objet}` }));
    }
    case "MISSION": {
      const rows = await prisma.mission.findMany({
        where: { uniteId, archive: false },
        select: { id: true, code: true, titre: true },
        orderBy: { titre: "asc" },
        take: 200,
      });
      return rows
        .filter((r) => r.id !== excludeId)
        .map((r) => ({ id: r.id, label: `${r.code} — ${r.titre}` }));
    }
    case "RISQUE": {
      const rows = await prisma.risque.findMany({
        where: { uniteId, archive: false },
        select: { id: true, code: true, nom: true },
        orderBy: { nom: "asc" },
        take: 200,
      });
      return rows
        .filter((r) => r.id !== excludeId)
        .map((r) => ({ id: r.id, label: `${r.code} — ${r.nom}` }));
    }
    case "CONTROLE_SCI": {
      const rows = await prisma.controleSCI.findMany({
        where: { uniteId, archive: false },
        select: { id: true, code: true, nom: true },
        orderBy: { nom: "asc" },
        take: 200,
      });
      return rows
        .filter((r) => r.id !== excludeId)
        .map((r) => ({ id: r.id, label: `${r.code} — ${r.nom}` }));
    }
    case "DOCUMENT": {
      const rows = await prisma.document.findMany({
        where: { uniteId, archive: false },
        select: { id: true, code: true, nom: true },
        orderBy: { nom: "asc" },
        take: 200,
      });
      return rows
        .filter((r) => r.id !== excludeId)
        .map((r) => ({ id: r.id, label: `${r.code} — ${r.nom}` }));
    }
    case "TACHE": {
      const rows = await prisma.tache.findMany({
        where: { uniteId, statut: { not: "TERMINE" } },
        select: { id: true, titre: true },
        orderBy: { titre: "asc" },
        take: 200,
      });
      return rows
        .filter((r) => r.id !== excludeId)
        .map((r) => ({ id: r.id, label: r.titre }));
    }
    case "PROCESSUS": {
      const rows = await prisma.processus.findMany({
        where: { uniteId, archive: false },
        select: { id: true, code: true, nom: true },
        orderBy: { nom: "asc" },
        take: 200,
      });
      return rows
        .filter((r) => r.id !== excludeId)
        .map((r) => ({ id: r.id, label: `${r.code} — ${r.nom}` }));
    }
    default:
      return [];
  }
}

export { TYPE_OBJET_LABELS };
