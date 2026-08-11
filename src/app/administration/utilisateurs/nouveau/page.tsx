import { UtilisateurForm } from "@/components/administration/UtilisateurForm";
import { FlashBanner, BackLink } from "@/components/Flash";
import { PageHeader } from "@/components/ui";
import { prisma } from "@/lib/prisma";
import { createUtilisateur } from "../actions";

export const dynamic = "force-dynamic";

export default async function NouveauUtilisateurPage({
  searchParams,
}: {
  searchParams: Promise<{ erreur?: string }>;
}) {
  const sp = await searchParams;
  const unites = await prisma.unite.findMany({
    where: { actif: true },
    orderBy: { code: "asc" },
    select: { id: true, nom: true, code: true },
  });

  return (
    <>
      <BackLink
        href="/administration/utilisateurs"
        label="← Retour aux utilisateurs"
      />
      <PageHeader
        title="Nouvel utilisateur"
      />
      <FlashBanner erreur={sp.erreur} />
      <div className="entity-form-wrap">
        <UtilisateurForm
          action={createUtilisateur}
          unites={unites}
          cancelHref="/administration/utilisateurs"
          submitLabel="Créer l’utilisateur"
        />
      </div>
    </>
  );
}
