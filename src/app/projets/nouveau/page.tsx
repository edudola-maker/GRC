import { ProjetForm } from "@/components/EntityForms";
import { FlashBanner, BackLink } from "@/components/Flash";
import { ModuleHelp } from "@/components/ModuleHelp";
import { PageHeader } from "@/components/ui";
import { MODULE_HELP } from "@/lib/catalog";
import { listUtilisateursActifsForCurrentUnite } from "@/lib/session";
import { createProjet } from "../actions";

export const dynamic = "force-dynamic";

export default async function NouveauProjetPage({
  searchParams,
}: {
  searchParams: Promise<{ erreur?: string }>;
}) {
  const sp = await searchParams;
  const users = await listUtilisateursActifsForCurrentUnite();

  return (
    <>
      <BackLink href="/projets" label="← Retour aux projets" />
      <PageHeader
        title="Nouveau projet"
        description="Renseignez les informations essentielles. Vous pourrez y rattacher des tâches ensuite."
        help={<ModuleHelp {...MODULE_HELP.projets} />}
      />
      <FlashBanner erreur={sp.erreur} />
      <div className="entity-form-wrap">
        <ProjetForm
          action={createProjet}
          users={users}
          cancelHref="/projets"
          submitLabel="Créer le projet"
        />
      </div>
    </>
  );
}
