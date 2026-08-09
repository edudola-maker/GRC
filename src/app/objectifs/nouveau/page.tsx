import { ObjectifForm } from "@/components/objectifs/ObjectifForm";
import { FlashBanner, BackLink } from "@/components/Flash";
import { ModuleHelp } from "@/components/ModuleHelp";
import { PageHeader } from "@/components/ui";
import { MODULE_HELP } from "@/lib/catalog";
import { listUtilisateursActifsForCurrentUnite } from "@/lib/session";
import { createObjectif } from "../actions";

export const dynamic = "force-dynamic";

export default async function NouveauObjectifPage({
  searchParams,
}: {
  searchParams: Promise<{ erreur?: string }>;
}) {
  const sp = await searchParams;
  const users = await listUtilisateursActifsForCurrentUnite();

  return (
    <>
      <BackLink href="/unite" label="← Retour à l’unité" />
      <PageHeader
        title="Nouvel objectif"
        description="Objectif stratégique de l’unité — le pourquoi. Liez ensuite les objets qui y contribuent."
      />
      <ModuleHelp {...MODULE_HELP.objectifs} />
      <FlashBanner erreur={sp.erreur} />
      <div className="entity-form-wrap">
        <ObjectifForm
          action={createObjectif}
          users={users}
          cancelHref="/unite"
          submitLabel="Créer l’objectif"
        />
      </div>
    </>
  );
}
