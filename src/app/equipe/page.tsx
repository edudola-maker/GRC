import { PageHeader } from "@/components/ui";
import { getEquipeOverview } from "@/lib/equipe";
import { formatDate } from "@/lib/labels";

export const dynamic = "force-dynamic";

export default async function EquipePage() {
  const equipe = await getEquipeOverview();

  return (
    <>
      <PageHeader
        title="Équipe"
        description="Vue responsable d'unité — charge, retards et objectifs annuels par collaborateur."
      />

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
              Objectifs {new Date().getFullYear()}
            </h3>
            {c.objectifs.length === 0 ? (
              <p className="empty">Aucun objectif renseigné.</p>
            ) : (
              <ul className="history-list">
                {c.objectifs.map((o) => (
                  <li key={o.id}>
                    <strong>{o.objectif}</strong>
                    <span>
                      Progression {o.progression}%
                      {o.attenduAnnuel ? ` · Attendu : ${o.attenduAnnuel}` : ""}
                      {o.realiseADate ? ` · Réalisé : ${o.realiseADate}` : ""}
                    </span>
                    <em>Échéance {formatDate(o.dateEcheance)}</em>
                  </li>
                ))}
              </ul>
            )}
          </article>
        ))}
      </div>
    </>
  );
}
