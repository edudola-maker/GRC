import { PageHeader, BtnLink } from "@/components/ui";
import { FlashBanner } from "@/components/Flash";
import { ModuleHelp } from "@/components/ModuleHelp";
import { AttentionZone } from "@/components/module/AttentionZone";
import { KpiStat, KpiZone } from "@/components/module/KpiZone";
import {
  AuditInventory,
  type AuditInventoryItem,
} from "@/components/audits/AuditInventory";
import { MODULE_HELP } from "@/lib/catalog";
import {
  STATUT_AUDIT_LABELS,
  formatDateDot,
  startOfToday,
  urgenceEcheance,
} from "@/lib/labels";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";

export const dynamic = "force-dynamic";

const AUDIT_STATUTS_CLOS = ["TERMINE", "ANNULE"] as const;

export default async function AuditsPage({
  searchParams,
}: {
  searchParams: Promise<{ ok?: string; erreur?: string }>;
}) {
  const sp = await searchParams;
  const today = startOfToday();
  const user = await getCurrentUser();
  const uniteId = user.uniteId;

  const [audits, planifies, enCours, termines, recoOuvertes, recoCloturees] =
    await Promise.all([
      prisma.audit.findMany({
        where: { uniteId },
        include: {
          responsable: true,
          _count: {
            select: { taches: true, recommandations: true },
          },
        },
        orderBy: [{ dateDebut: "desc" }, { titre: "asc" }],
      }),
      prisma.audit.count({
        where: { uniteId, archive: false, statut: "PLANIFIE" },
      }),
      prisma.audit.count({
        where: {
          uniteId,
          archive: false,
          statut: { in: ["EN_COURS", "EN_REVUE"] },
        },
      }),
      prisma.audit.count({
        where: { uniteId, archive: false, statut: "TERMINE" },
      }),
      prisma.recommandation.count({
        where: {
          statut: { in: ["OUVERTE", "EN_COURS"] },
          audit: { uniteId, archive: false },
        },
      }),
      prisma.recommandation.count({
        where: {
          statut: "CLOTUREE",
          audit: { uniteId, archive: false },
        },
      }),
    ]);

  const items: AuditInventoryItem[] = audits.map((a) => {
    const clos = (AUDIT_STATUTS_CLOS as readonly string[]).includes(a.statut);
    const estActif = !clos && !a.archive;
    const estRetard = Boolean(estActif && a.dateFin && a.dateFin < today);
    return {
      id: a.id,
      code: a.code,
      titre: a.titre,
      statut: a.statut,
      statutLabel: STATUT_AUDIT_LABELS[a.statut] ?? a.statut,
      responsableId: a.responsableId,
      responsableNom: a.responsable.nom,
      tags: a.tags,
      dateDebut: a.dateDebut?.toISOString() ?? null,
      dateFin: a.dateFin?.toISOString() ?? null,
      nbReco: a._count.recommandations,
      nbTaches: a._count.taches,
      archive: a.archive,
      urgence: urgenceEcheance(a.dateFin, clos || a.archive),
      estActif,
      estRetard,
    };
  });

  const enRetardItems = items.filter((a) => a.estRetard && !a.archive);
  const responsables = Array.from(
    new Map(
      items.map((a) => [
        a.responsableId,
        { id: a.responsableId, nom: a.responsableNom },
      ]),
    ).values(),
  );

  return (
    <>
      <PageHeader
        title="Audits"
        description="Planification des missions d'audit, recommandations et suivi des actions."
        actions={<BtnLink href="/audits/nouveau">Nouvel audit</BtnLink>}
      />
      <ModuleHelp {...MODULE_HELP.audits} />
      <FlashBanner ok={sp.ok} erreur={sp.erreur} />

      <KpiZone>
        <KpiStat value={planifies} label="Planifiés" />
        <KpiStat value={enCours} label="En cours" />
        <KpiStat value={termines} label="Terminés" />
        <KpiStat value={recoOuvertes} label="Reco ouvertes" />
        <KpiStat value={recoCloturees} label="Reco clôturées" />
      </KpiZone>

      <AttentionZone
        items={enRetardItems.map((a) => ({
          id: a.id,
          href: `/audits/${a.id}`,
          code: a.code,
          title: a.titre,
          meta: `${a.responsableNom}${a.dateFin ? ` · fin ${formatDateDot(a.dateFin)}` : ""}`,
        }))}
      />

      <AuditInventory items={items} responsables={responsables} />
    </>
  );
}
