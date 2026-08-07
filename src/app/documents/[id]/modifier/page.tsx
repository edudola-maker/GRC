import { notFound, redirect } from "next/navigation";
import { DocumentForm } from "@/components/EntityForms";
import { FlashBanner, BackLink } from "@/components/Flash";
import { PageHeader } from "@/components/ui";
import { listUtilisateursActifs } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { updateDocument } from "../../actions";

export const dynamic = "force-dynamic";

export default async function ModifierDocumentPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ erreur?: string }>;
}) {
  const { id } = await params;
  const sp = await searchParams;
  const [document, users] = await Promise.all([
    prisma.document.findUnique({ where: { id } }),
    listUtilisateursActifs(),
  ]);

  if (!document) notFound();
  if (document.archive) {
    redirect(
      `/documents/${id}?erreur=${encodeURIComponent("Document archivé : désarchivez-le pour le modifier.")}`,
    );
  }

  return (
    <>
      <BackLink href={`/documents/${document.id}`} label="← Retour au document" />
      <PageHeader title="Modifier le document" description={document.nom} />
      <FlashBanner erreur={sp.erreur} />
      <div className="panel">
        <DocumentForm
          action={updateDocument}
          users={users}
          values={document}
          cancelHref={`/documents/${document.id}`}
          submitLabel="Enregistrer"
        />
      </div>
    </>
  );
}
