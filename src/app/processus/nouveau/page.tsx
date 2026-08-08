import { ProcessusForm } from "@/components/EntityForms";
import { FlashBanner, BackLink } from "@/components/Flash";
import { ModuleHelp } from "@/components/ModuleHelp";
import { PageHeader } from "@/components/ui";
import { MODULE_HELP } from "@/lib/catalog";
import { getCurrentUser, listUtilisateursActifsForCurrentUnite } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { createProcessus } from "../actions";

export const dynamic = "force-dynamic";

export default async function NouveauProcessusPage({
  searchParams,
}: {
  searchParams: Promise<{ erreur?: string }>;
}) {
  const sp = await searchParams;
  const user = await getCurrentUser();
  const [users, parents] = await Promise.all([
    listUtilisateursActifsForCurrentUnite(),
    prisma.processus.findMany({
      where: { uniteId: user.uniteId, archive: false },
      select: { id: true, nom: true, code: true },
      orderBy: { nom: "asc" },
    }),
  ]);

  return (
    <>
      <BackLink href="/processus" label="← Retour aux processus" />
      <PageHeader
        title="Nouveau processus"
        description="Créez une entrée du référentiel. La documentation détaillée reste dans Confluence."
      />
      <ModuleHelp {...MODULE_HELP.processus} />
      <FlashBanner erreur={sp.erreur} />
      <div className="panel">
        <ProcessusForm
          action={createProcessus}
          users={users}
          parentProcessus={parents.map((p) => ({
            id: p.id,
            nom: `${p.code} — ${p.nom}`,
          }))}
          cancelHref="/processus"
          submitLabel="Créer le processus"
        />
      </div>
    </>
  );
}
