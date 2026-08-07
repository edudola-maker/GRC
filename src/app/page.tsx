import Link from "next/link";
import {
  CATEGORIE_TACHE_LABELS,
  PRIORITE_LABELS,
  formatDate,
} from "@/lib/labels";
import { getPilotageDashboard } from "@/lib/pilotage";

export const dynamic = "force-dynamic";

function Stat({
  label,
  value,
  tone,
  suffix,
}: {
  label: string;
  value: number | string | null;
  tone?: "warn" | "danger" | "info";
  suffix?: string;
}) {
  return (
    <div className={`stat${tone ? ` stat--${tone}` : ""}`}>
      <span className="stat__label">{label}</span>
      <span className="stat__value">
        {value ?? "—"}
        {suffix && value != null ? (
          <span className="stat__suffix">{suffix}</span>
        ) : null}
      </span>
    </div>
  );
}

export default async function PilotagePage() {
  const data = await getPilotageDashboard();
  const { synthetique: s, aTraiter } = data;

  return (
    <>
      <header className="page-header">
        <h1>Pilotage</h1>
        <p>
          Que se passe-t-il dans l&apos;unité et qu&apos;est-ce qui nécessite
          notre attention ? Vue synthétique multi-modules.
        </p>
      </header>

      <section className="section" aria-label="Vue synthétique">
        <h2 className="section__title">Vue synthétique</h2>
        <div className="stats-grid stats-grid--dense">
          <Stat label="Audits en cours" value={s.auditsEnCours} />
          <Stat label="Audits réalisés" value={s.auditsRealises} />
          <Stat label="Recommandations ouvertes" value={s.recoOuvertes} tone="info" />
          <Stat label="Conseils ouverts" value={s.conseilsOuverts} />
          <Stat
            label="Conseils hors délai"
            value={s.conseilsHorsDelai}
            tone="danger"
          />
          <Stat
            label="Respect délai conseils (5 j.)"
            value={s.tauxRespectDelai}
            suffix=" %"
            tone="info"
          />
          <Stat label="Projets actifs" value={s.projetsActifs} />
          <Stat label="Projets terminés" value={s.projetsTermines} />
          <Stat label="Projets en retard" value={s.projetsEnRetard} tone="danger" />
          <Stat label="Contrôles SCI planifiés" value={s.controlesPlanifies} />
          <Stat label="Contrôles SCI réalisés" value={s.controlesRealises} />
          <Stat
            label="Contrôles SCI en retard"
            value={s.controlesEnRetard}
            tone="danger"
          />
          <Stat label="Documents à revoir" value={s.docsARevoir} tone="warn" />
          <Stat
            label="Revues documentaires en retard"
            value={s.docsRevueRetard}
            tone="danger"
          />
          <Stat label="Risques élevés" value={s.risquesEleves} tone="warn" />
          <Stat label="Risques critiques" value={s.risquesCritiques} tone="danger" />
          <Stat label="Tâches ouvertes" value={s.tachesOuvertes} />
          <Stat label="Tâches en retard" value={s.tachesEnRetard} tone="danger" />
          <Stat label="Tâches à valider" value={s.tachesAValider} tone="info" />
        </div>
      </section>

      <section className="section" aria-label="À traiter">
        <div className="panel-head" style={{ marginBottom: "0.85rem" }}>
          <h2 className="section__title" style={{ margin: 0 }}>
            Actions nécessitant une attention
          </h2>
          <Link href="/backlog?vue=retard" className="btn btn--ghost">
            Ouvrir le backlog
          </Link>
        </div>

        <div className="panels">
          <div className="panel">
            <h3>Tâches en retard / proches</h3>
            {aTraiter.tachesEnRetard.length === 0 &&
            aTraiter.tachesBientot.length === 0 ? (
              <p className="empty">Aucune tâche urgente.</p>
            ) : (
              <ul className="item-list">
                {aTraiter.tachesEnRetard.map((t) => (
                  <li key={t.id} className="item item--retard">
                    <span className="item__badge">Retard</span>
                    <div>
                      <p className="item__title">
                        <Link href={`/taches/${t.id}`}>{t.titre}</Link>
                      </p>
                      <p className="item__meta">
                        {CATEGORIE_TACHE_LABELS[t.categorie]} ·{" "}
                        {t.responsable.nom}
                        {t.projet ? ` · ${t.projet.nom}` : ""}
                        {t.conseil ? ` · ${t.conseil.objet}` : ""} ·{" "}
                        {PRIORITE_LABELS[t.priorite]}
                      </p>
                    </div>
                    <span className="item__date">{formatDate(t.dateEcheance)}</span>
                  </li>
                ))}
                {aTraiter.tachesBientot.map((t) => (
                  <li key={t.id} className="item item--bientot">
                    <span className="item__badge">Bientôt</span>
                    <div>
                      <p className="item__title">
                        <Link href={`/taches/${t.id}`}>{t.titre}</Link>
                      </p>
                      <p className="item__meta">
                        {CATEGORIE_TACHE_LABELS[t.categorie]} · {t.responsable.nom}
                      </p>
                    </div>
                    <span className="item__date">{formatDate(t.dateEcheance)}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="panel">
            <h3>Validations en attente</h3>
            {aTraiter.validationsTaches.length === 0 &&
            aTraiter.validationsControles.length === 0 ? (
              <p className="empty">Aucune validation en attente.</p>
            ) : (
              <ul className="item-list">
                {aTraiter.validationsTaches.map((t) => (
                  <li key={`vt-${t.id}`} className="item item--validation">
                    <span className="item__badge">Tâche</span>
                    <div>
                      <p className="item__title">
                        <Link href={`/taches/${t.id}`}>{t.titre}</Link>
                      </p>
                      <p className="item__meta">
                        Soumis par {t.soumisPar?.nom ?? "—"}
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
                      <p className="item__title">
                        <Link href={`/controles-sci/${c.id}`}>{c.nom}</Link>
                      </p>
                      <p className="item__meta">
                        Soumis par {c.soumisPar?.nom ?? "—"}
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
    </>
  );
}
