import { RisqueForm } from "@/components/EntityForms";
import { FlashBanner, BackLink } from "@/components/Flash";
import { ModuleHelp } from "@/components/ModuleHelp";
import { PageHeader } from "@/components/ui";
import { MODULE_HELP } from "@/lib/catalog";
import { listUtilisateursActifsForCurrentUnite } from "@/lib/session";
import { createRisque } from "../actions";

export const dynamic = "force-dynamic";

export default async function NouveauRisquePage({
  searchParams,
}: {
  searchParams: Promise<{ erreur?: string }>;
}) {
  const sp = await searchParams;
  const users = await listUtilisateursActifsForCurrentUnite();

  return (
    <>
      <BackLink href="/risques" label="← Retour aux risques" />
      <PageHeader
        title="Nouveau risque"
        description="Identifiez un risque et évaluez sa criticité (probabilité × impact)."
        help={<ModuleHelp {...MODULE_HELP.risques} />}
      />
      <FlashBanner erreur={sp.erreur} />
      <div className="entity-form-wrap">
        <RisqueForm
          action={createRisque}
          users={users}
          cancelHref="/risques"
          submitLabel="Créer le risque"
        />
      </div>
    </>
  );
}
