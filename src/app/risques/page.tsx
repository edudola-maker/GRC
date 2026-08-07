import { PageHeader, BtnLink } from "@/components/ui";
import { FlashBanner } from "@/components/Flash";
import { ModuleHelp } from "@/components/ModuleHelp";
import { AttentionZone } from "@/components/module/AttentionZone";
import { KpiStat, KpiZone } from "@/components/module/KpiZone";
import { RiskMatrix } from "@/components/risques/RiskMatrix";
import {
  RisqueInventory,
  type RisqueInventoryItem,
} from "@/components/risques/RisqueInventory";
import { MODULE_HELP, RISQUE_STATUTS_MAITRISES } from "@/lib/catalog";
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
  searchParams: Promise<{ ok?: string; erreur?: string }>;
}) {
  const sp = await searchParams;
  const user = await getCurrentUser();
  const risques = await prisma.risque.findMany({
    where: { uniteId: user.uniteId },
    include: {
      responsable: true,
      _count: { select: { controles: true } },
    },
    orderBy: [{ criticite: "desc" }, { nom: "asc" }],
  });

  const actifs = risques.filter((r) => !r.archive);
  const total = actifs.length;
  const critiques = actifs.filter((r) => r.criticite >= 20).length;
  const eleves = actifs.filter(
    (r) => r.criticite >= 12 && r.criticite < 20,
  ).length;
  const maitrises = actifs.filter((r) =>
    (RISQUE_STATUTS_MAITRISES as readonly string[]).includes(r.statut),
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
      nbControles: r._count.controles,
      archive: r.archive,
      urgence,
      estCritique: r.criticite >= 20,
      estEleve: r.criticite >= 12 && r.criticite < 20,
      sansStrategie: !r.strategie,
    };
  });

  const attentionItems = items.filter(
    (r) => !r.archive && (r.estCritique || r.sansStrategie),
  );
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

  return (
    <>
      <PageHeader
        title="Risques"
        description="Cartographie des risques — criticité = probabilité × impact (inhérent et résiduel)."
        actions={<BtnLink href="/risques/nouveau">Nouveau risque</BtnLink>}
      />
      <ModuleHelp {...MODULE_HELP.risques} />
      <FlashBanner ok={sp.ok} erreur={sp.erreur} />

      <KpiZone>
        <KpiStat value={total} label="Total" />
        <KpiStat value={critiques} label="Critiques" />
        <KpiStat value={eleves} label="Élevés" />
        <KpiStat value={maitrises} label="Maîtrisés" />
        <KpiStat value={sansStrategie} label="Sans stratégie" />
      </KpiZone>

      <RiskMatrix risques={matrixPoints} />

      <AttentionZone
        label="Attention requise"
        items={attentionItems.map((r) => ({
          id: r.id,
          href: `/risques/${r.id}`,
          code: r.code,
          title: r.nom,
          meta: r.estCritique
            ? `Critique · ${r.responsableNom}`
            : `Sans stratégie · ${r.responsableNom}`,
        }))}
      />

      <RisqueInventory items={items} responsables={responsables} />
    </>
  );
}
