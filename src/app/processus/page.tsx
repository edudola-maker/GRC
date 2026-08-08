import { PageHeader, BtnLink } from "@/components/ui";
import { FlashBanner } from "@/components/Flash";
import { ModuleHelp } from "@/components/ModuleHelp";
import { AttentionZone } from "@/components/module/AttentionZone";
import { KpiStat, KpiZone } from "@/components/module/KpiZone";
import {
  ProcessusInventory,
  type ProcessusInventoryItem,
} from "@/components/processus/ProcessusInventory";
import { MODULE_HELP } from "@/lib/catalog";
import { STATUT_PROCESSUS_LABELS } from "@/lib/labels";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";

export const dynamic = "force-dynamic";

export default async function ProcessusPage({
  searchParams,
}: {
  searchParams: Promise<{ ok?: string; erreur?: string }>;
}) {
  const sp = await searchParams;
  const user = await getCurrentUser();
  const uniteId = user.uniteId;

  const [rows, actifs, suspendus] = await Promise.all([
    prisma.processus.findMany({
      where: { uniteId },
      include: {
        responsable: true,
        parent: { select: { nom: true } },
      },
      orderBy: [{ nom: "asc" }],
    }),
    prisma.processus.count({
      where: { uniteId, archive: false, statut: "ACTIF" },
    }),
    prisma.processus.count({
      where: { uniteId, archive: false, statut: "SUSPENDU" },
    }),
  ]);

  const items: ProcessusInventoryItem[] = rows.map((p) => ({
    id: p.id,
    code: p.code,
    nom: p.nom,
    statut: p.statut,
    statutLabel: STATUT_PROCESSUS_LABELS[p.statut] ?? p.statut,
    responsableId: p.responsableId,
    responsableNom: p.responsable.nom,
    criticite: p.criticite,
    parentNom: p.parent?.nom ?? null,
    tags: p.tags,
    archive: p.archive,
    estActif: !p.archive && p.statut === "ACTIF",
  }));

  const sansLienConfluence = items.filter(
    (p) => p.estActif && !rows.find((r) => r.id === p.id)?.reference,
  );
  const responsables = Array.from(
    new Map(
      items.map((p) => [
        p.responsableId,
        { id: p.responsableId, nom: p.responsableNom },
      ]),
    ).values(),
  );

  return (
    <>
      <PageHeader
        title="Processus"
        description="Référentiel et cartographie des processus — point d’entrée vers risques, contrôles et documents. La documentation détaillée reste dans Confluence."
        actions={
          <BtnLink href="/processus/nouveau">Nouveau processus</BtnLink>
        }
      />
      <ModuleHelp {...MODULE_HELP.processus} />
      <FlashBanner ok={sp.ok} erreur={sp.erreur} />

      <KpiZone>
        <KpiStat value={actifs} label="Actifs" />
        <KpiStat value={suspendus} label="Suspendus" />
        <KpiStat value={rows.length} label="Total" />
      </KpiZone>

      <AttentionZone
        label="À compléter"
        items={sansLienConfluence.slice(0, 5).map((p) => ({
          id: p.id,
          href: `/processus/${p.id}`,
          code: p.code,
          title: p.nom,
          meta: `${p.responsableNom} · lien Confluence manquant`,
        }))}
      />

      <ProcessusInventory items={items} responsables={responsables} />
    </>
  );
}
