import { TacheForm } from "@/components/EntityForms";
import { FlashBanner, BackLink } from "@/components/Flash";
import { PageHeader } from "@/components/ui";
import { prisma } from "@/lib/prisma";
import { listUtilisateursActifs } from "@/lib/session";
import { createTache } from "../actions";

export const dynamic = "force-dynamic";

export default async function NouvelleTachePage({
  searchParams,
}: {
  searchParams: Promise<{
    projetId?: string;
    conseilId?: string;
    controleSCIId?: string;
    auditId?: string;
    documentId?: string;
    recommandationId?: string;
    categorie?: string;
    erreur?: string;
  }>;
}) {
  const sp = await searchParams;
  const [users, projets] = await Promise.all([
    listUtilisateursActifs(),
    prisma.projet.findMany({
      where: { archive: false, statut: { notIn: ["ANNULE"] } },
      orderBy: { nom: "asc" },
      select: { id: true, nom: true },
    }),
  ]);

  let categorie =
    sp.categorie ??
    (sp.projetId
      ? "PROJET"
      : sp.conseilId
        ? "CONSEIL"
        : sp.controleSCIId
          ? "SCI"
          : sp.auditId || sp.recommandationId
            ? "AUDIT"
            : sp.documentId
              ? "DOCUMENT"
              : "AUTRE");

  const isConseil = categorie === "CONSEIL";

  return (
    <>
      <BackLink href="/taches" label="← Retour aux tâches" />
      <PageHeader
        title={isConseil ? "Nouvelle demande Conseil" : "Nouvelle tâche"}
        description={
          isConseil
            ? "Créez une demande ponctuelle sans projet associé (analyse, recherche, avis)."
            : "Une tâche peut être indépendante ou rattachée à un objet métier."
        }
      />
      <FlashBanner erreur={sp.erreur} />
      <div className="panel">
        <TacheForm
          action={createTache}
          users={users}
          projets={projets}
          values={{
            projetId: sp.projetId ?? null,
            conseilId: sp.conseilId ?? null,
            controleSCIId: sp.controleSCIId ?? null,
            auditId: sp.auditId ?? null,
            documentId: sp.documentId ?? null,
            recommandationId: sp.recommandationId ?? null,
            categorie,
          }}
          cancelHref="/taches"
          submitLabel="Créer la tâche"
          defaultCategorie={categorie}
        />
      </div>
    </>
  );
}
