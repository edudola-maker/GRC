import { ConseilForm } from "@/components/EntityForms";
import { FlashBanner, BackLink } from "@/components/Flash";
import { ModuleHelp } from "@/components/ModuleHelp";
import { PageHeader } from "@/components/ui";
import { CONSEIL_DELAI_CIBLE_JOURS, MODULE_HELP } from "@/lib/catalog";
import { addBusinessDays } from "@/lib/dates";
import { listUtilisateursActifsForCurrentUnite } from "@/lib/session";
import { createConseil } from "../actions";

export const dynamic = "force-dynamic";

export default async function NouveauConseilPage({
  searchParams,
}: {
  searchParams: Promise<{ erreur?: string }>;
}) {
  const sp = await searchParams;
  const users = await listUtilisateursActifsForCurrentUnite();
  const today = new Date();
  const echeance = addBusinessDays(today, CONSEIL_DELAI_CIBLE_JOURS);

  return (
    <>
      <BackLink href="/conseils" label="← Retour aux conseils" />
      <PageHeader
        title="Nouveau conseil"
        description="Demande ponctuelle — échéance par défaut à 5 jours ouvrés."
        help={<ModuleHelp {...MODULE_HELP.conseils} />}
      />
      <FlashBanner erreur={sp.erreur} />
      <div className="entity-form-wrap">
        <ConseilForm
          action={createConseil}
          users={users}
          values={{ dateReception: today, dateEcheance: echeance }}
          cancelHref="/conseils"
          submitLabel="Créer le conseil"
          showCreerTache
        />
      </div>
    </>
  );
}
