import { PageHeader, BtnLink } from "@/components/ui";
import { FlashBanner } from "@/components/Flash";
import { ModuleHelp } from "@/components/ModuleHelp";
import { AttentionZone } from "@/components/module/AttentionZone";
import { KpiStat, KpiZone } from "@/components/module/KpiZone";
import {
  ConseilInventory,
  type ConseilInventoryItem,
} from "@/components/conseils/ConseilInventory";
import {
  CONSEIL_STATUTS_CLOS,
  MODULE_HELP,
} from "@/lib/catalog";
import { businessDaysBetween } from "@/lib/dates";
import {
  STATUT_CONSEIL_LABELS,
  formatDateDot,
  startOfToday,
  urgenceEcheance,
} from "@/lib/labels";
import { prisma } from "@/lib/prisma";
import { getConseilDelaiCibleJours, listReferentiel } from "@/lib/referentiels";
import { getCurrentUser, listUtilisateursActifsForCurrentUnite } from "@/lib/session";

export const dynamic = "force-dynamic";

export default async function ConseilsPage({
  searchParams,
}: {
  searchParams: Promise<{ ok?: string; erreur?: string }>;
}) {
  const sp = await searchParams;
  const today = startOfToday();
  const user = await getCurrentUser();
  const uniteId = user.uniteId;

  const [conseils, responsables, taxinomies, delaiCible] = await Promise.all([
    prisma.conseil.findMany({
      where: { uniteId },
      include: { responsable: true },
      orderBy: { dateReception: "desc" },
    }),
    listUtilisateursActifsForCurrentUnite(),
    listReferentiel("TAXINOMIE"),
    getConseilDelaiCibleJours(uniteId),
  ]);

  const items: ConseilInventoryItem[] = conseils.map((c) => {
    const estClos = (CONSEIL_STATUTS_CLOS as readonly string[]).includes(
      c.statut,
    );
    const estOuvert = !estClos;
    const estRetard = Boolean(
      estOuvert && c.dateEcheance && c.dateEcheance < today,
    );
    return {
      id: c.id,
      code: c.code,
      objet: c.objet,
      tags: c.tags,
      taxinomie: c.taxinomie,
      demandeur: c.demandeur,
      entiteDemandeuse: c.entiteDemandeuse,
      statut: c.statut,
      statutLabel: STATUT_CONSEIL_LABELS[c.statut] ?? c.statut,
      responsableId: c.responsableId,
      responsableNom: c.responsable.nom,
      dateReception: c.dateReception.toISOString(),
      dateEcheance: c.dateEcheance?.toISOString() ?? null,
      dateCloture: c.dateCloture?.toISOString() ?? null,
      archive: c.archive,
      urgence: urgenceEcheance(c.dateEcheance, estClos || c.archive),
      estOuvert,
      estClos,
      estRetard,
    };
  });

  const actifs = conseils.filter((c) => !c.archive);
  const ouverts = actifs.filter(
    (c) => !(CONSEIL_STATUTS_CLOS as readonly string[]).includes(c.statut),
  ).length;
  const clotures = actifs.filter((c) => c.statut === "CLOTURE").length;
  const enRetardItems = items.filter((c) => c.estRetard && !c.archive);
  const enRetard = enRetardItems.length;

  const closAvecDelai = actifs.filter(
    (c) =>
      (c.statut === "CLOTURE" || c.statut === "REPONDU") &&
      (c.dateCloture || c.dateReponse),
  );
  const respects = closAvecDelai.filter((c) => {
    const fin = c.dateCloture ?? c.dateReponse;
    if (!fin) return false;
    return businessDaysBetween(c.dateReception, fin) <= delaiCible;
  }).length;
  const tauxRespect =
    closAvecDelai.length > 0
      ? Math.round((respects / closAvecDelai.length) * 100)
      : null;

  return (
    <>
      <PageHeader
        title="Conseils"
        description={`Demandes ponctuelles adressées à l'unité — délai cible ${delaiCible} jours ouvrés.`}
        actions={<BtnLink href="/conseils/nouveau">Nouveau conseil</BtnLink>}
      />
      <ModuleHelp {...MODULE_HELP.conseils} />
      <FlashBanner ok={sp.ok} erreur={sp.erreur} />

      <KpiZone>
        <KpiStat value={ouverts} label="Ouverts" />
        <KpiStat value={clotures} label="Clôturés" />
        <KpiStat value={enRetard} label="En retard" />
        <KpiStat
          value={
            <>
              {tauxRespect ?? "—"}
              {tauxRespect != null ? "%" : ""}
            </>
          }
          label={`Respect délai ${delaiCible} j.`}
        />
      </KpiZone>

      <AttentionZone
        items={enRetardItems.map((c) => ({
          id: c.id,
          href: `/conseils/${c.id}`,
          code: c.code,
          title: c.objet,
          meta: `${c.responsableNom}${c.dateEcheance ? ` · éch. ${formatDateDot(c.dateEcheance)}` : ""}`,
        }))}
        moreHint={
          <>
            +{Math.max(0, enRetardItems.length - 5)} autre
            {enRetardItems.length - 5 > 1 ? "s" : ""} en retard — utiliser le
            filtre « En retard » ci-dessous.
          </>
        }
      />

      <ConseilInventory
        items={items}
        responsables={responsables.map((r) => ({ id: r.id, nom: r.nom }))}
        taxinomies={taxinomies}
      />
    </>
  );
}
