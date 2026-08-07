import { PageHeader, BtnLink } from "@/components/ui";
import { FlashBanner } from "@/components/Flash";
import { ModuleHelp } from "@/components/ModuleHelp";
import { AttentionZone } from "@/components/module/AttentionZone";
import { KpiStat, KpiZone } from "@/components/module/KpiZone";
import {
  DocumentInventory,
  type DocumentInventoryItem,
} from "@/components/documents/DocumentInventory";
import { MODULE_HELP } from "@/lib/catalog";
import {
  FREQUENCE_REVUE_LABELS,
  STATUT_DOCUMENT_LABELS,
  TYPE_DOCUMENT_LABELS,
  addDays,
  formatDateDot,
  startOfToday,
  urgenceEcheance,
} from "@/lib/labels";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";

export const dynamic = "force-dynamic";

const DOC_STATUTS_CLOS = ["OBSOLETE", "ARCHIVE"] as const;

export default async function DocumentsPage({
  searchParams,
}: {
  searchParams: Promise<{ ok?: string; erreur?: string }>;
}) {
  const sp = await searchParams;
  const today = startOfToday();
  const dans30j = addDays(today, 30);
  const user = await getCurrentUser();
  const uniteId = user.uniteId;

  const [documents, inventorie, revuesProchaines, enRetard, enVigueur] =
    await Promise.all([
      prisma.document.findMany({
        where: { uniteId },
        include: {
          responsable: true,
          _count: { select: { tachesRevue: true } },
        },
        orderBy: [{ prochaineRevue: "asc" }, { nom: "asc" }],
      }),
      prisma.document.count({ where: { uniteId, archive: false } }),
      prisma.document.count({
        where: {
          uniteId,
          archive: false,
          prochaineRevue: { gte: today, lte: dans30j },
        },
      }),
      prisma.document.count({
        where: {
          uniteId,
          archive: false,
          prochaineRevue: { lt: today },
        },
      }),
      prisma.document.count({
        where: { uniteId, archive: false, statut: "EN_VIGUEUR" },
      }),
    ]);

  const items: DocumentInventoryItem[] = documents.map((d) => {
    const clos = (DOC_STATUTS_CLOS as readonly string[]).includes(d.statut);
    const estActif = !clos && !d.archive;
    const estRetard = Boolean(
      estActif && d.prochaineRevue && d.prochaineRevue < today,
    );
    return {
      id: d.id,
      code: d.code,
      nom: d.nom,
      typeLabel: TYPE_DOCUMENT_LABELS[d.typeDocument] ?? d.typeDocument,
      version: d.version,
      statut: d.statut,
      statutLabel: STATUT_DOCUMENT_LABELS[d.statut] ?? d.statut,
      frequenceLabel: d.frequenceRevue
        ? (FREQUENCE_REVUE_LABELS[d.frequenceRevue] ?? d.frequenceRevue)
        : null,
      responsableId: d.responsableId,
      responsableNom: d.responsable?.nom ?? "—",
      tags: d.tags,
      prochaineRevue: d.prochaineRevue?.toISOString() ?? null,
      nbTachesRevue: d._count.tachesRevue,
      archive: d.archive,
      urgence: urgenceEcheance(d.prochaineRevue, clos || d.archive),
      estActif,
      estRetard,
      estEnVigueur: d.statut === "EN_VIGUEUR" && !d.archive,
    };
  });

  const enRetardItems = items.filter((d) => d.estRetard && !d.archive);
  const responsables = Array.from(
    new Map(
      items
        .filter((d) => d.responsableId)
        .map((d) => [
          d.responsableId!,
          { id: d.responsableId!, nom: d.responsableNom },
        ]),
    ).values(),
  );

  return (
    <>
      <PageHeader
        title="Documents"
        description="Inventaire, métadonnées et planification des revues — le contenu reste dans Confluence."
        actions={<BtnLink href="/documents/nouveau">Nouveau document</BtnLink>}
      />
      <ModuleHelp {...MODULE_HELP.documents} />
      <FlashBanner ok={sp.ok} erreur={sp.erreur} />

      <KpiZone>
        <KpiStat value={inventorie} label="Inventoriés" />
        <KpiStat value={revuesProchaines} label="Revues à effectuer (30 j.)" />
        <KpiStat value={enRetard} label="En retard" />
        <KpiStat value={enVigueur} label="En vigueur" />
      </KpiZone>

      <AttentionZone
        items={enRetardItems.map((d) => ({
          id: d.id,
          href: `/documents/${d.id}`,
          code: d.code,
          title: d.nom,
          meta: `${d.responsableNom}${d.prochaineRevue ? ` · revue ${formatDateDot(d.prochaineRevue)}` : ""}`,
        }))}
      />

      <DocumentInventory items={items} responsables={responsables} />
    </>
  );
}
