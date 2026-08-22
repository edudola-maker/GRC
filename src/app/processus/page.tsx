import Link from "next/link";
import { PageHeader } from "@/components/ui";
import { FlashBanner } from "@/components/Flash";
import { ModuleHelp } from "@/components/ModuleHelp";
import { KpiZone } from "@/components/module/KpiZone";
import {
  ProcessusInventory,
  type ProcessusInventoryItem,
} from "@/components/processus/ProcessusInventory";
import {
  ProcessusArborescence,
  type MacroArboItem,
} from "@/components/processus/ProcessusArborescence";
import { MODULE_HELP } from "@/lib/catalog";
import { STATUT_PROCESSUS_LABELS } from "@/lib/labels";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";

export const dynamic = "force-dynamic";

export default async function ProcessusPage({
  searchParams,
}: {
  searchParams: Promise<{
    ok?: string;
    erreur?: string;
    filtre?: string;
    vue?: string;
  }>;
}) {
  const sp = await searchParams;
  const user = await getCurrentUser();
  const uniteId = user.uniteId;
  const vue = sp.vue === "inventaire" ? "inventaire" : "arborescence";

  const [rows, actifs, suspendus, unite, macros] = await Promise.all([
    prisma.processus.findMany({
      where: {
        OR: [
          { uniteId },
          { unitesApplicables: { some: { uniteId } } },
        ],
      },
      include: {
        responsable: true,
        parent: { select: { nom: true } },
        unite: { select: { code: true, nom: true } },
        macroprocessus: { select: { id: true, code: true, nom: true } },
      },
      orderBy: [{ nom: "asc" }],
    }),
    prisma.processus.count({
      where: { uniteId, archive: false, statut: "ACTIF" },
    }),
    prisma.processus.count({
      where: { uniteId, archive: false, statut: "SUSPENDU" },
    }),
    prisma.unite.findUniqueOrThrow({
      where: { id: uniteId },
      select: { id: true, code: true, nom: true },
    }),
    prisma.macroprocessus.findMany({
      where: {
        OR: [
          { uniteId },
          { unitesApplicables: { some: { uniteId } } },
        ],
        archive: false,
      },
      include: {
        processus: {
          where: { archive: false },
          select: { id: true, code: true, nom: true },
          orderBy: { nom: "asc" },
        },
      },
      orderBy: [{ ordre: "asc" }, { nom: "asc" }],
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
    parentNom: p.macroprocessus
      ? `${p.macroprocessus.code} — ${p.macroprocessus.nom}`
      : (p.parent?.nom ?? null),
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

  const macrosArbo: MacroArboItem[] = macros.map((m) => ({
    id: m.id,
    code: m.code,
    nom: m.nom,
    ordre: m.ordre,
    processus: m.processus,
  }));
  const macroIds = new Set(macros.map((m) => m.id));
  const orphelins = rows
    .filter((p) => !p.archive && (!p.macroprocessusId || !macroIds.has(p.macroprocessusId)))
    .map((p) => ({ id: p.id, code: p.code, nom: p.nom }));

  return (
    <>
      <PageHeader
        title="Processus"
        help={<ModuleHelp {...MODULE_HELP.processus} />}
      />
      <FlashBanner ok={sp.ok} erreur={sp.erreur} />

      <div className="filter-bar" style={{ marginBottom: "1rem", gap: "0.5rem" }}>
        <Link
          href="/processus?vue=arborescence"
          className={`chip${vue === "arborescence" ? " is-active" : ""}`}
        >
          Arborescence
        </Link>
        <Link
          href="/processus?vue=inventaire"
          className={`chip${vue === "inventaire" ? " is-active" : ""}`}
        >
          Inventaire
        </Link>
        <Link href="/macroprocessus/nouveau" className="btn btn--ghost">
          + Macroprocessus
        </Link>
        <Link href="/processus/nouveau" className="btn btn--primary">
          + Processus
        </Link>
      </div>

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
                ? "?vue=inventaire&filtre=sans_confluence#inventaire"
                : undefined,
          },
        ]}
      />

      {vue === "arborescence" ? (
        <ProcessusArborescence
          unite={unite}
          macros={macrosArbo}
          orphelins={orphelins}
        />
      ) : (
        <ProcessusInventory
          items={items}
          responsables={responsables}
          initialQuick={initialQuick}
          createHref="/processus/nouveau"
          createLabel="Nouveau processus"
        />
      )}
    </>
  );
}
