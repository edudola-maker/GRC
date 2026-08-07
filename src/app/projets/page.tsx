import { PageHeader, BtnLink } from "@/components/ui";
import { FlashBanner } from "@/components/Flash";
import { ModuleHelp } from "@/components/ModuleHelp";
import { AttentionZone } from "@/components/module/AttentionZone";
import { KpiStat, KpiZone } from "@/components/module/KpiZone";
import {
  ProjetInventory,
  type ProjetInventoryItem,
} from "@/components/projets/ProjetInventory";
import {
  PRIORITE_LABELS,
  STATUT_PROJET_LABELS,
  formatDateDot,
  startOfToday,
  urgenceEcheance,
} from "@/lib/labels";
import { MODULE_HELP, PROJET_STATUTS_CLOS } from "@/lib/catalog";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";

export const dynamic = "force-dynamic";

export default async function ProjetsPage({
  searchParams,
}: {
  searchParams: Promise<{ ok?: string; erreur?: string }>;
}) {
  const sp = await searchParams;
  const today = startOfToday();
  const user = await getCurrentUser();
  const uniteId = user.uniteId;

  const [projets, actifs, termines, enRetard, avancementAgg, jalonsAtteints, jalonsTotal] =
    await Promise.all([
      prisma.projet.findMany({
        where: { uniteId },
        include: {
          responsable: true,
          _count: { select: { taches: true, jalons: true } },
        },
        orderBy: [{ statut: "asc" }, { dateEcheance: "asc" }],
      }),
      prisma.projet.count({
        where: {
          uniteId,
          archive: false,
          statut: {
            in: ["VALIDE", "PLANIFIE", "EN_COURS", "EN_VALIDATION", "DEPLOYE"],
          },
        },
      }),
      prisma.projet.count({
        where: { uniteId, archive: false, statut: "CLOTURE" },
      }),
      prisma.projet.count({
        where: {
          uniteId,
          archive: false,
          statut: { notIn: ["CLOTURE", "ABANDONNE"] },
          dateEcheance: { lt: today },
        },
      }),
      prisma.projet.aggregate({
        where: {
          uniteId,
          archive: false,
          statut: {
            in: ["VALIDE", "PLANIFIE", "EN_COURS", "EN_VALIDATION", "DEPLOYE"],
          },
        },
        _avg: { avancement: true },
      }),
      prisma.jalon.count({
        where: { atteint: true, projet: { archive: false, uniteId } },
      }),
      prisma.jalon.count({
        where: { projet: { archive: false, uniteId } },
      }),
    ]);

  const avancementGlobal = Math.round(avancementAgg._avg.avancement ?? 0);
  const respectEcheances =
    actifs + termines > 0
      ? Math.round((termines / (actifs + termines + enRetard || 1)) * 100)
      : null;

  const items: ProjetInventoryItem[] = projets.map((p) => {
    const clos = (PROJET_STATUTS_CLOS as readonly string[]).includes(p.statut);
    const estActif = !clos && !p.archive;
    const estRetard = Boolean(
      estActif && p.dateEcheance && p.dateEcheance < today,
    );
    return {
      id: p.id,
      code: p.code,
      nom: p.nom,
      statut: p.statut,
      statutLabel: STATUT_PROJET_LABELS[p.statut] ?? p.statut,
      prioriteLabel: PRIORITE_LABELS[p.priorite] ?? p.priorite,
      responsableId: p.responsableId,
      responsableNom: p.responsable.nom,
      avancement: p.avancement,
      tags: p.tags,
      dateEcheance: p.dateEcheance?.toISOString() ?? null,
      nbTaches: p._count.taches,
      nbJalons: p._count.jalons,
      archive: p.archive,
      urgence: urgenceEcheance(p.dateEcheance, clos || p.archive),
      estActif,
      estRetard,
    };
  });

  const enRetardItems = items.filter((p) => p.estRetard && !p.archive);
  const responsables = Array.from(
    new Map(
      items.map((p) => [p.responsableId, { id: p.responsableId, nom: p.responsableNom }]),
    ).values(),
  );

  return (
    <>
      <PageHeader
        title="Projets"
        description="Initiatives structurées de l'unité — du statut Idée à la clôture."
        actions={<BtnLink href="/projets/nouveau">Nouveau projet</BtnLink>}
      />
      <ModuleHelp {...MODULE_HELP.projets} />
      <FlashBanner ok={sp.ok} erreur={sp.erreur} />

      <KpiZone>
        <KpiStat value={actifs} label="Actifs" />
        <KpiStat value={termines} label="Clôturés" />
        <KpiStat value={enRetard} label="En retard" />
        <KpiStat value={`${avancementGlobal}%`} label="Avancement global" />
        <KpiStat
          value={`${jalonsAtteints}/${jalonsTotal}`}
          label="Jalons atteints"
        />
        <KpiStat
          value={
            <>
              {respectEcheances ?? "—"}
              {respectEcheances != null ? "%" : ""}
            </>
          }
          label="Clôtures / volume"
        />
      </KpiZone>

      <AttentionZone
        items={enRetardItems.map((p) => ({
          id: p.id,
          href: `/projets/${p.id}`,
          code: p.code,
          title: p.nom,
          meta: `${p.responsableNom}${p.dateEcheance ? ` · éch. ${formatDateDot(p.dateEcheance)}` : ""}`,
        }))}
      />

      <ProjetInventory items={items} responsables={responsables} />
    </>
  );
}
