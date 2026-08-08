import { notFound, redirect } from "next/navigation";
import { RisqueForm } from "@/components/EntityForms";
import { FlashBanner, BackLink } from "@/components/Flash";
import { SubmitButton } from "@/components/FormControls";
import { ElementsAssocies } from "@/components/liens/ElementsAssocies";
import { CollapsibleSection } from "@/components/module/CollapsibleSection";
import { PageHeader } from "@/components/ui";
import { formatDate } from "@/lib/labels";
import { getCurrentUser, listUtilisateursActifsForCurrentUnite } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { setRisqueControles, updateRisque } from "../../actions";

export const dynamic = "force-dynamic";

export default async function ModifierRisquePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ erreur?: string; ok?: string }>;
}) {
  const { id } = await params;
  const sp = await searchParams;
  const user = await getCurrentUser();
  const [risque, users, controlesActifs] = await Promise.all([
    prisma.risque.findUnique({
      where: { id },
      include: { controles: true },
    }),
    listUtilisateursActifsForCurrentUnite(),
    prisma.controleSCI.findMany({
      where: { archive: false, uniteId: user.uniteId, statut: "ACTIF" },
      include: { responsable: true },
      orderBy: { nom: "asc" },
    }),
  ]);
  if (!risque) notFound();
  if (risque.archive) {
    redirect(
      `/risques/${id}?erreur=${encodeURIComponent("Risque archivé : désarchivez-le pour le modifier.")}`,
    );
  }

  const linkedIds = new Set(risque.controles.map((l) => l.controleSCIId));
  const retour = `/risques/${risque.id}/modifier`;

  return (
    <>
      <BackLink href={`/risques/${id}`} label="← Retour au risque" />
      <PageHeader title="Modifier le risque" description={risque.nom} />
      <FlashBanner ok={sp.ok} erreur={sp.erreur} />
      <div className="entity-form-wrap">
        <RisqueForm
          action={updateRisque}
          users={users}
          values={risque}
          cancelHref={`/risques/${id}`}
          submitLabel="Enregistrer"
        />
      </div>

      <CollapsibleSection title="Contrôles SCI liés" defaultOpen>
        {controlesActifs.length === 0 ? (
          <p className="empty">Aucun contrôle SCI actif disponible.</p>
        ) : (
          <form action={setRisqueControles} className="entity-form">
            <input type="hidden" name="risqueId" value={risque.id} />
            <input type="hidden" name="retour" value={retour} />
            <ul className="check-list">
              {controlesActifs.map((c) => (
                <li key={c.id}>
                  <label
                    className="field"
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      gap: "0.5rem",
                    }}
                  >
                    <input
                      type="checkbox"
                      name="controleIds"
                      value={c.id}
                      defaultChecked={linkedIds.has(c.id)}
                    />
                    <span className="field__label" style={{ margin: 0 }}>
                      {c.code} — {c.nom}
                      <span className="muted">
                        {" "}
                        · {c.responsable.nom}
                        {c.dateProchaineEcheance
                          ? ` · ${formatDate(c.dateProchaineEcheance)}`
                          : ""}
                      </span>
                    </span>
                  </label>
                </li>
              ))}
            </ul>
            <div className="form-actions">
              <SubmitButton>Enregistrer les liens SCI</SubmitButton>
            </div>
          </form>
        )}
      </CollapsibleSection>

      <ElementsAssocies
        uniteId={user.uniteId}
        type="RISQUE"
        id={risque.id}
        retour={retour}
        editable
      />
    </>
  );
}
