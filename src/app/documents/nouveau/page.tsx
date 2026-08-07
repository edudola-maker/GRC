import { DocumentForm } from "@/components/EntityForms";
import { FlashBanner, BackLink } from "@/components/Flash";
import { PageHeader } from "@/components/ui";
import { listUtilisateursActifs } from "@/lib/session";
import { createDocument } from "../actions";

export const dynamic = "force-dynamic";

export default async function NouveauDocumentPage({
  searchParams,
}: {
  searchParams: Promise<{ erreur?: string }>;
}) {
  const sp = await searchParams;
  const users = await listUtilisateursActifs();

  return (
    <>
      <BackLink href="/documents" label="← Retour aux documents" />
      <PageHeader
        title="Nouveau document"
        description="Ajoutez un document à l'inventaire. La prochaine revue peut être calculée automatiquement."
      />
      <FlashBanner erreur={sp.erreur} />
      <div className="panel">
        <DocumentForm
          action={createDocument}
          users={users}
          cancelHref="/documents"
          submitLabel="Créer le document"
        />
      </div>
    </>
  );
}
