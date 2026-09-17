import { ObjectifForm } from "@/components/objectifs/ObjectifForm";
import { FlashBanner, BackLink } from "@/components/Flash";
import { ModuleHelp } from "@/components/ModuleHelp";
import { PageHeader } from "@/components/ui";
import { MODULE_HELP } from "@/lib/catalog";
import { getOrgContext } from "@/lib/organisation";
import { prisma } from "@/lib/prisma";
import {
  formatUtilisateurNom,
  listUtilisateursActifsForCurrentUnite,
} from "@/lib/session";
import { createObjectif } from "../actions";

export const dynamic = "force-dynamic";

export default async function NouveauObjectifPage({
  searchParams,
}: {
  searchParams: Promise<{ erreur?: string }>;
}) {
  const sp = await searchParams;
  const ctx = await getOrgContext();
  const [users, attributions, axes] = await Promise.all([
    listUtilisateursActifsForCurrentUnite(),
    prisma.uniteAttribution.findMany({
      where: { uniteId: ctx.uniteId, actif: true },
      select: { id: true, titre: true },
      orderBy: [{ ordre: "asc" }, { titre: "asc" }],
    }),
    prisma.axeStrategique.findMany({
      where: { organisationId: ctx.organisationId, statut: "ACTIF" },
      select: { id: true, code: true, titre: true },
      orderBy: { ordre: "asc" },
    }),
  ]);

  return (
    <>
      <BackLink href="/objectifs" label="← Retour aux objectifs" />
      <PageHeader
        title="Nouvel objectif"
        help={<ModuleHelp {...MODULE_HELP.objectifs} />}
      />
      <FlashBanner erreur={sp.erreur} />
      <div className="entity-form-wrap">
        <ObjectifForm
          action={createObjectif}
          users={users.map((u) => ({
            id: u.id,
            nom: formatUtilisateurNom(u),
          }))}
          attributions={attributions}
          axes={axes}
          cancelHref="/objectifs"
          submitLabel="Créer l’objectif"
        />
      </div>
    </>
  );
}
