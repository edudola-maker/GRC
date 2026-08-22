import { MissionForm } from "@/components/EntityForms";
import { FlashBanner, BackLink } from "@/components/Flash";
import { PageHeader } from "@/components/ui";
import { peekNextCode } from "@/lib/codes";
import { prisma } from "@/lib/prisma";
import {
  formatUtilisateurNom,
  getCurrentUser,
  listUtilisateursActifsForCurrentUnite,
} from "@/lib/session";
import { listUnitesActives } from "@/lib/unites-referentiel";
import { createMission } from "../actions";

export const dynamic = "force-dynamic";

export default async function NouveauAuditPage({
  searchParams,
}: {
  searchParams: Promise<{ erreur?: string }>;
}) {
  const sp = await searchParams;
  const current = await getCurrentUser();
  const [usersRaw, types, templates, descriptifs, suggestedCode, unites] =
    await Promise.all([
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
      peekNextCode("MISSION", current.uniteId),
      listUnitesActives(),
    ]);

  const users = usersRaw.map((u) => ({
    id: u.id,
    nom: formatUtilisateurNom(u),
  }));

  return (
    <>
      <BackLink href="/missions" label="← Retour aux missions" />
      <PageHeader title="Nouvelle mission" />
      <FlashBanner erreur={sp.erreur} />
      <div className="entity-form-wrap">
        <MissionForm
          action={createMission}
          users={users}
          unites={unites}
          types={types}
          templates={templates}
          descriptifs={descriptifs}
          values={{ uniteId: current.uniteId }}
          cancelHref="/missions"
          submitLabel="Créer la mission"
          suggestedCode={suggestedCode}
        />
      </div>
    </>
  );
}
