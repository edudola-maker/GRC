import { PageHeader, BtnLink } from "@/components/ui";
import { FlashBanner } from "@/components/Flash";
import { ModuleHelp } from "@/components/ModuleHelp";
import { AttentionZone } from "@/components/module/AttentionZone";
import { KpiStat, KpiZone } from "@/components/module/KpiZone";
import {
  ControleInventory,
  type ControleInventoryItem,
} from "@/components/controles-sci/ControleInventory";
import { MODULE_HELP } from "@/lib/catalog";
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

  const [controles, prevus, realises, enRetard] = await Promise.all([
    prisma.controleSCI.findMany({
      where: { uniteId },
      include: {
        responsable: true,
        _count: { select: { preuves: true, risques: true, taches: true } },
      },
      orderBy: [{ statut: "asc" }, { dateProchaineEcheance: "asc" }],
    }),
    prisma.controleSCI.count({
      where: {
        uniteId,
        archive: false,
        statut: { in: ["A_REALISER", "EN_COURS", "A_VALIDER", "EN_RETARD"] },
      },
    }),
    prisma.controleSCI.count({
      where: { uniteId, archive: false, statut: "REALISE" },
    }),
    prisma.controleSCI.count({
      where: {
        uniteId,
        archive: false,
        OR: [
          { statut: "EN_RETARD" },
          {
            statut: { notIn: ["REALISE"] },
            dateProchaineEcheance: { lt: today },
          },
        ],
      },
    }),
  ]);

  const taux =
    prevus + realises > 0
      ? Math.round((realises / (prevus + realises)) * 100)
      : null;

  const items: ControleInventoryItem[] = controles.map((c) => {
    const clos = c.statut === "REALISE" && c.frequence === "PONCTUELLE";
    const estActif = !clos && !c.archive;
    const estRetard = Boolean(
      !c.archive &&
        (c.statut === "EN_RETARD" ||
          (c.statut !== "REALISE" &&
            c.dateProchaineEcheance &&
            c.dateProchaineEcheance < today)),
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
      nbPreuves: c._count.preuves,
      archive: c.archive,
      urgence: urgenceEcheance(c.dateProchaineEcheance, clos || c.archive),
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
        description="Registre des contrôles périodiques : fréquences, échéances, preuves et validation."
        actions={
          <BtnLink href="/controles-sci/nouveau">Nouveau contrôle</BtnLink>
        }
      />
      <ModuleHelp {...MODULE_HELP.controles} />
      <FlashBanner ok={sp.ok} erreur={sp.erreur} />

      <KpiZone>
        <KpiStat value={prevus} label="Prévus" />
        <KpiStat value={realises} label="Réalisés" />
        <KpiStat value={enRetard} label="En retard" />
        <KpiStat
          value={
            <>
              {taux ?? "—"}
              {taux != null ? "%" : ""}
            </>
          }
          label="Taux de réalisation"
        />
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
