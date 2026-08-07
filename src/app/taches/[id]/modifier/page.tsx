import { notFound } from "next/navigation";
import { TacheForm } from "@/components/EntityForms";
import { PageHeader } from "@/components/ui";
import { prisma } from "@/lib/prisma";
import { listUtilisateursActifs } from "@/lib/session";
import { updateTache } from "../../actions";

export const dynamic = "force-dynamic";

export default async function ModifierTachePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [tache, users, projets] = await Promise.all([
    prisma.tache.findUnique({ where: { id } }),
    listUtilisateursActifs(),
    prisma.projet.findMany({
      where: { statut: { notIn: ["ANNULE"] } },
      orderBy: { nom: "asc" },
      select: { id: true, nom: true },
    }),
  ]);

  if (!tache) notFound();

  return (
    <>
      <PageHeader title="Modifier la tâche" description={tache.titre} />
      <div className="panel">
        <TacheForm
          action={updateTache}
          users={users}
          projets={projets}
          values={tache}
          cancelHref={`/taches/${tache.id}`}
          submitLabel="Enregistrer"
        />
      </div>
    </>
  );
}
