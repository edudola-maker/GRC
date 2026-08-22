import { prisma } from "@/lib/prisma";

export type RechercheType =
  | "projet"
  | "mission"
  | "conseil"
  | "processus"
  | "risque"
  | "controle"
  | "actif"
  | "fonction"
  | "decision"
  | "arbitrage"
  | "exigence"
  | "document";

export type RechercheHit = {
  type: RechercheType;
  id: string;
  code: string;
  titre: string;
  href: string;
  meta?: string;
};

const TYPE_LABELS: Record<RechercheType, string> = {
  projet: "Projet",
  mission: "Mission",
  conseil: "Conseil",
  processus: "Processus",
  risque: "Risque",
  controle: "Contrôle SCI",
  actif: "Actif",
  fonction: "Fonction",
  decision: "Décision",
  arbitrage: "Arbitrage",
  exigence: "Exigence",
  document: "Document",
};

export function labelTypeRecherche(t: RechercheType): string {
  return TYPE_LABELS[t];
}

function contains(hay: string | null | undefined, needle: string): boolean {
  if (!hay) return false;
  return hay.toLowerCase().includes(needle);
}

/**
 * Recherche déterministe simple (code + titre/nom) dans l’unité courante.
 * Pas de full-text / IA — limite volontairement basse pour rester lisible.
 */
export async function rechercherGlobal(
  uniteId: string,
  rawQuery: string,
  limitPerType = 8,
): Promise<RechercheHit[]> {
  const q = rawQuery.trim().toLowerCase();
  if (q.length < 1) return [];

  const [
    projets,
    missions,
    conseils,
    processus,
    risques,
    controles,
    actifs,
    fonctions,
    decisions,
    arbitrages,
    exigences,
    documents,
  ] = await Promise.all([
    prisma.projet.findMany({
      where: { uniteId, archive: false },
      select: { id: true, code: true, nom: true, statut: true },
      orderBy: { code: "asc" },
      take: 200,
    }),
    prisma.mission.findMany({
      where: { uniteId, archive: false },
      select: { id: true, code: true, titre: true, statut: true },
      orderBy: { code: "asc" },
      take: 200,
    }),
    prisma.conseil.findMany({
      where: { uniteId, archive: false },
      select: { id: true, code: true, objet: true, statut: true },
      orderBy: { code: "asc" },
      take: 200,
    }),
    prisma.processus.findMany({
      where: {
        archive: false,
        OR: [
          { uniteId },
          { unitesApplicables: { some: { uniteId } } },
        ],
      },
      select: { id: true, code: true, nom: true, statut: true },
      orderBy: { code: "asc" },
      take: 200,
    }),
    prisma.risque.findMany({
      where: { uniteId, archive: false },
      select: { id: true, code: true, nom: true, statut: true },
      orderBy: { code: "asc" },
      take: 200,
    }),
    prisma.controleSCI.findMany({
      where: { uniteId, archive: false },
      select: { id: true, code: true, nom: true, statut: true },
      orderBy: { code: "asc" },
      take: 200,
    }),
    prisma.actifIT.findMany({
      where: { uniteId, archive: false },
      select: { id: true, code: true, nom: true, statut: true },
      orderBy: { code: "asc" },
      take: 200,
    }),
    prisma.fonction.findMany({
      where: { uniteId, archive: false },
      select: { id: true, code: true, nom: true, actif: true },
      orderBy: { code: "asc" },
      take: 200,
    }),
    prisma.decision.findMany({
      where: { uniteId, archive: false },
      select: { id: true, code: true, titre: true, statut: true },
      orderBy: { code: "asc" },
      take: 200,
    }),
    prisma.arbitrage.findMany({
      where: { uniteId, archive: false },
      select: { id: true, code: true, titre: true, statut: true },
      orderBy: { code: "asc" },
      take: 200,
    }),
    prisma.exigence.findMany({
      where: { uniteId, archive: false },
      select: { id: true, code: true, titre: true, statut: true },
      orderBy: { code: "asc" },
      take: 200,
    }),
    prisma.document.findMany({
      where: { uniteId, archive: false },
      select: { id: true, code: true, nom: true, statut: true },
      orderBy: { code: "asc" },
      take: 200,
    }),
  ]);

  const hits: RechercheHit[] = [];

  const push = (
    type: RechercheType,
    rows: { id: string; code: string; titre: string; meta?: string }[],
    hrefOf: (id: string) => string,
  ) => {
    let n = 0;
    for (const r of rows) {
      if (!contains(r.code, q) && !contains(r.titre, q)) continue;
      hits.push({
        type,
        id: r.id,
        code: r.code,
        titre: r.titre,
        href: hrefOf(r.id),
        meta: r.meta,
      });
      n += 1;
      if (n >= limitPerType) break;
    }
  };

  push(
    "projet",
    projets.map((p) => ({
      id: p.id,
      code: p.code,
      titre: p.nom,
      meta: p.statut,
    })),
    (id) => `/projets/${id}`,
  );
  push(
    "mission",
    missions.map((m) => ({
      id: m.id,
      code: m.code,
      titre: m.titre,
      meta: m.statut,
    })),
    (id) => `/missions/${id}`,
  );
  push(
    "conseil",
    conseils.map((c) => ({
      id: c.id,
      code: c.code,
      titre: c.objet,
      meta: c.statut,
    })),
    (id) => `/conseils/${id}`,
  );
  push(
    "processus",
    processus.map((p) => ({
      id: p.id,
      code: p.code,
      titre: p.nom,
      meta: p.statut,
    })),
    (id) => `/processus/${id}`,
  );
  push(
    "risque",
    risques.map((r) => ({
      id: r.id,
      code: r.code,
      titre: r.nom,
      meta: r.statut,
    })),
    (id) => `/risques/${id}`,
  );
  push(
    "controle",
    controles.map((c) => ({
      id: c.id,
      code: c.code,
      titre: c.nom,
      meta: c.statut,
    })),
    (id) => `/controles-sci/${id}`,
  );
  push(
    "actif",
    actifs.map((a) => ({
      id: a.id,
      code: a.code,
      titre: a.nom,
      meta: a.statut,
    })),
    (id) => `/actifs-it/${id}`,
  );
  push(
    "fonction",
    fonctions.map((f) => ({
      id: f.id,
      code: f.code,
      titre: f.nom,
      meta: f.actif ? "active" : "inactive",
    })),
    (id) => `/fonctions/${id}`,
  );
  push(
    "decision",
    decisions.map((d) => ({
      id: d.id,
      code: d.code,
      titre: d.titre,
      meta: d.statut,
    })),
    (id) => `/decisions/${id}`,
  );
  push(
    "arbitrage",
    arbitrages.map((a) => ({
      id: a.id,
      code: a.code,
      titre: a.titre,
      meta: a.statut,
    })),
    (id) => `/arbitrages/${id}`,
  );
  push(
    "exigence",
    exigences.map((e) => ({
      id: e.id,
      code: e.code,
      titre: e.titre,
      meta: e.statut,
    })),
    (id) => `/exigences/${id}`,
  );
  push(
    "document",
    documents.map((d) => ({
      id: d.id,
      code: d.code,
      titre: d.nom,
      meta: d.statut,
    })),
    (id) => `/documents/${id}`,
  );

  return hits;
}
