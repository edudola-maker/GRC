import { PageHeader } from "@/components/ui";
import { FlashBanner } from "@/components/Flash";
import { ModuleHelp } from "@/components/ModuleHelp";
import { KpiZone } from "@/components/module/KpiZone";
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
  searchParams: Promise<{ ok?: string; erreur?: string; filtre?: string }>;
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

  const initialQuick =
    sp.filtre === "retard"
      ? "retard"
      : sp.filtre === "en_vigueur"
        ? "en_vigueur"
        : undefined;

  return (
    <>
      <PageHeader
        title="Documents"
        description="Inventaire et planification des revues — contenu dans Confluence."
        help={<ModuleHelp {...MODULE_HELP.documents} />}
      />
      <FlashBanner ok={sp.ok} erreur={sp.erreur} />

      <KpiZone
        items={[
          { value: inventorie, label: "inventoriés", tone: "ok" },
          { value: revuesProchaines, label: "à surveiller (30 j.)" },
          { value: enVigueur, label: "en vigueur" },
          {
            value: enRetard,
            label: "à traiter",
            tone: enRetard > 0 ? "danger" : "default",
            href: enRetard > 0 ? "?filtre=retard#inventaire" : undefined,
          },
        ]}
      />

      <DocumentInventory
        items={items}
        responsables={responsables}
        initialQuick={initialQuick}
        createHref="/documents/nouveau"
        createLabel="Nouveau document"
      />
    </>
  );
}
