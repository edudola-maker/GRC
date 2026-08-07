import { PageHeader, BtnLink } from "@/components/ui";
import { FlashBanner, BackLink } from "@/components/Flash";
import { SubmitButton } from "@/components/FormControls";
import {
  CATEGORIE_RISQUE_OPTIONS,
  ECHELLE_RISQUE,
  STATUT_RISQUE_OPTIONS,
} from "@/lib/catalog";
import { listUtilisateursActifs } from "@/lib/session";
import { createRisque } from "../actions";

export const dynamic = "force-dynamic";

export default async function NouveauRisquePage({
  searchParams,
}: {
  searchParams: Promise<{ erreur?: string }>;
}) {
  const sp = await searchParams;
  const users = await listUtilisateursActifs();

  return (
    <>
      <BackLink href="/risques" label="← Retour aux risques" />
      <PageHeader
        title="Nouveau risque"
        description="Identifiez un risque et évaluez sa criticité (probabilité × impact)."
      />
      <FlashBanner erreur={sp.erreur} />
      <div className="panel">
        <form action={createRisque} className="entity-form">
          <label className="field" htmlFor="nom">
            <span className="field__label">Nom *</span>
            <input
              id="nom"
              name="nom"
              required
              placeholder="Ex. Perte de données critiques"
            />
          </label>
          <label className="field" htmlFor="description">
            <span className="field__label">Description</span>
            <textarea id="description" name="description" rows={3} />
          </label>
          <div className="form-grid">
            <label className="field" htmlFor="processus">
              <span className="field__label">Processus</span>
              <input id="processus" name="processus" />
            </label>
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
            <label className="field" htmlFor="categorie">
              <span className="field__label">Catégorie *</span>
              <select
                id="categorie"
                name="categorie"
                required
                defaultValue="OPERATIONNEL"
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
              <select id="statut" name="statut" defaultValue="IDENTIFIE">
                {STATUT_RISQUE_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="field" htmlFor="probabilite">
              <span className="field__label">Probabilité (1–5)</span>
              <select id="probabilite" name="probabilite" defaultValue="1">
                {ECHELLE_RISQUE.map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>
            </label>
            <label className="field" htmlFor="impact">
              <span className="field__label">Impact (1–5)</span>
              <select id="impact" name="impact" defaultValue="1">
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
            <textarea id="commentaires" name="commentaires" rows={2} />
          </label>
          <div className="form-actions">
            <SubmitButton>Créer le risque</SubmitButton>
            <BtnLink href="/risques" variant="ghost">
              Annuler
            </BtnLink>
          </div>
        </form>
      </div>
    </>
  );
}
