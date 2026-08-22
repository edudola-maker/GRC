import { ProcessusForm } from "@/components/EntityForms";
import { FlashBanner, BackLink } from "@/components/Flash";
import { ModuleHelp } from "@/components/ModuleHelp";
import { PageHeader } from "@/components/ui";
import { MODULE_HELP } from "@/lib/catalog";
import { peekNextCode } from "@/lib/codes";
import { listUnitesActives } from "@/lib/unites-referentiel";
import { prisma } from "@/lib/prisma";
import {
  getCurrentUser,
  listUtilisateursActifsForCurrentUnite,
} from "@/lib/session";
import { createProcessus } from "../actions";

export const dynamic = "force-dynamic";

export default async function NouveauProcessusPage({
  searchParams,
}: {
  searchParams: Promise<{ erreur?: string }>;
}) {
  const sp = await searchParams;
  const user = await getCurrentUser();
  const [users, suggestedCode, unites, macros] = await Promise.all([
    listUtilisateursActifsForCurrentUnite(),
    peekNextCode("PROCESSUS", user.uniteId),
    listUnitesActives(),
    prisma.macroprocessus.findMany({
      where: {
        OR: [
          { uniteId: user.uniteId },
          { unitesApplicables: { some: { uniteId: user.uniteId } } },
        ],
        archive: false,
      },
      select: { id: true, code: true, nom: true },
      orderBy: [{ ordre: "asc" }, { nom: "asc" }],
    }),
  ]);

  return (
    <>
      <BackLink href="/processus" label="← Retour aux processus" />
      <PageHeader
        title="Nouveau processus"
        help={<ModuleHelp {...MODULE_HELP.processus} />}
      />
      <FlashBanner erreur={sp.erreur} />
      <div className="entity-form-wrap">
        <ProcessusForm
          suggestedCode={suggestedCode}
          action={createProcessus}
          users={users}
          unites={unites}
          macros={macros}
          values={{ uniteId: user.uniteId }}
          cancelHref="/processus"
          submitLabel="Créer le processus"
        />
      </div>
    </>
  );
}
