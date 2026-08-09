import { PageHeader, BtnLink } from "@/components/ui";
import { FlashBanner } from "@/components/Flash";
import { ModuleHelp } from "@/components/ModuleHelp";
import { KpiZone } from "@/components/module/KpiZone";
import {
  ControleInventory,
  type ControleInventoryItem,
} from "@/components/controles-sci/ControleInventory";
import { MODULE_HELP, TACHE_STATUTS_CLOS } from "@/lib/catalog";
import {
  FREQUENCE_LABELS,
  STATUT_CONTROLE_LABELS,
  TYPE_CONTROLE_LABELS,
  startOfToday,
  urgenceEcheance,
} from "@/lib/labels";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";

export const dynamic = "force-dynamic";

export default async function ControlesSCIPage({
  searchParams,
}: {
  searchParams: Promise<{ ok?: string; erreur?: string; filtre?: string }>;
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

  const enRetard = items.filter((c) => c.estRetard && !c.archive).length;
  const responsables = Array.from(
    new Map(
      items.map((c) => [
        c.responsableId,
        { id: c.responsableId, nom: c.responsableNom },
      ]),
    ).values(),
  );

  const initialQuick = sp.filtre === "retard" ? "retard" : undefined;

  return (
    <>
      <PageHeader
        title="Contrôles SCI"
        description="Définitions permanentes — l'exécution passe par les occurrences (tâches)."
        help={<ModuleHelp {...MODULE_HELP.controles} />}
        actions={
          <BtnLink href="/controles-sci/nouveau">Nouveau contrôle</BtnLink>
        }
      />
      <FlashBanner ok={sp.ok} erreur={sp.erreur} />

      <KpiZone
        items={[
          { value: actifs, label: "actifs", tone: "ok" },
          { value: suspendus, label: "suspendus" },
          { value: occOuvertes, label: "occurrences ouvertes" },
          { value: occRetard, label: "occ. en retard" },
          {
            value: enRetard,
            label: "à traiter",
            tone: enRetard > 0 ? "danger" : "default",
            href: enRetard > 0 ? "?filtre=retard#inventaire" : undefined,
          },
        ]}
      />

      <ControleInventory
        items={items}
        responsables={responsables}
        initialQuick={initialQuick}
      />
    </>
  );
}
