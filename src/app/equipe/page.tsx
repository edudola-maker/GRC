import { FlashBanner } from "@/components/Flash";
import { SubmitButton } from "@/components/FormControls";
import { PageHeader } from "@/components/ui";
import { getEquipeOverview } from "@/lib/equipe";
import { toDateInputValue } from "@/lib/form";
import { formatDate } from "@/lib/labels";
import {
  createObjectif,
  deleteObjectif,
  updateObjectif,
} from "./actions";

export const dynamic = "force-dynamic";

export default async function EquipePage({
  searchParams,
}: {
  searchParams: Promise<{ ok?: string; erreur?: string }>;
}) {
  const sp = await searchParams;
  const equipe = await getEquipeOverview();
  const annee = new Date().getFullYear();

  return (
    <>
      <PageHeader
        title="Équipe"
        description="Vue responsable d'unité — charge, retards et objectifs annuels par collaborateur."
      />
      <FlashBanner ok={sp.ok} erreur={sp.erreur} />

      <div className="equipe-grid">
        {equipe.map((c) => (
          <article key={c.utilisateurId} className="panel equipe-card">
            <header className="equipe-card__head">
              <h2>{c.nom}</h2>
              <span className="equipe-card__charge">
                Charge approx. : {c.chargeApproximative}
              </span>
            </header>
            <dl className="kv">
              <div>
                <dt>Projets</dt>
                <dd>{c.projetsEnCours}</dd>
              </div>
              <div>
                <dt>Conseils</dt>
                <dd>{c.conseilsEnCours}</dd>
              </div>
              <div>
                <dt>Audits</dt>
                <dd>{c.auditsEnCours}</dd>
              </div>
              <div>
                <dt>Tâches</dt>
                <dd>{c.tachesEnCours}</dd>
              </div>
              <div>
                <dt>Contrôles SCI</dt>
                <dd>{c.controlesEnCours}</dd>
              </div>
              <div>
                <dt>En retard</dt>
                <dd className={c.elementsEnRetard > 0 ? "text-danger" : undefined}>
                  {c.elementsEnRetard}
                </dd>
              </div>
            </dl>

            <h3 className="panel-title" style={{ marginTop: "1rem" }}>
              Objectifs {annee}
            </h3>
            {c.objectifs.length === 0 ? (
              <p className="empty">Aucun objectif renseigné.</p>
            ) : (
              <ul className="history-list">
                {c.objectifs.map((o) => (
                  <li key={o.id}>
                    <form action={updateObjectif} className="entity-form" style={{ gap: "0.4rem" }}>
                      <input type="hidden" name="id" value={o.id} />
                      <strong>{o.objectif}</strong>
                      <div className="form-grid">
                        <label className="field" htmlFor={`att-${o.id}`}>
                          <span className="field__label">Attendu</span>
                          <input
                            id={`att-${o.id}`}
                            name="attenduAnnuel"
                            defaultValue={o.attenduAnnuel ?? ""}
                          />
                        </label>
                        <label className="field" htmlFor={`rea-${o.id}`}>
                          <span className="field__label">Réalisé</span>
                          <input
                            id={`rea-${o.id}`}
                            name="realiseADate"
                            defaultValue={o.realiseADate ?? ""}
                          />
                        </label>
                        <label className="field" htmlFor={`prog-${o.id}`}>
                          <span className="field__label">Progression %</span>
                          <input
                            id={`prog-${o.id}`}
                            name="progression"
                            type="number"
                            min={0}
                            max={100}
                            defaultValue={o.progression}
                          />
                        </label>
                        <label className="field" htmlFor={`ech-${o.id}`}>
                          <span className="field__label">Échéance</span>
                          <input
                            id={`ech-${o.id}`}
                            name="dateEcheance"
                            type="date"
                            defaultValue={toDateInputValue(o.dateEcheance)}
                          />
                        </label>
                      </div>
                      <input type="hidden" name="objectif" value={o.objectif} />
                      <div className="form-actions">
                        <SubmitButton pendingLabel="…">Mettre à jour</SubmitButton>
                      </div>
                      <span className="entity-row__meta">
                        Échéance actuelle : {formatDate(o.dateEcheance)}
                      </span>
                    </form>
                    <form action={deleteObjectif} style={{ marginTop: "0.35rem" }}>
                      <input type="hidden" name="id" value={o.id} />
                      <SubmitButton variant="ghost" pendingLabel="…">
                        Supprimer
                      </SubmitButton>
                    </form>
                  </li>
                ))}
              </ul>
            )}

            <form action={createObjectif} className="entity-form" style={{ marginTop: "0.85rem" }}>
              <input type="hidden" name="utilisateurId" value={c.utilisateurId} />
              <input type="hidden" name="annee" value={annee} />
              <label className="field" htmlFor={`obj-${c.utilisateurId}`}>
                <span className="field__label">Nouvel objectif</span>
                <input
                  id={`obj-${c.utilisateurId}`}
                  name="objectif"
                  required
                  placeholder="Ex. Clôturer 4 missions"
                />
              </label>
              <div className="form-grid">
                <label className="field" htmlFor={`natt-${c.utilisateurId}`}>
                  <span className="field__label">Attendu annuel</span>
                  <input id={`natt-${c.utilisateurId}`} name="attenduAnnuel" />
                </label>
                <label className="field" htmlFor={`nprog-${c.utilisateurId}`}>
                  <span className="field__label">Progression %</span>
                  <input
                    id={`nprog-${c.utilisateurId}`}
                    name="progression"
                    type="number"
                    min={0}
                    max={100}
                    defaultValue={0}
                  />
                </label>
              </div>
              <SubmitButton>Ajouter</SubmitButton>
            </form>
          </article>
        ))}
      </div>
    </>
  );
}
