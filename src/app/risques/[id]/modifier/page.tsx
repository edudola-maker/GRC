import { notFound } from "next/navigation";
import { RisqueForm } from "@/components/EntityForms";
import { FlashBanner, BackLink } from "@/components/Flash";
import { PageHeader } from "@/components/ui";
import { listUtilisateursActifsForCurrentUnite } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { updateRisque } from "../../actions";

export const dynamic = "force-dynamic";

export default async function ModifierRisquePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ erreur?: string }>;
}) {
  const { id } = await params;
  const sp = await searchParams;
  const [risque, users] = await Promise.all([
    prisma.risque.findUnique({ where: { id } }),
    listUtilisateursActifsForCurrentUnite(),
  ]);
  if (!risque) notFound();

  return (
    <>
      <BackLink href={`/risques/${id}`} label="← Retour au risque" />
      <PageHeader title="Modifier le risque" description={risque.nom} />
      <FlashBanner erreur={sp.erreur} />
      <div className="panel">
        <RisqueForm
          action={updateRisque}
          users={users}
          values={risque}
          cancelHref={`/risques/${id}`}
          submitLabel="Enregistrer"
        />
      </div>
    </>
  );
}
