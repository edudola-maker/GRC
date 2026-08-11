import { ModeleTacheForm } from "@/components/modeles-taches/ModeleTacheForm";
import { FlashBanner, BackLink } from "@/components/Flash";
import { ModuleHelp } from "@/components/ModuleHelp";
import { PageHeader } from "@/components/ui";
import { MODULE_HELP } from "@/lib/catalog";
import { listUtilisateursActifsForCurrentUnite } from "@/lib/session";
import { createModeleTache } from "../actions";

export const dynamic = "force-dynamic";

export default async function NouveauModeleTachePage({
  searchParams,
}: {
  searchParams: Promise<{ erreur?: string }>;
}) {
  const sp = await searchParams;
  const users = await listUtilisateursActifsForCurrentUnite();

  return (
    <>
      <BackLink href="/modeles-taches" label="← Retour aux modèles" />
      <PageHeader
        title="Nouveau modèle de tâche"
        help={<ModuleHelp {...MODULE_HELP.modelesTaches} />}
      />
      <FlashBanner erreur={sp.erreur} />
      <div className="entity-form-wrap">
        <ModeleTacheForm
          action={createModeleTache}
          users={users}
          cancelHref="/modeles-taches"
          submitLabel="Créer le modèle"
        />
      </div>
    </>
  );
}
