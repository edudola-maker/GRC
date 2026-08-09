import { UniteAdminForm } from "@/components/administration/UniteAdminForm";
import { FlashBanner, BackLink } from "@/components/Flash";
import { PageHeader } from "@/components/ui";
import { createUnite } from "../actions";

export const dynamic = "force-dynamic";

export default async function NouvelleUniteAdminPage({
  searchParams,
}: {
  searchParams: Promise<{ erreur?: string }>;
}) {
  const sp = await searchParams;

  return (
    <>
      <BackLink href="/administration/unites" label="← Retour aux unités" />
      <PageHeader
        title="Nouvelle unité"
        description="Le code UNT-xxxx est attribué automatiquement. Assignez responsable et adjoint après avoir rattaché des utilisateurs."
      />
      <FlashBanner erreur={sp.erreur} />
      <div className="entity-form-wrap">
        <UniteAdminForm
          action={createUnite}
          users={[]}
          cancelHref="/administration/unites"
          submitLabel="Créer l’unité"
        />
      </div>
    </>
  );
}
