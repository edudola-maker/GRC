import { ActifITForm } from "@/components/actifs-it/ActifITForm";
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
import { createActifIT } from "../actions";

export const dynamic = "force-dynamic";

export default async function NouveauActifITPage({
  searchParams,
}: {
  searchParams: Promise<{ erreur?: string }>;
}) {
  const sp = await searchParams;
  const user = await getCurrentUser();
  const [usersRaw, suggestedCode] = await Promise.all([
    listUtilisateursActifsForCurrentUnite(),
    peekNextCode("ACTIF_IT", user.uniteId),
  ]);
  const users = usersRaw.map((u) => ({
    id: u.id,
    nom: formatUtilisateurNom(u),
  }));

  return (
    <>
      <BackLink href="/actifs-it" label="← Retour aux actifs IT" />
      <PageHeader
        title="Nouvel actif IT"
        help={<ModuleHelp {...MODULE_HELP.actifsIT} />}
      />
      <FlashBanner erreur={sp.erreur} />
      <div className="entity-form-wrap">
        <ActifITForm
          suggestedCode={suggestedCode}
          action={createActifIT}
          users={users}
          cancelHref="/actifs-it"
          submitLabel="Créer l’actif IT"
        />
      </div>
    </>
  );
}
