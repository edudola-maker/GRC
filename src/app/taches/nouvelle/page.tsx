import { TacheForm } from "@/components/EntityForms";
import { PageHeader } from "@/components/ui";
import { prisma } from "@/lib/prisma";
import { listUtilisateursActifs } from "@/lib/session";
import { createTache } from "../actions";

export const dynamic = "force-dynamic";

export default async function NouvelleTachePage({
  searchParams,
}: {
  searchParams: Promise<{ projetId?: string; categorie?: string }>;
}) {
  const sp = await searchParams;
  const [users, projets] = await Promise.all([
    listUtilisateursActifs(),
    prisma.projet.findMany({
      where: { statut: { notIn: ["ANNULE"] } },
      orderBy: { nom: "asc" },
      select: { id: true, nom: true },
    }),
  ]);

  const isConseil = sp.categorie === "CONSEIL";

  return (
    <>
      <PageHeader
        title={isConseil ? "Nouvelle demande Conseil" : "Nouvelle tâche"}
        description={
          isConseil
            ? "Créez une demande ponctuelle sans projet associé (analyse, recherche, avis)."
            : "Une tâche peut être indépendante ou rattachée à un projet."
        }
      />
      <div className="panel">
        <TacheForm
          action={createTache}
          users={users}
          projets={projets}
          values={{
            projetId: sp.projetId ?? null,
            categorie: sp.categorie ?? (sp.projetId ? "PROJET" : "AUTRE"),
          }}
          cancelHref="/taches"
          submitLabel="Créer la tâche"
          defaultCategorie={sp.categorie ?? undefined}
        />
      </div>
    </>
  );
}
