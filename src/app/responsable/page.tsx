import Link from "next/link";
import { notFound } from "next/navigation";
import { ActionRow } from "@/components/ActionRow";
import { FlashBanner } from "@/components/Flash";
import { PageHeader } from "@/components/ui";
import { getActionsUnite } from "@/lib/actions-view";
import { getDashboardResponsable } from "@/lib/dashboard-responsable";
import {
  PRIORITE_OPTIONS,
  STATUT_TACHE_OPTIONS,
} from "@/lib/catalog";
import {
  CATEGORIE_RISQUE_LABELS,
  STATUT_AUDIT_LABELS,
  STATUT_CONSEIL_LABELS,
  STATUT_CONTROLE_LABELS,
  STATUT_PROJET_LABELS,
  formatDate,
} from "@/lib/labels";
import {
  getCurrentUser,
  isResponsable,
  listUtilisateursActifs,
} from "@/lib/session";

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

export default async function DashboardResponsablePage({
  searchParams,
}: {
  searchParams: Promise<{
    ok?: string;
    erreur?: string;
    collaborateur?: string;
    type?: string;
    statut?: string;
    priorite?: string;
    echeance?: string;
  }>;
}) {
  const user = await getCurrentUser();
  if (!isResponsable(user)) notFound();

  const sp = await searchParams;
  const [data, users, monitoring] = await Promise.all([
    getDashboardResponsable(),
    listUtilisateursActifs(),
    getActionsUnite({
      collaborateurId: sp.collaborateur || undefined,
      type: sp.type || undefined,
      statut: sp.statut || undefined,
      priorite: sp.priorite || undefined,
      echeance:
        sp.echeance === "retard" || sp.echeance === "proche"
          ? sp.echeance
          : undefined,
    }),
  ]);

  const s = data.synthetique;
  const chargeMap = new Map(
    monitoring.chargeParCollaborateur.map((c) => [
      c.responsableId,
      c._count._all,
    ]),
  );
  const qs = new URLSearchParams();
  if (sp.collaborateur) qs.set("collaborateur", sp.collaborateur);
  if (sp.type) qs.set("type", sp.type);
  if (sp.statut) qs.set("statut", sp.statut);
  if (sp.priorite) qs.set("priorite", sp.priorite);
  if (sp.echeance) qs.set("echeance", sp.echeance);
  const retour = `/responsable${qs.toString() ? `?${qs}` : ""}`;

  return (
    <>
      <PageHeader
        title="Dashboard responsable"
        description="Comment va mon unité ? Vue synthétique, activité en cours et suivi des actions."
      />
      <FlashBanner ok={sp.ok} erreur={sp.erreur} />

      <section className="section" aria-label="Vue synthétique">
        <h2 className="section__title">Vue synthétique</h2>
        <div className="kpi-domains">
          <div className="kpi-domain">
            <h3>Audits</h3>
            <div className="stats-grid stats-grid--dense">
              <Stat label="En cours" value={s.auditsEnCours} />
              <Stat label="Réalisés" value={s.auditsRealises} />
            </div>
          </div>
          <div className="kpi-domain">
            <h3>Conseils</h3>
            <div className="stats-grid stats-grid--dense">
              <Stat label="Ouverts" value={s.conseilsOuverts} />
              <Stat
                label="Respect délai 5 j."
                value={s.tauxRespectDelai}
                suffix=" %"
                tone="info"
              />
            </div>
          </div>
          <div className="kpi-domain">
            <h3>Projets</h3>
            <div className="stats-grid stats-grid--dense">
              <Stat label="Actifs" value={s.projetsActifs} />
              <Stat
                label="En retard"
                value={s.projetsEnRetard}
                tone="danger"
              />
            </div>
          </div>
          <div className="kpi-domain">
            <h3>Contrôles SCI</h3>
            <div className="stats-grid stats-grid--dense">
              <Stat label="Prévus" value={s.controlesPrevus} />
              <Stat
                label="Taux réalisation"
                value={s.tauxRealisationControles}
                suffix=" %"
              />
            </div>
          </div>
          <div className="kpi-domain">
            <h3>Risques</h3>
            <div className="stats-grid stats-grid--dense">
              <Stat label="Critiques" value={s.risquesCritiques} tone="danger" />
              <Stat label="Élevés" value={s.risquesEleves} tone="warn" />
            </div>
          </div>
        </div>
      </section>

      <section className="section" aria-label="Vue opérationnelle">
        <h2 className="section__title">Que fait actuellement l&apos;unité ?</h2>
        <div className="panels">
          <div className="panel">
            <h3>Audits en cours</h3>
            {data.operationnel.audits.length === 0 ? (
              <p className="empty">Aucun audit en cours.</p>
            ) : (
              <ul className="item-list">
                {data.operationnel.audits.map((a) => (
                  <li key={a.id} className="item">
                    <div>
                      <p className="item__title">
                        <Link href={`/audits/${a.id}`}>{a.titre}</Link>
                      </p>
                      <p className="item__meta">
                        {a.responsable.nom} · {STATUT_AUDIT_LABELS[a.statut]}
                      </p>
                    </div>
                    <span className="item__date">{formatDate(a.dateFin)}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div className="panel">
            <h3>Conseils en cours</h3>
            {data.operationnel.conseils.length === 0 ? (
              <p className="empty">Aucun conseil ouvert.</p>
            ) : (
              <ul className="item-list">
                {data.operationnel.conseils.map((c) => (
                  <li key={c.id} className="item">
                    <div>
                      <p className="item__title">
                        <Link href={`/conseils/${c.id}`}>{c.objet}</Link>
                      </p>
                      <p className="item__meta">
                        {c.responsable.nom} · {STATUT_CONSEIL_LABELS[c.statut]}
                      </p>
                    </div>
                    <span className="item__date">
                      {formatDate(c.dateEcheance)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div className="panel">
            <h3>Projets actifs</h3>
            {data.operationnel.projets.length === 0 ? (
              <p className="empty">Aucun projet actif.</p>
            ) : (
              <ul className="item-list">
                {data.operationnel.projets.map((p) => (
                  <li key={p.id} className="item">
                    <div>
                      <p className="item__title">
                        <Link href={`/projets/${p.id}`}>{p.nom}</Link>
                      </p>
                      <p className="item__meta">
                        {p.responsable.nom} · {STATUT_PROJET_LABELS[p.statut]} ·{" "}
                        {p.avancement}%
                      </p>
                    </div>
                    <span className="item__date">
                      {formatDate(p.dateEcheance)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div className="panel">
            <h3>Contrôles SCI & risques</h3>
            <ul className="item-list">
              {data.operationnel.controles.map((c) => (
                <li key={`c-${c.id}`} className="item">
                  <div>
                    <p className="item__title">
                      <Link href={`/controles-sci/${c.id}`}>{c.nom}</Link>
                    </p>
                    <p className="item__meta">
                      {c.responsable.nom} · {STATUT_CONTROLE_LABELS[c.statut]}
                    </p>
                  </div>
                  <span className="item__date">
                    {formatDate(c.dateProchaineEcheance)}
                  </span>
                </li>
              ))}
              {data.operationnel.risques.map((r) => (
                <li key={`r-${r.id}`} className="item item--bientot">
                  <div>
                    <p className="item__title">
                      <Link href={`/risques/${r.id}`}>{r.nom}</Link>
                    </p>
                    <p className="item__meta">
                      {CATEGORIE_RISQUE_LABELS[r.categorie]} · criticité{" "}
                      {r.criticite} · {r.responsable.nom}
                    </p>
                  </div>
                </li>
              ))}
              {data.operationnel.controles.length === 0 &&
              data.operationnel.risques.length === 0 ? (
                <li>
                  <p className="empty">Aucun élément à afficher.</p>
                </li>
              ) : null}
            </ul>
          </div>
        </div>
      </section>

      <section className="section" aria-label="Objectifs annuels">
        <h2 className="section__title">
          Objectifs {data.meta.annee} — où en sommes-nous ?
        </h2>
        <div className="stats-grid" style={{ marginBottom: "1rem" }}>
          <Stat
            label="Audits réalisés / planifiés"
            value={`${s.auditsRealises} / ${s.auditsPlanifies}`}
          />
          <Stat
            label="Délai moyen conseils"
            value={s.delaiMoyen}
            suffix=" j."
            tone="info"
          />
          <Stat label="Projets clôturés" value={s.projetsTermines} />
          <Stat
            label="Contrôles SCI réalisés"
            value={s.controlesRealises}
          />
        </div>
        <div className="panel">
          {data.objectifs.length === 0 ? (
            <p className="empty">Aucun objectif annuel renseigné.</p>
          ) : (
            <ul className="history-list">
              {data.objectifs.map((o) => (
                <li key={o.id}>
                  <strong>
                    {o.utilisateur.nom} — {o.objectif}
                  </strong>
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
        </div>
      </section>

      <section className="section" aria-label="Monitoring des actions">
        <h2 className="section__title">
          Actions de l&apos;unité
          <span className="bucket-count">{s.actionsOuvertes}</span>
          {s.actionsEnRetard > 0 ? (
            <span className="bucket-count bucket-count--danger">
              {s.actionsEnRetard} en retard
            </span>
          ) : null}
        </h2>

        <form className="filter-bar filter-bar--form" method="get">
          <label className="field">
            <span className="field__label">Collaborateur</span>
            <select name="collaborateur" defaultValue={sp.collaborateur ?? ""}>
              <option value="">Tous</option>
              {users.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.nom} ({chargeMap.get(u.id) ?? 0} ouvertes)
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            <span className="field__label">Origine</span>
            <select name="type" defaultValue={sp.type ?? ""}>
              <option value="">Toutes</option>
              <option value="PROJET">Projet</option>
              <option value="CONSEIL">Conseil</option>
              <option value="AUDIT">Audit</option>
              <option value="SCI">Contrôle SCI</option>
              <option value="DOCUMENT">Document</option>
              <option value="LIBRE">Action libre</option>
            </select>
          </label>
          <label className="field">
            <span className="field__label">Statut</span>
            <select name="statut" defaultValue={sp.statut ?? ""}>
              <option value="">Tous</option>
              {STATUT_TACHE_OPTIONS.filter(
                (o) => o.value !== "TERMINE" && o.value !== "ANNULE",
              ).map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            <span className="field__label">Priorité</span>
            <select name="priorite" defaultValue={sp.priorite ?? ""}>
              <option value="">Toutes</option>
              {PRIORITE_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            <span className="field__label">Échéance</span>
            <select name="echeance" defaultValue={sp.echeance ?? ""}>
              <option value="">Toutes</option>
              <option value="retard">En retard</option>
              <option value="proche">Proche (7 j.)</option>
            </select>
          </label>
          <button type="submit" className="btn btn--primary">
            Filtrer
          </button>
          <Link href="/responsable" className="btn btn--ghost">
            Réinitialiser
          </Link>
        </form>

        <div className="panel">
          {monitoring.actions.length === 0 ? (
            <p className="empty">Aucune action ouverte pour ces filtres.</p>
          ) : (
            <ul className="entity-list">
              {monitoring.actions.map((t) => (
                <ActionRow
                  key={t.id}
                  tache={t}
                  retour={retour}
                  showResponsable
                />
              ))}
            </ul>
          )}
        </div>
      </section>
    </>
  );
}
