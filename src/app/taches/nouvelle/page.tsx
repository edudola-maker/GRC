import { TacheForm } from "@/components/EntityForms";
import { FlashBanner, BackLink } from "@/components/Flash";
import { CollapsibleSection } from "@/components/module/CollapsibleSection";
import { PageHeader } from "@/components/ui";
import { safeRetourPath } from "@/lib/navigation-retour";
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
    missionId?: string;
    auditId?: string;
    documentId?: string;
    recommandationId?: string;
    categorie?: string;
    erreur?: string;
    retour?: string;
  }>;
}) {
  const sp = await searchParams;
  const retour = safeRetourPath(
    sp.retour,
    sp.projetId
      ? `/projets/${sp.projetId}`
      : sp.conseilId
        ? `/conseils/${sp.conseilId}`
        : sp.missionId || sp.auditId
          ? `/missions/${sp.missionId ?? sp.auditId}`
          : "/taches",
  );
  const user = await getCurrentUser();
  const uniteId = user.uniteId;
  const missionId = sp.missionId ?? sp.auditId;
  const [users, projets, conseils, controles, missions, documents] =
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

  const categorie =
    sp.categorie ??
    (sp.projetId
      ? "PROJET"
      : sp.conseilId
        ? "CONSEIL"
        : sp.controleSCIId
          ? "SCI"
          : missionId || sp.recommandationId
            ? "MISSION"
            : sp.documentId
              ? "DOCUMENT"
              : "AUTRE");

  const isConseil = categorie === "CONSEIL";

  const backLabel =
    retour.startsWith("/projets/")
      ? "← Retour au projet"
      : retour.startsWith("/conseils/")
        ? "← Retour au conseil"
        : retour.startsWith("/missions/")
          ? "← Retour à la mission"
          : "← Retour aux tâches";

  return (
    <>
      <BackLink href={retour} label={backLabel} />
      <PageHeader
        title={isConseil ? "Nouvelle demande Conseil" : "Créer une action"}
        description={
          isConseil
            ? "Créez une demande ponctuelle sans projet associé (analyse, recherche, avis)."
            : "De préférence, créez l'action depuis un objet métier. Une action libre reste possible pour un cas ponctuel."
        }
      />
      <FlashBanner erreur={sp.erreur} />
      <CollapsibleSection title="Formulaire" defaultOpen>
        <TacheForm
          action={createTache}
          users={users}
          projets={projets}
          conseils={conseils.map((c) => ({ id: c.id, nom: c.objet }))}
          controles={controles}
          missions={missions.map((a) => ({ id: a.id, nom: a.titre }))}
          documents={documents}
          values={{
            projetId: sp.projetId ?? null,
            conseilId: sp.conseilId ?? null,
            controleSCIId: sp.controleSCIId ?? null,
            missionId: missionId ?? null,
            documentId: sp.documentId ?? null,
            recommandationId: sp.recommandationId ?? null,
            categorie,
          }}
          cancelHref={retour}
          submitLabel="Créer l'action"
          defaultCategorie={categorie}
          projetContext={Boolean(sp.projetId)}
          retour={retour !== "/taches" ? retour : undefined}
        />
      </CollapsibleSection>
    </>
  );
}
