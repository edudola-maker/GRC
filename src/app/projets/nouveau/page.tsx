import { ProjetForm } from "@/components/EntityForms";
import { FlashBanner, BackLink } from "@/components/Flash";
import { PageHeader } from "@/components/ui";
import { listUtilisateursActifs } from "@/lib/session";
import { createProjet } from "../actions";

export const dynamic = "force-dynamic";

export default async function NouveauProjetPage({
  searchParams,
}: {
  searchParams: Promise<{ erreur?: string }>;
}) {
  const sp = await searchParams;
  const users = await listUtilisateursActifs();

  return (
    <>
      <BackLink href="/projets" label="← Retour aux projets" />
      <PageHeader
        title="Nouveau projet"
        description="Renseignez les informations essentielles. Vous pourrez y rattacher des tâches ensuite."
      />
      <FlashBanner erreur={sp.erreur} />
      <div className="panel">
        <ProjetForm
          action={createProjet}
          users={users}
          cancelHref="/projets"
          submitLabel="Créer le projet"
        />
      </div>
    </>
  );
}
