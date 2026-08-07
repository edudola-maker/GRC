import { notFound } from "next/navigation";
import { PageHeader, BtnLink } from "@/components/ui";
import { FlashBanner, BackLink } from "@/components/Flash";
import { SubmitButton } from "@/components/FormControls";
import {
  CATEGORIE_RISQUE_OPTIONS,
  ECHELLE_RISQUE,
  STATUT_RISQUE_OPTIONS,
} from "@/lib/catalog";
import { listUtilisateursActifs } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { updateRisque } from "../../actions";

export const dynamic = "force-dynamic";

export default async function ModifierRisquePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ erreur?: string }>;
}) {
  const { id } = await params;
  const sp = await searchParams;
  const [risque, users] = await Promise.all([
    prisma.risque.findUnique({ where: { id } }),
    listUtilisateursActifs(),
  ]);
  if (!risque) notFound();

  return (
    <>
      <BackLink href={`/risques/${id}`} label="← Retour au risque" />
      <PageHeader title="Modifier le risque" description={risque.nom} />
      <FlashBanner erreur={sp.erreur} />
      <div className="panel">
        <form action={updateRisque} className="entity-form">
          <input type="hidden" name="id" value={risque.id} />
          <label className="field" htmlFor="nom">
            <span className="field__label">Nom *</span>
            <input id="nom" name="nom" required defaultValue={risque.nom} />
          </label>
          <label className="field" htmlFor="description">
            <span className="field__label">Description</span>
            <textarea
              id="description"
              name="description"
              rows={3}
              defaultValue={risque.description ?? ""}
            />
          </label>
          <div className="form-grid">
            <label className="field" htmlFor="processus">
              <span className="field__label">Processus</span>
              <input
                id="processus"
                name="processus"
                defaultValue={risque.processus ?? ""}
              />
            </label>
            <label className="field" htmlFor="responsableId">
              <span className="field__label">Responsable *</span>
              <select
                id="responsableId"
                name="responsableId"
                required
                defaultValue={risque.responsableId}
              >
                {users.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.nom}
                  </option>
                ))}
              </select>
            </label>
            <label className="field" htmlFor="categorie">
              <span className="field__label">Catégorie *</span>
              <select
                id="categorie"
                name="categorie"
                required
                defaultValue={risque.categorie}
              >
                {CATEGORIE_RISQUE_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="field" htmlFor="statut">
              <span className="field__label">Statut</span>
              <select id="statut" name="statut" defaultValue={risque.statut}>
                {STATUT_RISQUE_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="field" htmlFor="probabilite">
              <span className="field__label">Probabilité (1–5)</span>
              <select
                id="probabilite"
                name="probabilite"
                defaultValue={String(risque.probabilite)}
              >
                {ECHELLE_RISQUE.map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>
            </label>
            <label className="field" htmlFor="impact">
              <span className="field__label">Impact (1–5)</span>
              <select
                id="impact"
                name="impact"
                defaultValue={String(risque.impact)}
              >
                {ECHELLE_RISQUE.map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <label className="field" htmlFor="commentaires">
            <span className="field__label">Commentaires</span>
            <textarea
              id="commentaires"
              name="commentaires"
              rows={2}
              defaultValue={risque.commentaires ?? ""}
            />
          </label>
          <div className="form-actions">
            <SubmitButton>Enregistrer</SubmitButton>
            <BtnLink href={`/risques/${id}`} variant="ghost">
              Annuler
            </BtnLink>
          </div>
        </form>
      </div>
    </>
  );
}
