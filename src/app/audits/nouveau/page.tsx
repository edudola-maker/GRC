import { AuditForm } from "@/components/EntityForms";
import { FlashBanner, BackLink } from "@/components/Flash";
import { PageHeader } from "@/components/ui";
import { listUtilisateursActifsForCurrentUnite } from "@/lib/session";
import { createAudit } from "../actions";

export const dynamic = "force-dynamic";

export default async function NouveauAuditPage({
  searchParams,
}: {
  searchParams: Promise<{ erreur?: string }>;
}) {
  const sp = await searchParams;
  const users = await listUtilisateursActifsForCurrentUnite();

  return (
    <>
      <BackLink href="/audits" label="← Retour aux audits" />
      <PageHeader
        title="Nouvel audit"
        description="Définissez le titre, le périmètre et le calendrier de la mission."
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
