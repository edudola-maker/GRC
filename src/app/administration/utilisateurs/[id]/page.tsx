import { notFound } from "next/navigation";
import { UtilisateurForm } from "@/components/administration/UtilisateurForm";
import { FlashBanner, BackLink } from "@/components/Flash";
import { PageHeader } from "@/components/ui";
import { ROLE_UTILISATEUR_LABELS } from "@/lib/labels";
import { prisma } from "@/lib/prisma";
import { formatUtilisateurNom } from "@/lib/session";
import { deleteUtilisateur, updateUtilisateur } from "../actions";

export const dynamic = "force-dynamic";

export default async function AdminUtilisateurDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ ok?: string; erreur?: string }>;
}) {
  const { id } = await params;
  const sp = await searchParams;

  const [user, unites] = await Promise.all([
    prisma.utilisateur.findUnique({
      where: { id },
      include: { unite: { select: { code: true, nom: true } } },
    }),
    prisma.unite.findMany({
      orderBy: { code: "asc" },
      select: { id: true, nom: true, code: true },
    }),
  ]);

  if (!user) notFound();

  return (
    <>
      <BackLink
        href="/administration/utilisateurs"
        label="← Retour aux utilisateurs"
      />
      <PageHeader
        title={formatUtilisateurNom(user)}
        badge={user.actif ? undefined : "Inactif"}
      />
      <FlashBanner ok={sp.ok} erreur={sp.erreur} />
      <div className="entity-form-wrap">
        <UtilisateurForm
          action={updateUtilisateur}
          deleteAction={deleteUtilisateur}
          unites={unites}
          values={{
            id: user.id,
            nom: user.nom,
            prenom: user.prenom,
            fonction: user.fonction,
            email: user.email,
            uniteId: user.uniteId,
            role: user.role,
            actif: user.actif,
          }}
          cancelHref="/administration/utilisateurs"
          submitLabel="Enregistrer"
        />
      </div>
    </>
  );
}
