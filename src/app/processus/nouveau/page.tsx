import { ProcessusForm } from "@/components/EntityForms";
import { FlashBanner, BackLink } from "@/components/Flash";
import { ModuleHelp } from "@/components/ModuleHelp";
import { PageHeader } from "@/components/ui";
import { MODULE_HELP } from "@/lib/catalog";
import { listUtilisateursActifsForCurrentUnite } from "@/lib/session";
import { createProcessus } from "../actions";

export const dynamic = "force-dynamic";

export default async function NouveauProcessusPage({
  searchParams,
}: {
  searchParams: Promise<{ erreur?: string }>;
}) {
  const sp = await searchParams;
  const users = await listUtilisateursActifsForCurrentUnite();

  return (
    <>
      <BackLink href="/processus" label="← Retour aux processus" />
      <PageHeader
        title="Nouveau processus"
        description="Processus = quoi l’on fait. La procédure détaillée reste dans Confluence."
      />
      <ModuleHelp {...MODULE_HELP.processus} />
      <FlashBanner erreur={sp.erreur} />
      <div className="entity-form-wrap">
        <ProcessusForm
          action={createProcessus}
          users={users}
          cancelHref="/processus"
          submitLabel="Créer le processus"
        />
      </div>
    </>
  );
}
