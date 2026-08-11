import { ControleSCIForm } from "@/components/EntityForms";
import { FlashBanner, BackLink } from "@/components/Flash";
import { PageHeader } from "@/components/ui";
import { listUtilisateursActifsForCurrentUnite } from "@/lib/session";
import { createControleSCI } from "../actions";

export const dynamic = "force-dynamic";

export default async function NouveauControleSCIPage({
  searchParams,
}: {
  searchParams: Promise<{ erreur?: string }>;
}) {
  const sp = await searchParams;
  const users = await listUtilisateursActifsForCurrentUnite();

  return (
    <>
      <BackLink href="/controles-sci" label="← Retour aux contrôles" />
      <PageHeader
        title="Nouveau contrôle SCI"
      />
      <FlashBanner erreur={sp.erreur} />
      <div className="entity-form-wrap">
        <ControleSCIForm
          action={createControleSCI}
          users={users}
          cancelHref="/controles-sci"
          submitLabel="Créer le contrôle"
        />
      </div>
    </>
  );
}
