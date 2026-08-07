import { notFound, redirect } from "next/navigation";
import { ConseilForm } from "@/components/EntityForms";
import { FlashBanner, BackLink } from "@/components/Flash";
import { PageHeader } from "@/components/ui";
import { ElementsAssocies } from "@/components/liens/ElementsAssocies";
import { getCurrentUser, listUtilisateursActifsForCurrentUnite } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { updateConseil } from "../../actions";

export const dynamic = "force-dynamic";

export default async function ModifierConseilPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ erreur?: string }>;
}) {
  const { id } = await params;
  const sp = await searchParams;
  const user = await getCurrentUser();
  const [conseil, users] = await Promise.all([
    prisma.conseil.findUnique({ where: { id } }),
    listUtilisateursActifsForCurrentUnite(),
  ]);

  if (!conseil) notFound();
  if (conseil.archive) {
    redirect(
      `/conseils/${id}?erreur=${encodeURIComponent("Conseil archivé : désarchivez-le pour le modifier.")}`,
    );
  }

  return (
    <>
      <BackLink href={`/conseils/${conseil.id}`} label="← Retour au conseil" />
      <PageHeader title="Modifier le conseil" description={conseil.objet} />
      <FlashBanner erreur={sp.erreur} />
      <div className="panel">
        <ConseilForm
          action={updateConseil}
          users={users}
          values={conseil}
          cancelHref={`/conseils/${conseil.id}`}
          submitLabel="Enregistrer"
        />
      </div>
      <ElementsAssocies
        uniteId={user.uniteId}
        type="CONSEIL"
        id={conseil.id}
        retour={`/conseils/${conseil.id}/modifier`}
        editable
      />
    </>
  );
}
