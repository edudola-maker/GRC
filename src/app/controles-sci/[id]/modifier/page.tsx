import { notFound } from "next/navigation";
import { PageHeader, BtnLink } from "@/components/ui";
import { FlashBanner, BackLink } from "@/components/Flash";
import { SubmitButton } from "@/components/FormControls";
import {
  FREQUENCE_CONTROLE_OPTIONS,
  STATUT_CONTROLE_OPTIONS,
} from "@/lib/catalog";
import { toDateInputValue } from "@/lib/form";
import { listUtilisateursActifs } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { updateControle } from "../../actions";

export const dynamic = "force-dynamic";

export default async function ModifierControleSCIPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ erreur?: string }>;
}) {
  const { id } = await params;
  const sp = await searchParams;
  const [controle, users] = await Promise.all([
    prisma.controleSCI.findUnique({ where: { id } }),
    listUtilisateursActifs(),
  ]);
  if (!controle) notFound();

  return (
    <>
      <BackLink
        href={`/controles-sci/${id}`}
        label="← Retour au contrôle"
      />
      <PageHeader title="Modifier le contrôle SCI" description={controle.nom} />
      <FlashBanner erreur={sp.erreur} />
      <div className="panel">
        <form action={updateControle} className="entity-form">
          <input type="hidden" name="id" value={controle.id} />
          <label className="field" htmlFor="nom">
            <span className="field__label">Nom *</span>
            <input
              id="nom"
              name="nom"
              required
              defaultValue={controle.nom}
            />
          </label>
          <label className="field" htmlFor="processusConcerne">
            <span className="field__label">Processus concerné *</span>
            <input
              id="processusConcerne"
              name="processusConcerne"
              required
              defaultValue={controle.processusConcerne}
            />
          </label>
          <label className="field" htmlFor="description">
            <span className="field__label">Description</span>
            <textarea
              id="description"
              name="description"
              rows={3}
              defaultValue={controle.description ?? ""}
            />
          </label>
          <div className="form-grid">
            <label className="field" htmlFor="responsableId">
              <span className="field__label">Responsable *</span>
              <select
                id="responsableId"
                name="responsableId"
                required
                defaultValue={controle.responsableId}
              >
                {users.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.nom}
                  </option>
                ))}
              </select>
            </label>
            <label className="field" htmlFor="frequence">
              <span className="field__label">Fréquence *</span>
              <select
                id="frequence"
                name="frequence"
                required
                defaultValue={controle.frequence}
              >
                {FREQUENCE_CONTROLE_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="field" htmlFor="statut">
              <span className="field__label">Statut</span>
              <select
                id="statut"
                name="statut"
                defaultValue={controle.statut}
              >
                {STATUT_CONTROLE_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="field" htmlFor="dateDerniereRealisation">
              <span className="field__label">Dernière réalisation</span>
              <input
                id="dateDerniereRealisation"
                name="dateDerniereRealisation"
                type="date"
                defaultValue={toDateInputValue(
                  controle.dateDerniereRealisation,
                )}
              />
            </label>
            <label className="field" htmlFor="dateProchaineEcheance">
              <span className="field__label">Prochaine échéance</span>
              <input
                id="dateProchaineEcheance"
                name="dateProchaineEcheance"
                type="date"
                defaultValue={toDateInputValue(
                  controle.dateProchaineEcheance,
                )}
              />
            </label>
          </div>
          <label className="field" htmlFor="commentaires">
            <span className="field__label">Commentaires</span>
            <textarea
              id="commentaires"
              name="commentaires"
              rows={2}
              defaultValue={controle.commentaires ?? ""}
            />
          </label>
          <div className="form-actions">
            <SubmitButton>Enregistrer</SubmitButton>
            <BtnLink href={`/controles-sci/${id}`} variant="ghost">
              Annuler
            </BtnLink>
          </div>
        </form>
      </div>
    </>
  );
}
