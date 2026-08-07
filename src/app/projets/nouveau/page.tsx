import { ProjetForm } from "@/components/EntityForms";
import { PageHeader } from "@/components/ui";
import { listUtilisateursActifs } from "@/lib/session";
import { createProjet } from "../actions";

export const dynamic = "force-dynamic";

export default async function NouveauProjetPage() {
  const users = await listUtilisateursActifs();

  return (
    <>
      <PageHeader
        title="Nouveau projet"
        description="Renseignez les informations essentielles. Vous pourrez y rattacher des tâches ensuite."
      />
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
