import { notFound, redirect } from "next/navigation";
import { ProcessusForm } from "@/components/EntityForms";
import { FlashBanner, BackLink } from "@/components/Flash";
import { ElementsAssocies } from "@/components/liens/ElementsAssocies";
import { PageHeader } from "@/components/ui";
import { getCurrentUser, listUtilisateursActifsForCurrentUnite } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { updateProcessus } from "../../actions";

export const dynamic = "force-dynamic";

export default async function ModifierProcessusPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ erreur?: string; ok?: string }>;
}) {
  const { id } = await params;
  const sp = await searchParams;
  const user = await getCurrentUser();
  const [processus, users, parents] = await Promise.all([
    prisma.processus.findUnique({ where: { id } }),
    listUtilisateursActifsForCurrentUnite(),
    prisma.processus.findMany({
      where: { uniteId: user.uniteId, archive: false, id: { not: id } },
      select: { id: true, nom: true, code: true },
      orderBy: { nom: "asc" },
    }),
  ]);

  if (!processus) notFound();
  if (processus.archive) {
    redirect(
      `/processus/${id}?erreur=${encodeURIComponent("Processus archivé : désarchivez-le pour le modifier.")}`,
    );
  }

  return (
    <>
      <BackLink
        href={`/processus/${processus.id}`}
        label="← Retour au processus"
      />
      <PageHeader title="Modifier le processus" description={processus.nom} />
      <FlashBanner ok={sp.ok} erreur={sp.erreur} />
      <div className="entity-form-wrap">
        <ProcessusForm
          action={updateProcessus}
          users={users}
          values={processus}
          parentProcessus={parents.map((p) => ({
            id: p.id,
            nom: `${p.code} — ${p.nom}`,
          }))}
          cancelHref={`/processus/${processus.id}`}
          submitLabel="Enregistrer"
        />
      </div>
      <ElementsAssocies
        uniteId={user.uniteId}
        type="PROCESSUS"
        id={processus.id}
        retour={`/processus/${processus.id}/modifier`}
        editable
      />
    </>
  );
}
