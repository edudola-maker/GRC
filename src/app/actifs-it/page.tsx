import { PageHeader } from "@/components/ui";
import { FlashBanner } from "@/components/Flash";
import { ModuleHelp } from "@/components/ModuleHelp";
import { KpiZone } from "@/components/module/KpiZone";
import {
  ActifITInventory,
  type ActifITInventoryItem,
} from "@/components/actifs-it/ActifITInventory";
import { MODULE_HELP } from "@/lib/catalog";
import {
  STATUT_ACTIF_IT_LABELS,
  TYPE_ACTIF_IT_LABELS,
} from "@/lib/labels";
import { prisma } from "@/lib/prisma";
import { formatUtilisateurNom, getCurrentUser } from "@/lib/session";

export const dynamic = "force-dynamic";

export default async function ActifsITPage({
  searchParams,
}: {
  searchParams: Promise<{ ok?: string; erreur?: string }>;
}) {
  const sp = await searchParams;
  const user = await getCurrentUser();
  const uniteId = user.uniteId;

  const [rows, actifsCount, avecProcessus] = await Promise.all([
    prisma.actifIT.findMany({
      where: { uniteId },
      include: {
        responsable: true,
        _count: { select: { processus: true } },
      },
      orderBy: [{ nom: "asc" }],
    }),
    prisma.actifIT.count({
      where: { uniteId, archive: false, statut: "ACTIF" },
    }),
    prisma.actifIT.count({
      where: {
        uniteId,
        archive: false,
        processus: { some: {} },
      },
    }),
  ]);

  const items: ActifITInventoryItem[] = rows.map((a) => ({
    id: a.id,
    code: a.code,
    nom: a.nom,
    typeLabel: TYPE_ACTIF_IT_LABELS[a.type] ?? a.type,
    statut: a.statut,
    statutLabel: STATUT_ACTIF_IT_LABELS[a.statut] ?? a.statut,
    responsableId: a.responsableId,
    responsableNom: a.responsable ? formatUtilisateurNom(a.responsable) : "—",
    nbProcessus: a._count.processus,
    archive: a.archive,
    estActif: !a.archive && a.statut === "ACTIF",
  }));

  const sansProcessus = items.filter(
    (a) => a.estActif && a.nbProcessus === 0,
  ).length;

  const responsables = Array.from(
    new Map(
      items
        .filter((a) => a.responsableId)
        .map((a) => [
          a.responsableId!,
          { id: a.responsableId!, nom: a.responsableNom },
        ]),
    ).values(),
  );

  return (
    <>
      <PageHeader
        title="Actifs IT"
        help={<ModuleHelp {...MODULE_HELP.actifsIT} />}
      />
      <FlashBanner ok={sp.ok} erreur={sp.erreur} />
      <KpiZone
        items={[
          { label: "Actifs", value: actifsCount, href: "#inventaire" },
          {
            label: "Liés à un processus",
            value: avecProcessus,
            href: "#inventaire",
          },
          {
            label: "Sans processus",
            value: sansProcessus,
            href: "#inventaire",
          },
        ]}
      />
      <ActifITInventory items={items} responsables={responsables} />
    </>
  );
}
