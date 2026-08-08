import { notFound, redirect } from "next/navigation";
import { ProjetForm } from "@/components/EntityForms";
import { FlashBanner, BackLink } from "@/components/Flash";
import { PageHeader } from "@/components/ui";
import { ElementsAssocies } from "@/components/liens/ElementsAssocies";
import { getCurrentUser, listUtilisateursActifsForCurrentUnite } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { updateProjet } from "../../actions";

export const dynamic = "force-dynamic";

export default async function ModifierProjetPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ erreur?: string }>;
}) {
  const { id } = await params;
  const sp = await searchParams;
  const user = await getCurrentUser();
  const [projet, users] = await Promise.all([
    prisma.projet.findUnique({ where: { id } }),
    listUtilisateursActifsForCurrentUnite(),
  ]);

  if (!projet) notFound();
  if (projet.archive) {
    redirect(`/projets/${id}?erreur=${encodeURIComponent("Projet archivé : désarchivez-le pour le modifier.")}`);
  }

  return (
    <>
      <BackLink href={`/projets/${projet.id}`} label="← Retour au projet" />
      <PageHeader title="Modifier le projet" description={projet.nom} />
      <FlashBanner erreur={sp.erreur} />
      <div className="entity-form-wrap">
        <ProjetForm
          action={updateProjet}
          users={users}
          values={projet}
          cancelHref={`/projets/${projet.id}`}
          submitLabel="Enregistrer"
        />
      </div>
      <ElementsAssocies
        uniteId={user.uniteId}
        type="PROJET"
        id={projet.id}
        retour={`/projets/${projet.id}/modifier`}
        editable
      />
    </>
  );
}
