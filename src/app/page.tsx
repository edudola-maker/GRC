import {
  FREQUENCE_LABELS,
  PRIORITE_LABELS,
  formatDate,
} from "@/lib/labels";
import { getPilotageDashboard } from "@/lib/pilotage";

export const dynamic = "force-dynamic";

function Stat({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone?: "warn" | "danger" | "info";
}) {
  return (
    <div className={`stat${tone ? ` stat--${tone}` : ""}`}>
      <span className="stat__label">{label}</span>
      <span className="stat__value">{value}</span>
    </div>
  );
}

function Empty({ text }: { text: string }) {
  return <p className="empty">{text}</p>;
}

export default async function PilotagePage() {
  const data = await getPilotageDashboard();
  const { synthetique, aTraiter, calendrier } = data;

  const evenements = [
    ...calendrier.projets.map((p) => ({
      id: `p-${p.id}`,
      date: p.dateEcheance!,
      type: "Projet",
      label: p.nom,
    })),
    ...calendrier.taches.map((t) => ({
      id: `t-${t.id}`,
      date: t.dateEcheance!,
      type: "Tâche",
      label: t.titre,
    })),
    ...calendrier.controles.map((c) => ({
      id: `c-${c.id}`,
      date: c.dateProchaineEcheance!,
      type: "Contrôle SCI",
      label: c.nom,
    })),
  ].sort((a, b) => a.date.getTime() - b.date.getTime());

  return (
    <>
      <header className="page-header">
        <h1>Pilotage</h1>
        <p>
          Vue synthétique de l&apos;activité de l&apos;unité — projets, tâches et
          contrôles SCI. Les données affichées sont des exemples de démonstration.
        </p>
      </header>

      <section className="section" aria-label="Vue synthétique">
        <h2 className="section__title">Vue synthétique</h2>
        <div className="stats-grid">
          <Stat label="Projets en cours" value={synthetique.projetsEnCours} />
          <Stat label="Tâches ouvertes" value={synthetique.tachesOuvertes} />
          <Stat
            label="Tâches en retard"
            value={synthetique.tachesEnRetard}
            tone="danger"
          />
          <Stat
            label="Tâches à valider"
            value={synthetique.tachesAValider}
            tone="info"
          />
          <Stat
            label="Contrôles SCI à venir (7 j.)"
            value={synthetique.controlesAVenir}
            tone="warn"
          />
          <Stat
            label="Contrôles SCI en retard"
            value={synthetique.controlesEnRetard}
            tone="danger"
          />
        </div>
      </section>

      <section className="section" aria-label="À traiter">
        <h2 className="section__title">À traiter</h2>
        <div className="legend">
          <span>
            <i className="dot-retard" /> En retard
          </span>
          <span>
            <i className="dot-bientot" /> Échéance proche (≤ 7 j.)
          </span>
          <span>
            <i className="dot-validation" /> Validation en attente
          </span>
        </div>

        <div className="panels">
          <div className="panel">
            <h3>Tâches</h3>
            {aTraiter.tachesEnRetard.length === 0 &&
            aTraiter.tachesBientot.length === 0 ? (
              <Empty text="Aucune tâche urgente pour le moment." />
            ) : (
              <ul className="item-list">
                {aTraiter.tachesEnRetard.map((t) => (
                  <li key={t.id} className="item item--retard">
                    <span className="item__badge">Retard</span>
                    <div>
                      <p className="item__title">{t.titre}</p>
                      <p className="item__meta">
                        {t.responsable.nom}
                        {t.projet ? ` · ${t.projet.nom}` : ""}
                        {` · ${PRIORITE_LABELS[t.priorite]}`}
                      </p>
                    </div>
                    <span className="item__date">{formatDate(t.dateEcheance)}</span>
                  </li>
                ))}
                {aTraiter.tachesBientot.map((t) => (
                  <li key={t.id} className="item item--bientot">
                    <span className="item__badge">Bientôt</span>
                    <div>
                      <p className="item__title">{t.titre}</p>
                      <p className="item__meta">
                        {t.responsable.nom}
                        {t.projet ? ` · ${t.projet.nom}` : ""}
                      </p>
                    </div>
                    <span className="item__date">{formatDate(t.dateEcheance)}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="panel">
            <h3>Contrôles SCI</h3>
            {aTraiter.controlesEnRetard.length === 0 &&
            aTraiter.controlesBientot.length === 0 ? (
              <Empty text="Aucun contrôle SCI urgent." />
            ) : (
              <ul className="item-list">
                {aTraiter.controlesEnRetard.map((c) => (
                  <li key={c.id} className="item item--retard">
                    <span className="item__badge">Retard</span>
                    <div>
                      <p className="item__title">{c.nom}</p>
                      <p className="item__meta">
                        {c.responsable.nom} · {c.processusConcerne} ·{" "}
                        {FREQUENCE_LABELS[c.frequence]}
                      </p>
                    </div>
                    <span className="item__date">
                      {formatDate(c.dateProchaineEcheance)}
                    </span>
                  </li>
                ))}
                {aTraiter.controlesBientot.map((c) => (
                  <li key={c.id} className="item item--bientot">
                    <span className="item__badge">Bientôt</span>
                    <div>
                      <p className="item__title">{c.nom}</p>
                      <p className="item__meta">
                        {c.responsable.nom} · {c.processusConcerne}
                      </p>
                    </div>
                    <span className="item__date">
                      {formatDate(c.dateProchaineEcheance)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="panel" style={{ gridColumn: "1 / -1" }}>
            <h3>Validations en attente</h3>
            {aTraiter.validationsTaches.length === 0 &&
            aTraiter.validationsControles.length === 0 ? (
              <Empty text="Aucune validation en attente." />
            ) : (
              <ul className="item-list">
                {aTraiter.validationsTaches.map((t) => (
                  <li key={`vt-${t.id}`} className="item item--validation">
                    <span className="item__badge">Tâche</span>
                    <div>
                      <p className="item__title">{t.titre}</p>
                      <p className="item__meta">
                        Soumis par {t.soumisPar?.nom ?? "—"}
                        {t.projet ? ` · ${t.projet.nom}` : ""}
                      </p>
                    </div>
                    <span className="item__date">
                      {formatDate(t.dateSoumission)}
                    </span>
                  </li>
                ))}
                {aTraiter.validationsControles.map((c) => (
                  <li key={`vc-${c.id}`} className="item item--validation">
                    <span className="item__badge">Contrôle</span>
                    <div>
                      <p className="item__title">{c.nom}</p>
                      <p className="item__meta">
                        Soumis par {c.soumisPar?.nom ?? "—"} ·{" "}
                        {c.processusConcerne}
                      </p>
                    </div>
                    <span className="item__date">
                      {formatDate(c.dateSoumission)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </section>

      <section className="section" aria-label="Calendrier des échéances">
        <h2 className="section__title">Calendrier des échéances</h2>
        <div className="panel">
          {evenements.length === 0 ? (
            <Empty text="Aucune échéance à afficher." />
          ) : (
            <ul className="calendar-list">
              {evenements.map((e) => (
                <li key={e.id} className="calendar-row">
                  <span className="calendar-row__date">{formatDate(e.date)}</span>
                  <span className="calendar-row__type">{e.type}</span>
                  <span className="calendar-row__label">{e.label}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </>
  );
}
