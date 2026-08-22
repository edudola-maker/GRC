import { RisqueForm } from "@/components/EntityForms";
import { FlashBanner, BackLink } from "@/components/Flash";
import { ModuleHelp } from "@/components/ModuleHelp";
import { PageHeader } from "@/components/ui";
import { MODULE_HELP } from "@/lib/catalog";
import { peekNextCode } from "@/lib/codes";
import { prisma } from "@/lib/prisma";
import {
  formatUtilisateurNom,
  getCurrentUser,
  listUtilisateursActifsForCurrentUnite,
} from "@/lib/session";
import { listUnitesActives } from "@/lib/unites-referentiel";
import { createRisque } from "../actions";

export const dynamic = "force-dynamic";

export default async function NouveauRisquePage({
  searchParams,
}: {
  searchParams: Promise<{ erreur?: string }>;
}) {
  const sp = await searchParams;
  const user = await getCurrentUser();
  const [usersRaw, processus, suggestedCode, unites] = await Promise.all([
    listUtilisateursActifsForCurrentUnite(),
    prisma.processus.findMany({
      where: { uniteId: user.uniteId, archive: false },
      orderBy: { nom: "asc" },
      select: { id: true, code: true, nom: true },
    }),
    peekNextCode("RISQUE", user.uniteId),
    listUnitesActives(),
  ]);

  const users = usersRaw.map((u) => ({
    id: u.id,
    nom: formatUtilisateurNom(u),
  }));
  const processusOptions = processus.map((p) => ({
    id: p.id,
    label: `${p.code} — ${p.nom}`,
  }));

  return (
    <>
      <BackLink href="/risques" label="← Retour aux risques" />
      <PageHeader
        title="Nouveau risque"
        help={<ModuleHelp {...MODULE_HELP.risques} />}
      />
      <FlashBanner erreur={sp.erreur} />
      <div className="entity-form-wrap">
        <RisqueForm
          action={createRisque}
          users={users}
          unites={unites}
          values={{ uniteId: user.uniteId }}
          cancelHref="/risques"
          submitLabel="Créer le risque"
          processusOptions={processusOptions}
          suggestedCode={suggestedCode}
        />
      </div>
    </>
  );
}
