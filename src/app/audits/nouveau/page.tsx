import { AuditForm } from "@/components/EntityForms";
import { FlashBanner, BackLink } from "@/components/Flash";
import { PageHeader } from "@/components/ui";
import { listUtilisateursActifs } from "@/lib/session";
import { createAudit } from "../actions";

export const dynamic = "force-dynamic";

export default async function NouveauAuditPage({
  searchParams,
}: {
  searchParams: Promise<{ erreur?: string }>;
}) {
  const sp = await searchParams;
  const users = await listUtilisateursActifs();

  return (
    <>
      <BackLink href="/audits" label="← Retour aux audits" />
      <PageHeader
        title="Nouvel audit"
        description="Créez un audit puis ajoutez des recommandations et des tâches."
      />
      <FlashBanner erreur={sp.erreur} />
      <div className="panel">
        <AuditForm
          action={createAudit}
          users={users}
          cancelHref="/audits"
          submitLabel="Créer l'audit"
        />
      </div>
    </>
  );
}
