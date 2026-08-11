import { MissionForm } from "@/components/EntityForms";
import { FlashBanner, BackLink } from "@/components/Flash";
import { PageHeader } from "@/components/ui";
import { prisma } from "@/lib/prisma";
import { listUtilisateursActifsForCurrentUnite } from "@/lib/session";
import { createMission } from "../actions";

export const dynamic = "force-dynamic";

export default async function NouveauAuditPage({
  searchParams,
}: {
  searchParams: Promise<{ erreur?: string }>;
}) {
  const sp = await searchParams;
  const [users, types, templates, descriptifs] = await Promise.all([
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

  return (
    <>
      <BackLink href="/missions" label="← Retour aux missions" />
      <PageHeader
        title="Nouvelle mission"
      />
      <FlashBanner erreur={sp.erreur} />
      <div className="entity-form-wrap">
        <MissionForm
          action={createMission}
          users={users}
          types={types}
          templates={templates}
          descriptifs={descriptifs}
          cancelHref="/missions"
          submitLabel="Créer la mission"
        />
      </div>
    </>
  );
}
