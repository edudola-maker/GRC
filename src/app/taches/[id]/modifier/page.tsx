import { notFound } from "next/navigation";
import { TacheForm } from "@/components/EntityForms";
import { FlashBanner, BackLink } from "@/components/Flash";
import { ElementsAssocies } from "@/components/liens/ElementsAssocies";
import { CollapsibleSection } from "@/components/module/CollapsibleSection";
import { PageHeader } from "@/components/ui";
import { prisma } from "@/lib/prisma";
import { getCurrentUser, listUtilisateursActifsForCurrentUnite } from "@/lib/session";
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
  const user = await getCurrentUser();
  const uniteId = user.uniteId;
  const [tache, users, projets, conseils, controles, missions, documents] =
    await Promise.all([
      prisma.tache.findUnique({ where: { id } }),
      listUtilisateursActifsForCurrentUnite(),
      prisma.projet.findMany({
        where: {
          uniteId,
          archive: false,
          statut: { notIn: ["CLOTURE", "ABANDONNE"] },
        },
        orderBy: { nom: "asc" },
        select: { id: true, nom: true },
      }),
      prisma.conseil.findMany({
        where: { uniteId, archive: false },
        orderBy: { objet: "asc" },
        select: { id: true, objet: true },
      }),
      prisma.controleSCI.findMany({
        where: { uniteId, archive: false },
        orderBy: { nom: "asc" },
        select: { id: true, nom: true },
      }),
      prisma.mission.findMany({
        where: { uniteId, archive: false },
        orderBy: { titre: "asc" },
        select: { id: true, titre: true },
      }),
      prisma.document.findMany({
        where: { uniteId, archive: false },
        orderBy: { nom: "asc" },
        select: { id: true, nom: true },
      }),
    ]);

  if (!tache) notFound();

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
      <CollapsibleSection title="Formulaire" defaultOpen>
        <TacheForm
          action={updateTache}
          users={users}
          projets={projetsOptions}
          conseils={conseils.map((c) => ({ id: c.id, nom: c.objet }))}
          controles={controles}
          missions={missions.map((a) => ({ id: a.id, nom: a.titre }))}
          documents={documents}
          values={tache}
          cancelHref={`/taches/${tache.id}`}
          submitLabel="Enregistrer"
        />
      </CollapsibleSection>
      <ElementsAssocies
        uniteId={user.uniteId}
        type="TACHE"
        id={tache.id}
        retour={`/taches/${tache.id}/modifier`}
        editable
      />
    </>
  );
}
