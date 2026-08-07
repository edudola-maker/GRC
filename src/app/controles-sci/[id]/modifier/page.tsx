import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { ControleSCIForm } from "@/components/EntityForms";
import { FlashBanner, BackLink } from "@/components/Flash";
import { SubmitButton } from "@/components/FormControls";
import { ElementsAssocies } from "@/components/liens/ElementsAssocies";
import { PageHeader } from "@/components/ui";
import { getCurrentUser, listUtilisateursActifsForCurrentUnite } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import {
  delierRisqueControle,
  lierRisqueControle,
  updateControleSCI,
} from "../../actions";

export const dynamic = "force-dynamic";

export default async function ModifierControleSCIPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ erreur?: string; ok?: string }>;
}) {
  const { id } = await params;
  const sp = await searchParams;
  const user = await getCurrentUser();
  const [controle, users] = await Promise.all([
    prisma.controleSCI.findUnique({
      where: { id },
      include: {
        risques: { include: { risque: true }, orderBy: { creeLe: "desc" } },
      },
    }),
    listUtilisateursActifsForCurrentUnite(),
  ]);

  if (!controle) notFound();
  if (controle.archive) {
    redirect(
      `/controles-sci/${id}?erreur=${encodeURIComponent("Contrôle archivé : désarchivez-le pour le modifier.")}`,
    );
  }

  const risquesDispo = await prisma.risque.findMany({
    where: {
      uniteId: user.uniteId,
      archive: false,
      id: { notIn: controle.risques.map((r) => r.risqueId) },
    },
    orderBy: { nom: "asc" },
    select: { id: true, nom: true, code: true },
  });

  const retour = `/controles-sci/${controle.id}/modifier`;

  return (
    <>
      <BackLink
        href={`/controles-sci/${controle.id}`}
        label="← Retour au contrôle"
      />
      <PageHeader title="Modifier le contrôle" description={controle.nom} />
      <FlashBanner ok={sp.ok} erreur={sp.erreur} />
      <div className="panel">
        <ControleSCIForm
          action={updateControleSCI}
          users={users}
          values={controle}
          cancelHref={`/controles-sci/${controle.id}`}
          submitLabel="Enregistrer"
        />
        <p className="panel-hint">
          Statut Actif / Suspendu = définition du contrôle. L’exécution se
          gère via les occurrences (tâches). L’archivage se fait depuis la
          fiche.
        </p>
      </div>

      <div className="panel" style={{ marginTop: "1rem" }}>
        <h2 className="panel-title">
          Risques couverts ({controle.risques.length})
        </h2>
        {risquesDispo.length > 0 ? (
          <form action={lierRisqueControle} className="inline-form">
            <input type="hidden" name="controleSCIId" value={controle.id} />
            <input type="hidden" name="retour" value={retour} />
            <div className="inline-form__row">
              <label className="field" htmlFor="risqueId">
                <span className="field__label">Risque</span>
                <select id="risqueId" name="risqueId" required>
                  {risquesDispo.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.code} — {r.nom}
                    </option>
                  ))}
                </select>
              </label>
              <SubmitButton>Lier</SubmitButton>
            </div>
          </form>
        ) : null}
        {controle.risques.length === 0 ? (
          <p className="empty">Aucun risque associé.</p>
        ) : (
          <ul className="elements-associes__list">
            {controle.risques.map((rc) => (
              <li key={rc.id} className="elements-associes__row">
                <Link
                  href={`/risques/${rc.risque.id}`}
                  className="elements-associes__link"
                >
                  <span className="inventory-cell__value--code">
                    {rc.risque.code}
                  </span>
                  <span className="elements-associes__title">
                    {rc.risque.nom}
                  </span>
                </Link>
                <form action={delierRisqueControle}>
                  <input type="hidden" name="controleSCIId" value={controle.id} />
                  <input type="hidden" name="risqueId" value={rc.risqueId} />
                  <input type="hidden" name="retour" value={retour} />
                  <button type="submit" className="btn btn--ghost">
                    Retirer
                  </button>
                </form>
              </li>
            ))}
          </ul>
        )}
      </div>

      <ElementsAssocies
        uniteId={user.uniteId}
        type="CONTROLE_SCI"
        id={controle.id}
        retour={retour}
        editable
      />
    </>
  );
}
