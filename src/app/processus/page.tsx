import Link from "next/link";
import { PageHeader } from "@/components/ui";
import { FlashBanner } from "@/components/Flash";
import { ModuleHelp } from "@/components/ModuleHelp";
import { KpiZone } from "@/components/module/KpiZone";
import { EmptyGuidance } from "@/components/ui/EmptyGuidance";
import {
  ProcessusInventory,
  type ProcessusInventoryItem,
} from "@/components/processus/ProcessusInventory";
import { type MacroArboItem } from "@/components/processus/ProcessusArborescence";
import { ProcessusSplitView } from "@/components/processus/ProcessusSplitView";
import {
  ProcessusExplorerDetail,
  type ProcessusPreviewData,
} from "@/components/processus/ProcessusExplorerDetail";
import { MODULE_HELP } from "@/lib/catalog";
import { STATUT_PROCESSUS_LABELS } from "@/lib/labels";
import { prisma } from "@/lib/prisma";
import { formatUtilisateurNom, getCurrentUser } from "@/lib/session";

export const dynamic = "force-dynamic";

export default async function ProcessusPage({
  searchParams,
}: {
  searchParams: Promise<{
    ok?: string;
    erreur?: string;
    filtre?: string;
    vue?: string;
    selected?: string;
  }>;
}) {
  const sp = await searchParams;
  const user = await getCurrentUser();
  const uniteId = user.uniteId;
  const vue = sp.vue === "inventaire" ? "inventaire" : "arborescence";
  const selectedId = sp.selected?.trim() || null;

  const [rows, actifs, suspendus, unite, macros, selectedRaw] = await Promise.all([
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
    selectedId
      ? prisma.processus.findFirst({
          where: {
            id: selectedId,
            OR: [
              { uniteId },
              { unitesApplicables: { some: { uniteId } } },
            ],
          },
          include: {
            responsable: true,
            unite: { select: { nom: true } },
            macroprocessus: { select: { code: true, nom: true } },
            _count: {
              select: {
                etapes: true,
                risques: true,
                actifsIT: true,
                raciLignes: true,
                exigences: true,
              },
            },
            continuite: { select: { id: true } },
            qualite: { select: { id: true } },
            risques: {
              where: { archive: false },
              select: {
                _count: { select: { controles: true } },
              },
            },
          },
        })
      : Promise.resolve(null),
  ]);

  const items: ProcessusInventoryItem[] = rows.map((p) => ({
    id: p.id,
    code: p.code,
    nom: p.nom,
    uniteNom: `${p.unite.code} — ${p.unite.nom}`,
    statut: p.statut,
    statutLabel: STATUT_PROCESSUS_LABELS[p.statut] ?? p.statut,
    responsableId: p.responsableId,
    responsableNom: formatUtilisateurNom(p.responsable),
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
    .filter(
      (p) =>
        !p.archive &&
        (!p.macroprocessusId || !macroIds.has(p.macroprocessusId)),
    )
    .map((p) => ({ id: p.id, code: p.code, nom: p.nom }));

  let preview: ProcessusPreviewData | null = null;
  if (selectedRaw) {
    const controlesCount = selectedRaw.risques.reduce(
      (s, r) => s + r._count.controles,
      0,
    );
    preview = {
      id: selectedRaw.id,
      code: selectedRaw.code,
      nom: selectedRaw.nom,
      description: selectedRaw.description,
      statut: selectedRaw.statut,
      criticite: selectedRaw.criticite,
      reference: selectedRaw.reference,
      responsableNom: formatUtilisateurNom(selectedRaw.responsable),
      uniteNom: selectedRaw.unite.nom,
      macroNom: selectedRaw.macroprocessus
        ? `${selectedRaw.macroprocessus.code} — ${selectedRaw.macroprocessus.nom}`
        : null,
      etapesCount: selectedRaw._count.etapes,
      risquesCount: selectedRaw._count.risques,
      controlesCount,
      actifsCount: selectedRaw._count.actifsIT,
      aRaci: selectedRaw._count.raciLignes > 0,
      aContinuite: Boolean(selectedRaw.continuite),
      aQualite: Boolean(selectedRaw.qualite),
      exigencesCount: selectedRaw._count.exigences,
      contientDonneesPersonnelles: selectedRaw.contientDonneesPersonnelles,
      niveauConfidentialite: selectedRaw.niveauConfidentialite,
      modifieLe: selectedRaw.modifieLe,
    };
  }

  return (
    <>
      <PageHeader
        title="Processus"
        help={<ModuleHelp {...MODULE_HELP.processus} />}
      />
      <FlashBanner ok={sp.ok} erreur={sp.erreur} />

      <div className="filter-bar filter-bar--wrap" style={{ marginBottom: "1rem" }}>
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
        <Link href="/processus/nouveau" className="btn btn--primary">
          + Processus
        </Link>
      </div>

      {vue === "inventaire" ? (
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
      ) : null}

      {vue === "arborescence" ? (
        <ProcessusSplitView
          unite={unite}
          macros={macrosArbo}
          orphelins={orphelins}
          selectedId={preview?.id ?? selectedId}
          detail={
            preview ? <ProcessusExplorerDetail processus={preview} /> : null
          }
        />
      ) : rows.length === 0 ? (
        <EmptyGuidance
          title="Aucun processus dans cette unité"
          actionHref="/processus/nouveau"
          actionLabel="Créer un processus"
          guideHref="/decouvrir/documenter-processus"
          guideLabel="Guide : documenter un processus"
        >
          <p style={{ margin: 0 }}>
            Commencez par créer un processus dans le référentiel, puis complétez
            RACI, risques et documentation.
          </p>
        </EmptyGuidance>
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
