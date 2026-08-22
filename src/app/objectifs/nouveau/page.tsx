import { ObjectifForm } from "@/components/objectifs/ObjectifForm";
import { FlashBanner, BackLink } from "@/components/Flash";
import { ModuleHelp } from "@/components/ModuleHelp";
import { PageHeader } from "@/components/ui";
import { MODULE_HELP } from "@/lib/catalog";
import { prisma } from "@/lib/prisma";
import {
  getCurrentUser,
  listUtilisateursActifsForCurrentUnite,
} from "@/lib/session";
import { createObjectif } from "../actions";

export const dynamic = "force-dynamic";

export default async function NouveauObjectifPage({
  searchParams,
}: {
  searchParams: Promise<{ erreur?: string }>;
}) {
  const sp = await searchParams;
  const user = await getCurrentUser();
  const [users, attributions] = await Promise.all([
    listUtilisateursActifsForCurrentUnite(),
    prisma.uniteAttribution.findMany({
      where: { uniteId: user.uniteId, actif: true },
      select: { id: true, titre: true },
      orderBy: [{ ordre: "asc" }, { titre: "asc" }],
    }),
  ]);

  return (
    <>
      <BackLink href="/unite" label="← Retour à l’unité" />
      <PageHeader
        title="Nouvel objectif"
        help={<ModuleHelp {...MODULE_HELP.objectifs} />}
      />
      <FlashBanner erreur={sp.erreur} />
      <div className="entity-form-wrap">
        <ObjectifForm
          action={createObjectif}
          users={users}
          attributions={attributions}
          cancelHref="/unite"
          submitLabel="Créer l’objectif"
        />
      </div>
    </>
  );
}
