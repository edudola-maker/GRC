import { ControleSCIForm } from "@/components/EntityForms";
import { FlashBanner, BackLink } from "@/components/Flash";
import { PageHeader } from "@/components/ui";
import { peekNextCode } from "@/lib/codes";
import {
  formatUtilisateurNom,
  getCurrentUser,
  listUtilisateursActifsForCurrentUnite,
} from "@/lib/session";
import { listUnitesActives } from "@/lib/unites-referentiel";
import { createControleSCI } from "../actions";

export const dynamic = "force-dynamic";

export default async function NouveauControleSCIPage({
  searchParams,
}: {
  searchParams: Promise<{ erreur?: string }>;
}) {
  const sp = await searchParams;
  const user = await getCurrentUser();
  const [usersRaw, suggestedCode, unites] = await Promise.all([
    listUtilisateursActifsForCurrentUnite(),
    peekNextCode("CONTROLE_SCI", user.uniteId),
    listUnitesActives(),
  ]);
  const users = usersRaw.map((u) => ({
    id: u.id,
    nom: formatUtilisateurNom(u),
  }));

  return (
    <>
      <BackLink href="/controles-sci" label="← Retour aux contrôles" />
      <PageHeader title="Nouveau contrôle SCI" />
      <FlashBanner erreur={sp.erreur} />
      <div className="entity-form-wrap">
        <ControleSCIForm
          action={createControleSCI}
          users={users}
          unites={unites}
          values={{ uniteId: user.uniteId }}
          cancelHref="/controles-sci"
          submitLabel="Créer le contrôle"
          suggestedCode={suggestedCode}
        />
      </div>
    </>
  );
}
