import { TacheForm } from "@/components/EntityForms";
import { FlashBanner, BackLink } from "@/components/Flash";
import { PageHeader } from "@/components/ui";
import { prisma } from "@/lib/prisma";
import { getCurrentUser, listUtilisateursActifsForCurrentUnite } from "@/lib/session";
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
  const user = await getCurrentUser();
  const uniteId = user.uniteId;
  const [users, projets, conseils, controles, audits, documents] =
    await Promise.all([
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
      prisma.audit.findMany({
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

  const categorie =
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
      <BackLink href="/" label="← Retour au tableau de bord" />
      <PageHeader
        title={isConseil ? "Nouvelle demande Conseil" : "Créer une action"}
        description={
          isConseil
            ? "Créez une demande ponctuelle sans projet associé (analyse, recherche, avis)."
            : "De préférence, créez l'action depuis un objet métier. Une action libre reste possible pour un cas ponctuel."
        }
      />
      <FlashBanner erreur={sp.erreur} />
      <div className="panel">
        <TacheForm
          action={createTache}
          users={users}
          projets={projets}
          conseils={conseils.map((c) => ({ id: c.id, nom: c.objet }))}
          controles={controles}
          audits={audits.map((a) => ({ id: a.id, nom: a.titre }))}
          documents={documents}
          values={{
            projetId: sp.projetId ?? null,
            conseilId: sp.conseilId ?? null,
            controleSCIId: sp.controleSCIId ?? null,
            auditId: sp.auditId ?? null,
            documentId: sp.documentId ?? null,
            recommandationId: sp.recommandationId ?? null,
            categorie,
          }}
          cancelHref="/"
          submitLabel="Créer l'action"
          defaultCategorie={categorie}
        />
      </div>
    </>
  );
}
