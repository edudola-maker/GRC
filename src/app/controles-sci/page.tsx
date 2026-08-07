import { PageHeader, BtnLink } from "@/components/ui";
import { FlashBanner } from "@/components/Flash";
import { ModuleHelp } from "@/components/ModuleHelp";
import { AttentionZone } from "@/components/module/AttentionZone";
import { KpiStat, KpiZone } from "@/components/module/KpiZone";
import {
  ControleInventory,
  type ControleInventoryItem,
} from "@/components/controles-sci/ControleInventory";
import { MODULE_HELP, TACHE_STATUTS_CLOS } from "@/lib/catalog";
import {
  FREQUENCE_LABELS,
  STATUT_CONTROLE_LABELS,
  TYPE_CONTROLE_LABELS,
  formatDateDot,
  startOfToday,
  urgenceEcheance,
} from "@/lib/labels";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";

export const dynamic = "force-dynamic";

export default async function ControlesSCIPage({
  searchParams,
}: {
  searchParams: Promise<{ ok?: string; erreur?: string }>;
}) {
  const sp = await searchParams;
  const today = startOfToday();
  const user = await getCurrentUser();
  const uniteId = user.uniteId;

  const [controles, actifs, suspendus, occOuvertes, occRetard] =
    await Promise.all([
      prisma.controleSCI.findMany({
        where: { uniteId },
        include: {
          responsable: true,
          _count: { select: { risques: true, taches: true } },
        },
        orderBy: [{ statut: "asc" }, { dateProchaineEcheance: "asc" }],
      }),
      prisma.controleSCI.count({
        where: { uniteId, archive: false, statut: "ACTIF" },
      }),
      prisma.controleSCI.count({
        where: { uniteId, archive: false, statut: "SUSPENDU" },
      }),
      prisma.tache.count({
        where: {
          uniteId,
          categorie: "SCI",
          controleSCIId: { not: null },
          statut: { notIn: [...TACHE_STATUTS_CLOS] },
        },
      }),
      prisma.tache.count({
        where: {
          uniteId,
          categorie: "SCI",
          controleSCIId: { not: null },
          statut: { notIn: [...TACHE_STATUTS_CLOS] },
          dateEcheance: { lt: today },
        },
      }),
    ]);

  const items: ControleInventoryItem[] = controles.map((c) => {
    const estActif = !c.archive && c.statut === "ACTIF";
    const estRetard = Boolean(
      estActif &&
        c.dateProchaineEcheance &&
        c.dateProchaineEcheance < today,
    );
    return {
      id: c.id,
      code: c.code,
      nom: c.nom,
      processusConcerne: c.processusConcerne,
      typeLabel: TYPE_CONTROLE_LABELS[c.typeControle] ?? c.typeControle,
      frequenceLabel: FREQUENCE_LABELS[c.frequence] ?? c.frequence,
      statut: c.statut,
      statutLabel: STATUT_CONTROLE_LABELS[c.statut] ?? c.statut,
      responsableId: c.responsableId,
      responsableNom: c.responsable.nom,
      fenetreDeclenchementJours: c.fenetreDeclenchementJours,
      dateProchaineEcheance: c.dateProchaineEcheance?.toISOString() ?? null,
      nbOccurrences: c._count.taches,
      archive: c.archive,
      urgence: urgenceEcheance(
        c.dateProchaineEcheance,
        c.archive || c.statut === "SUSPENDU",
      ),
      estActif,
      estRetard,
    };
  });

  const enRetardItems = items.filter((c) => c.estRetard && !c.archive);
  const responsables = Array.from(
    new Map(
      items.map((c) => [
        c.responsableId,
        { id: c.responsableId, nom: c.responsableNom },
      ]),
    ).values(),
  );

  return (
    <>
      <PageHeader
        title="Contrôles SCI"
        description="Définitions permanentes des contrôles — l’exécution se fait via les occurrences (tâches)."
        actions={
          <BtnLink href="/controles-sci/nouveau">Nouveau contrôle</BtnLink>
        }
      />
      <ModuleHelp {...MODULE_HELP.controles} />
      <FlashBanner ok={sp.ok} erreur={sp.erreur} />

      <KpiZone>
        <KpiStat value={actifs} label="Actifs" />
        <KpiStat value={suspendus} label="Suspendus" />
        <KpiStat value={occOuvertes} label="Occurrences ouvertes" />
        <KpiStat value={occRetard} label="Occurrences en retard" />
      </KpiZone>

      <AttentionZone
        items={enRetardItems.map((c) => ({
          id: c.id,
          href: `/controles-sci/${c.id}`,
          code: c.code,
          title: c.nom,
          meta: `${c.responsableNom}${c.dateProchaineEcheance ? ` · éch. ${formatDateDot(c.dateProchaineEcheance)}` : ""}`,
        }))}
      />

      <ControleInventory items={items} responsables={responsables} />
    </>
  );
}
