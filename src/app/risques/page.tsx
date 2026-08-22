import { PageHeader, BtnLink } from "@/components/ui";
import { FlashBanner } from "@/components/Flash";
import { ModuleHelp } from "@/components/ModuleHelp";
import { KpiZone } from "@/components/module/KpiZone";
import type { PilotageItem } from "@/components/module/PilotageStrip";
import { RiskMatrix } from "@/components/risques/RiskMatrix";
import {
  RisqueInventory,
  type RisqueInventoryItem,
} from "@/components/risques/RisqueInventory";
import { MODULE_HELP } from "@/lib/catalog";
import {
  CATEGORIE_RISQUE_LABELS,
  STATUT_RISQUE_LABELS,
  STRATEGIE_RISQUE_LABELS,
  criticiteNiveau,
} from "@/lib/labels";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";

export const dynamic = "force-dynamic";

export default async function RisquesPage({
  searchParams,
}: {
  searchParams: Promise<{ ok?: string; erreur?: string; filtre?: string }>;
}) {
  const sp = await searchParams;
  const user = await getCurrentUser();
  const risques = await prisma.risque.findMany({
    where: { uniteId: user.uniteId },
    include: {
      unite: { select: { nom: true, code: true } },
      responsable: true,
      controles: {
        include: {
          controle: { select: { id: true, code: true, nom: true } },
        },
      },
    },
    orderBy: [{ criticite: "desc" }, { nom: "asc" }],
  });

  const actifs = risques.filter((r) => !r.archive);
  const total = actifs.length;
  const critiques = actifs.filter((r) => r.criticite >= 20).length;
  const eleves = actifs.filter(
    (r) => r.criticite >= 12 && r.criticite < 20,
  ).length;
  const sansStrategie = actifs.filter((r) => !r.strategie).length;

  const items: RisqueInventoryItem[] = risques.map((r) => {
    const niveau = criticiteNiveau(r.criticite);
    const urgence =
      niveau === "critique" || niveau === "eleve"
        ? "retard"
        : niveau === "modere"
          ? "bientot"
          : "neutre";
    return {
      id: r.id,
      code: r.code,
      nom: r.nom,
      uniteNom: `${r.unite.code} — ${r.unite.nom}`,
      categorieLabel: CATEGORIE_RISQUE_LABELS[r.categorie] ?? r.categorie,
      statut: r.statut,
      statutLabel: STATUT_RISQUE_LABELS[r.statut] ?? r.statut,
      strategieLabel: r.strategie
        ? (STRATEGIE_RISQUE_LABELS[r.strategie] ?? r.strategie)
        : null,
      responsableId: r.responsableId,
      responsableNom: r.responsable.nom,
      probabilite: r.probabilite,
      impact: r.impact,
      criticite: r.criticite,
      probabiliteResiduelle: r.probabiliteResiduelle,
      impactResiduel: r.impactResiduel,
      criticiteResiduelle: r.criticiteResiduelle,
      controles: r.controles.map((c) => ({
        id: c.controle.id,
        code: c.controle.code,
        nom: c.controle.nom,
      })),
      archive: r.archive,
      urgence,
      estCritique: r.criticite >= 20,
      estEleve: r.criticite >= 12 && r.criticite < 20,
      sansStrategie: !r.strategie,
    };
  });

  const responsables = Array.from(
    new Map(
      items.map((r) => [
        r.responsableId,
        { id: r.responsableId, nom: r.responsableNom },
      ]),
    ).values(),
  );

  const matrixPoints = actifs.map((r) => ({
    id: r.id,
    code: r.code,
    nom: r.nom,
    categorie: r.categorie,
    probabilite: r.probabilite,
    impact: r.impact,
    criticite: r.criticite,
    probabiliteResiduelle: r.probabiliteResiduelle,
    impactResiduel: r.impactResiduel,
    criticiteResiduelle: r.criticiteResiduelle,
  }));

  const initialQuick =
    sp.filtre === "critiques"
      ? "critiques"
      : sp.filtre === "sans_strategie"
        ? "sans_strategie"
        : undefined;

  const kpiItems: PilotageItem[] = [
    {
      value: critiques,
      label: "critiques",
      tone: critiques > 0 ? "danger" : "default",
      href: critiques > 0 ? "?filtre=critiques#inventaire" : undefined,
    },
    { value: eleves, label: "élevés" },
    {
      value: sansStrategie,
      label: "sans stratégie",
      tone: sansStrategie > 0 ? "warn" : "default",
      href: sansStrategie > 0 ? "?filtre=sans_strategie#inventaire" : undefined,
    },
    { value: total, label: "total" },
  ];

  return (
    <>
      <PageHeader
        title="Risques"
        help={<ModuleHelp {...MODULE_HELP.risques} />}
        actions={
          <>
            <BtnLink href="/api/exports/risques" variant="ghost">
              Exporter Excel
            </BtnLink>
            <BtnLink href="/rapports/risques" variant="ghost">
              Rapport PDF
            </BtnLink>
          </>
        }
      />
      <FlashBanner ok={sp.ok} erreur={sp.erreur} />

      <KpiZone items={kpiItems} />

      <RiskMatrix risques={matrixPoints} />

      <RisqueInventory
        items={items}
        responsables={responsables}
        initialQuick={initialQuick}
        createHref="/risques/nouveau"
        createLabel="Nouveau risque"
      />
    </>
  );
}
