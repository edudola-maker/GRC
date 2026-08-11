import { PageHeader } from "@/components/ui";
import { FlashBanner } from "@/components/Flash";
import { ModuleHelp } from "@/components/ModuleHelp";
import { KpiZone } from "@/components/module/KpiZone";
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
  searchParams: Promise<{ ok?: string; erreur?: string; filtre?: string }>;
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
        unite: { select: { code: true, nom: true } },
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
    uniteNom: `${p.unite.code} — ${p.unite.nom}`,
    statut: p.statut,
    statutLabel: STATUT_PROCESSUS_LABELS[p.statut] ?? p.statut,
    responsableId: p.responsableId,
    responsableNom: p.responsable.nom,
    criticite: p.criticite,
    parentNom: p.parent?.nom ?? null,
    tags: p.tags,
    archive: p.archive,
    estActif: !p.archive && p.statut === "ACTIF",
    aLienConfluence: Boolean(p.reference),
  }));

  const sansConfluence = items.filter(
    (p) => p.estActif && !p.aLienConfluence,
  ).length;
  const responsables = Array.from(
    new Map(
      items.map((p) => [
        p.responsableId,
        { id: p.responsableId, nom: p.responsableNom },
      ]),
    ).values(),
  );

  const initialQuick =
    sp.filtre === "sans_confluence" ? "sans_confluence" : undefined;

  return (
    <>
      <PageHeader
        title="Processus"
        help={<ModuleHelp {...MODULE_HELP.processus} />}
      />
      <FlashBanner ok={sp.ok} erreur={sp.erreur} />

      <KpiZone
        items={[
          { value: actifs, label: "actifs", tone: "ok" },
          { value: suspendus, label: "suspendus" },
          { value: rows.length, label: "total" },
          {
            value: sansConfluence,
            label: "à compléter",
            tone: sansConfluence > 0 ? "warn" : "default",
            href:
              sansConfluence > 0
                ? "?filtre=sans_confluence#inventaire"
                : undefined,
          },
        ]}
      />

      <ProcessusInventory
        items={items}
        responsables={responsables}
        initialQuick={initialQuick}
        createHref="/processus/nouveau"
        createLabel="Nouveau processus"
      />
    </>
  );
}
