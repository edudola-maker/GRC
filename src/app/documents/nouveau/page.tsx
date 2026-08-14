import { DocumentForm } from "@/components/EntityForms";
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
import { createDocument } from "../actions";

export const dynamic = "force-dynamic";

export default async function NouveauDocumentPage({
  searchParams,
}: {
  searchParams: Promise<{ erreur?: string }>;
}) {
  const sp = await searchParams;
  const user = await getCurrentUser();
  const [usersRaw, suggestedCode] = await Promise.all([
    listUtilisateursActifsForCurrentUnite(),
    peekNextCode("DOCUMENT", user.uniteId),
  ]);
  const users = usersRaw.map((u) => ({
    id: u.id,
    nom: formatUtilisateurNom(u),
  }));

  return (
    <>
      <BackLink href="/documents" label="← Retour aux documents" />
      <PageHeader
        title="Nouveau document"
        help={<ModuleHelp {...MODULE_HELP.documents} />}
      />
      <FlashBanner erreur={sp.erreur} />
      <div className="entity-form-wrap">
        <DocumentForm
          action={createDocument}
          users={users}
          cancelHref="/documents"
          submitLabel="Créer le document"
          suggestedCode={suggestedCode}
        />
      </div>
    </>
  );
}
