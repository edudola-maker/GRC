import { notFound } from "next/navigation";
import { UniteAdminForm } from "@/components/administration/UniteAdminForm";
import { FlashBanner, BackLink } from "@/components/Flash";
import { PageHeader } from "@/components/ui";
import { prisma } from "@/lib/prisma";
import { formatUtilisateurNom } from "@/lib/session";
import { updateUniteAdmin } from "../actions";

export const dynamic = "force-dynamic";

export default async function AdminUniteDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ ok?: string; erreur?: string }>;
}) {
  const { id } = await params;
  const sp = await searchParams;

  const [unite, users] = await Promise.all([
    prisma.unite.findUnique({
      where: { id },
      include: { responsable: true, adjoint: true },
    }),
    prisma.utilisateur.findMany({
      where: { uniteId: id, actif: true },
      orderBy: { nom: "asc" },
    }),
  ]);

  if (!unite) notFound();

  return (
    <>
      <BackLink href="/administration/unites" label="← Retour aux unités" />
      <PageHeader
        title={`${unite.code} — ${unite.nom}`}
        badge={unite.actif ? undefined : "Inactif"}
      />
      <FlashBanner ok={sp.ok} erreur={sp.erreur} />
      <div className="entity-form-wrap">
        <UniteAdminForm
          action={updateUniteAdmin}
          users={users.map((u) => ({
            id: u.id,
            nom: formatUtilisateurNom(u),
          }))}
          values={{
            id: unite.id,
            code: unite.code,
            nom: unite.nom,
            description: unite.description,
            responsableId: unite.responsableId,
            adjointId: unite.adjointId,
            actif: unite.actif,
          }}
          cancelHref="/administration/unites"
          submitLabel="Enregistrer"
        />
      </div>
    </>
  );
}
