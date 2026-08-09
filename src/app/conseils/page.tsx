import { PageHeader, BtnLink } from "@/components/ui";
import { FlashBanner } from "@/components/Flash";
import { ModuleHelp } from "@/components/ModuleHelp";
import { KpiZone } from "@/components/module/KpiZone";
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
  startOfToday,
  urgenceEcheance,
} from "@/lib/labels";
import { prisma } from "@/lib/prisma";
import { getConseilDelaiCibleJours } from "@/lib/referentiels";
import { getCurrentUser, listUtilisateursActifsForCurrentUnite } from "@/lib/session";

export const dynamic = "force-dynamic";

export default async function ConseilsPage({
  searchParams,
}: {
  searchParams: Promise<{ ok?: string; erreur?: string; filtre?: string }>;
}) {
  const sp = await searchParams;
  const today = startOfToday();
  const user = await getCurrentUser();
  const uniteId = user.uniteId;

  const [conseils, responsables, delaiCible] = await Promise.all([
    prisma.conseil.findMany({
      where: { uniteId },
      include: { responsable: true },
      orderBy: { dateReception: "desc" },
    }),
    listUtilisateursActifsForCurrentUnite(),
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
  const enRetard = items.filter((c) => c.estRetard && !c.archive).length;

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

  const initialQuick = sp.filtre === "retard" ? "retard" : undefined;

  return (
    <>
      <PageHeader
        title="Conseils"
        description={`Demandes ponctuelles — délai cible ${delaiCible} jours ouvrés.`}
        help={<ModuleHelp {...MODULE_HELP.conseils} />}
        actions={<BtnLink href="/conseils/nouveau">Nouveau conseil</BtnLink>}
      />
      <FlashBanner ok={sp.ok} erreur={sp.erreur} />

      <KpiZone
        items={[
          { value: ouverts, label: "ouverts" },
          { value: clotures, label: "clôturés" },
          {
            value: (
              <>
                {tauxRespect ?? "—"}
                {tauxRespect != null ? "%" : ""}
              </>
            ),
            label: `respect délai ${delaiCible} j.`,
          },
          {
            value: enRetard,
            label: "à traiter",
            tone: enRetard > 0 ? "danger" : "default",
            href: enRetard > 0 ? "?filtre=retard#inventaire" : undefined,
          },
        ]}
      />

      <ConseilInventory
        items={items}
        responsables={responsables.map((r) => ({ id: r.id, nom: r.nom }))}
        initialQuick={initialQuick}
      />
    </>
  );
}
