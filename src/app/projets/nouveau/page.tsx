import { ProjetForm } from "@/components/EntityForms";
import { FlashBanner, BackLink } from "@/components/Flash";
import { ModuleHelp } from "@/components/ModuleHelp";
import { PageHeader } from "@/components/ui";
import { MODULE_HELP } from "@/lib/catalog";
import { peekNextCode } from "@/lib/codes";
import {
  formatUtilisateurNom,
  getCurrentUser,
  listUtilisateursActifsForCurrentUnite,
} from "@/lib/session";
import { listUnitesActives } from "@/lib/unites-referentiel";
import { createProjet } from "../actions";

export const dynamic = "force-dynamic";

export default async function NouveauProjetPage({
  searchParams,
}: {
  searchParams: Promise<{ erreur?: string }>;
}) {
  const sp = await searchParams;
  const user = await getCurrentUser();
  const [usersRaw, suggestedCode, unites] = await Promise.all([
    listUtilisateursActifsForCurrentUnite(),
    peekNextCode("PROJET", user.uniteId),
    listUnitesActives(),
  ]);
  const users = usersRaw.map((u) => ({
    id: u.id,
    nom: formatUtilisateurNom(u),
  }));

  return (
    <>
      <BackLink href="/projets" label="← Retour aux projets" />
      <PageHeader
        title="Nouveau projet"
        help={<ModuleHelp {...MODULE_HELP.projets} />}
      />
      <FlashBanner erreur={sp.erreur} />
      <div className="entity-form-wrap">
        <ProjetForm
          action={createProjet}
          users={users}
          unites={unites}
          values={{ uniteId: user.uniteId }}
          cancelHref="/projets"
          submitLabel="Créer le projet"
          suggestedCode={suggestedCode}
        />
      </div>
    </>
  );
}
