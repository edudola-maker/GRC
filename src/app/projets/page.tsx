import { PageHeader, BtnLink } from "@/components/ui";
import { FlashBanner } from "@/components/Flash";
import { ModuleHelp } from "@/components/ModuleHelp";
import { KpiZone } from "@/components/module/KpiZone";
import {
  ProjetInventory,
  type ProjetInventoryItem,
} from "@/components/projets/ProjetInventory";
import {
  PRIORITE_LABELS,
  STATUT_PROJET_LABELS,
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
  searchParams: Promise<{ ok?: string; erreur?: string; filtre?: string }>;
}) {
  const sp = await searchParams;
  const today = startOfToday();
  const user = await getCurrentUser();
  const uniteId = user.uniteId;

  const [projets, actifs, termines, enRetard, avancementAgg, tachesOuvertes] =
    await Promise.all([
      prisma.projet.findMany({
        where: { uniteId },
        include: {
          responsable: true,
          _count: { select: { taches: true } },
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
      prisma.tache.count({
        where: {
          uniteId,
          projetId: { not: null },
          statut: { notIn: ["TERMINE", "ANNULE"] },
        },
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
      archive: p.archive,
      urgence: urgenceEcheance(p.dateEcheance, clos || p.archive),
      estActif,
      estRetard,
    };
  });

  const responsables = Array.from(
    new Map(
      items.map((p) => [p.responsableId, { id: p.responsableId, nom: p.responsableNom }]),
    ).values(),
  );

  const initialQuick = sp.filtre === "retard" ? "retard" : undefined;

  return (
    <>
      <PageHeader
        title="Projets"
        description="Initiatives structurées — du statut Idée à la clôture."
        help={<ModuleHelp {...MODULE_HELP.projets} />}
        actions={<BtnLink href="/projets/nouveau">Nouveau projet</BtnLink>}
      />
      <FlashBanner ok={sp.ok} erreur={sp.erreur} />

      <KpiZone
        items={[
          { value: actifs, label: "actifs" },
          { value: termines, label: "clôturés", tone: "ok" },
          { value: `${avancementGlobal}%`, label: "avancement global" },
          { value: tachesOuvertes, label: "tâches ouvertes" },
          {
            value: (
              <>
                {respectEcheances ?? "—"}
                {respectEcheances != null ? "%" : ""}
              </>
            ),
            label: "clôtures / volume",
          },
          {
            value: enRetard,
            label: "à traiter",
            tone: enRetard > 0 ? "danger" : "default",
            href: enRetard > 0 ? "?filtre=retard#inventaire" : undefined,
          },
        ]}
      />

      <ProjetInventory
        items={items}
        responsables={responsables}
        initialQuick={initialQuick}
      />
    </>
  );
}
