import { notFound, redirect } from "next/navigation";
import { ControleSCIForm } from "@/components/EntityForms";
import { FlashBanner, BackLink } from "@/components/Flash";
import { PageHeader } from "@/components/ui";
import { listUtilisateursActifsForCurrentUnite } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { updateControleSCI } from "../../actions";

export const dynamic = "force-dynamic";

export default async function ModifierControleSCIPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ erreur?: string }>;
}) {
  const { id } = await params;
  const sp = await searchParams;
  const [controle, users] = await Promise.all([
    prisma.controleSCI.findUnique({ where: { id } }),
    listUtilisateursActifsForCurrentUnite(),
  ]);

  if (!controle) notFound();
  if (controle.archive) {
    redirect(
      `/controles-sci/${id}?erreur=${encodeURIComponent("Contrôle archivé : désarchivez-le pour le modifier.")}`,
    );
  }

  return (
    <>
      <BackLink
        href={`/controles-sci/${controle.id}`}
        label="← Retour au contrôle"
      />
      <PageHeader title="Modifier le contrôle" description={controle.nom} />
      <FlashBanner erreur={sp.erreur} />
      <div className="panel">
        <ControleSCIForm
          action={updateControleSCI}
          users={users}
          values={controle}
          cancelHref={`/controles-sci/${controle.id}`}
          submitLabel="Enregistrer"
        />
        <p className="panel-hint">
          Passer le statut à « Réalisé » recalcule la prochaine échéance et
          relance le cycle (sauf contrôle ponctuel).
        </p>
      </div>
    </>
  );
}
