import { notFound } from "next/navigation";
import { ProjetForm } from "@/components/EntityForms";
import { PageHeader } from "@/components/ui";
import { listUtilisateursActifs } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { updateProjet } from "../../actions";

export const dynamic = "force-dynamic";

export default async function ModifierProjetPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [projet, users] = await Promise.all([
    prisma.projet.findUnique({ where: { id } }),
    listUtilisateursActifs(),
  ]);

  if (!projet) notFound();

  return (
    <>
      <PageHeader
        title="Modifier le projet"
        description={projet.nom}
      />
      <div className="panel">
        <ProjetForm
          action={updateProjet}
          users={users}
          values={projet}
          cancelHref={`/projets/${projet.id}`}
          submitLabel="Enregistrer"
        />
      </div>
    </>
  );
}
