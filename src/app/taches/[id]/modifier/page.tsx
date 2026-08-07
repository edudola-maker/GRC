import { notFound } from "next/navigation";
import { TacheForm } from "@/components/EntityForms";
import { FlashBanner, BackLink } from "@/components/Flash";
import { PageHeader } from "@/components/ui";
import { prisma } from "@/lib/prisma";
import { listUtilisateursActifs } from "@/lib/session";
import { updateTache } from "../../actions";

export const dynamic = "force-dynamic";

export default async function ModifierTachePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ erreur?: string }>;
}) {
  const { id } = await params;
  const sp = await searchParams;
  const [tache, users, projets] = await Promise.all([
    prisma.tache.findUnique({ where: { id } }),
    listUtilisateursActifs(),
    prisma.projet.findMany({
      where: { archive: false, statut: { notIn: ["ANNULE"] } },
      orderBy: { nom: "asc" },
      select: { id: true, nom: true },
    }),
  ]);

  if (!tache) notFound();

  // Si la tâche est liée à un projet archivé, l'inclure pour ne pas perdre le lien
  let projetsOptions = projets;
  if (tache.projetId && !projets.some((p) => p.id === tache.projetId)) {
    const linked = await prisma.projet.findUnique({
      where: { id: tache.projetId },
      select: { id: true, nom: true, archive: true },
    });
    if (linked) {
      projetsOptions = [
        {
          id: linked.id,
          nom: linked.archive ? `${linked.nom} (archivé)` : linked.nom,
        },
        ...projets,
      ];
    }
  }

  return (
    <>
      <BackLink href={`/taches/${tache.id}`} label="← Retour à la tâche" />
      <PageHeader title="Modifier la tâche" description={tache.titre} />
      <FlashBanner erreur={sp.erreur} />
      <div className="panel">
        <TacheForm
          action={updateTache}
          users={users}
          projets={projetsOptions}
          values={tache}
          cancelHref={`/taches/${tache.id}`}
          submitLabel="Enregistrer"
        />
      </div>
    </>
  );
}
