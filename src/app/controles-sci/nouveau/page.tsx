import { PageHeader, BtnLink } from "@/components/ui";
import { FlashBanner, BackLink } from "@/components/Flash";
import { SubmitButton } from "@/components/FormControls";
import {
  FREQUENCE_CONTROLE_OPTIONS,
  STATUT_CONTROLE_OPTIONS,
} from "@/lib/catalog";
import { toDateInputValue } from "@/lib/form";
import { listUtilisateursActifs } from "@/lib/session";
import { createControle } from "../actions";

export const dynamic = "force-dynamic";

export default async function NouveauControleSCIPage({
  searchParams,
}: {
  searchParams: Promise<{ erreur?: string }>;
}) {
  const sp = await searchParams;
  const users = await listUtilisateursActifs();

  return (
    <>
      <BackLink href="/controles-sci" label="← Retour aux contrôles SCI" />
      <PageHeader
        title="Nouveau contrôle SCI"
        description="Définissez le contrôle périodique, sa fréquence et son responsable."
      />
      <FlashBanner erreur={sp.erreur} />
      <div className="panel">
        <form action={createControle} className="entity-form">
          <label className="field" htmlFor="nom">
            <span className="field__label">Nom *</span>
            <input
              id="nom"
              name="nom"
              required
              placeholder="Ex. Revue des accès applicatifs"
            />
          </label>
          <label className="field" htmlFor="processusConcerne">
            <span className="field__label">Processus concerné *</span>
            <input
              id="processusConcerne"
              name="processusConcerne"
              required
              placeholder="Ex. Gestion des accès"
            />
          </label>
          <label className="field" htmlFor="description">
            <span className="field__label">Description</span>
            <textarea id="description" name="description" rows={3} />
          </label>
          <div className="form-grid">
            <label className="field" htmlFor="responsableId">
              <span className="field__label">Responsable *</span>
              <select
                id="responsableId"
                name="responsableId"
                required
                defaultValue={users[0]?.id}
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
                defaultValue="TRIMESTRIELLE"
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
              <select id="statut" name="statut" defaultValue="A_REALISER">
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
                defaultValue={toDateInputValue(null)}
              />
            </label>
            <label className="field" htmlFor="dateProchaineEcheance">
              <span className="field__label">Prochaine échéance</span>
              <input
                id="dateProchaineEcheance"
                name="dateProchaineEcheance"
                type="date"
              />
            </label>
          </div>
          <label className="field" htmlFor="commentaires">
            <span className="field__label">Commentaires</span>
            <textarea id="commentaires" name="commentaires" rows={2} />
          </label>
          <div className="form-actions">
            <SubmitButton>Créer le contrôle</SubmitButton>
            <BtnLink href="/controles-sci" variant="ghost">
              Annuler
            </BtnLink>
          </div>
        </form>
      </div>
    </>
  );
}
