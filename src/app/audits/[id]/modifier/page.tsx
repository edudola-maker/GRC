import { notFound, redirect } from "next/navigation";
import { MissionForm } from "@/components/EntityForms";
import { FlashBanner, BackLink } from "@/components/Flash";
import { PageHeader } from "@/components/ui";
import { ElementsAssocies } from "@/components/liens/ElementsAssocies";
import { getCurrentUser, listUtilisateursActifsForCurrentUnite } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { updateMission } from "../../actions";

export const dynamic = "force-dynamic";

export default async function ModifierAuditPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ erreur?: string }>;
}) {
  const { id } = await params;
  const sp = await searchParams;
  const user = await getCurrentUser();
  const [mission, users, types, templates, descriptifs] = await Promise.all([
    prisma.mission.findUnique({ where: { id } }),
    listUtilisateursActifsForCurrentUnite(),
    prisma.missionType.findMany({
      where: { actif: true },
      orderBy: { ordre: "asc" },
      select: { id: true, libelle: true },
    }),
    prisma.missionTemplate.findMany({
      where: { actif: true },
      orderBy: { libelle: "asc" },
      select: { id: true, libelle: true, typeId: true },
    }),
    prisma.missionDescriptifPreset.findMany({
      where: { actif: true },
      orderBy: { ordre: "asc" },
      select: { id: true, libelle: true, typeId: true },
    }),
  ]);

  if (!mission) notFound();
  if (mission.archive) {
    redirect(
      `/audits/${id}?erreur=${encodeURIComponent("Mission archivée : désarchivez-la pour la modifier.")}`,
    );
  }

  return (
    <>
      <BackLink href={`/audits/${mission.id}`} label="← Retour à la mission" />
      <PageHeader title="Modifier la mission" description={mission.titre} />
      <FlashBanner erreur={sp.erreur} />
      <div className="entity-form-wrap">
        <MissionForm
          action={updateMission}
          users={users}
          types={types}
          templates={templates}
          descriptifs={descriptifs}
          values={mission}
          cancelHref={`/audits/${mission.id}`}
          submitLabel="Enregistrer"
        />
      </div>
      <ElementsAssocies
        uniteId={user.uniteId}
        type="MISSION"
        id={mission.id}
        retour={`/audits/${mission.id}/modifier`}
        editable
      />
    </>
  );
}
