import { notFound, redirect } from "next/navigation";
import { AuditForm } from "@/components/EntityForms";
import { FlashBanner, BackLink } from "@/components/Flash";
import { PageHeader } from "@/components/ui";
import { ElementsAssocies } from "@/components/liens/ElementsAssocies";
import { getCurrentUser, listUtilisateursActifsForCurrentUnite } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { updateAudit } from "../../actions";

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
  const [audit, users] = await Promise.all([
    prisma.audit.findUnique({ where: { id } }),
    listUtilisateursActifsForCurrentUnite(),
  ]);

  if (!audit) notFound();
  if (audit.archive) {
    redirect(
      `/audits/${id}?erreur=${encodeURIComponent("Audit archivé : désarchivez-le pour le modifier.")}`,
    );
  }

  return (
    <>
      <BackLink href={`/audits/${audit.id}`} label="← Retour à la mission" />
      <PageHeader title="Modifier la mission" description={audit.titre} />
      <FlashBanner erreur={sp.erreur} />
      <div className="panel">
        <AuditForm
          action={updateAudit}
          users={users}
          values={audit}
          cancelHref={`/audits/${audit.id}`}
          submitLabel="Enregistrer"
        />
      </div>
      <ElementsAssocies
        uniteId={user.uniteId}
        type="AUDIT"
        id={audit.id}
        retour={`/audits/${audit.id}/modifier`}
        editable
      />
    </>
  );
}
