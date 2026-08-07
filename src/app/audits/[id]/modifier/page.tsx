import { notFound, redirect } from "next/navigation";
import { AuditForm } from "@/components/EntityForms";
import { FlashBanner, BackLink } from "@/components/Flash";
import { PageHeader } from "@/components/ui";
import { listUtilisateursActifs } from "@/lib/session";
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
  const [audit, users] = await Promise.all([
    prisma.audit.findUnique({ where: { id } }),
    listUtilisateursActifs(),
  ]);

  if (!audit) notFound();
  if (audit.archive) {
    redirect(
      `/audits/${id}?erreur=${encodeURIComponent("Audit archivé : désarchivez-le pour le modifier.")}`,
    );
  }

  return (
    <>
      <BackLink href={`/audits/${audit.id}`} label="← Retour à l'audit" />
      <PageHeader title="Modifier l'audit" description={audit.titre} />
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
    </>
  );
}
