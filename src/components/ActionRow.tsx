import Link from "next/link";
import { completeTacheRapide } from "@/app/taches/actions";
import { SubmitButton } from "@/components/FormControls";
import {
  CATEGORIE_TACHE_LABELS,
  PRIORITE_LABELS,
  STATUT_TACHE_LABELS,
  formatDate,
  urgenceEcheance,
} from "@/lib/labels";
import { origineAction, type TacheAction } from "@/lib/actions-view";

export function ActionRow({
  tache,
  retour,
  showResponsable = false,
}: {
  tache: TacheAction;
  retour: string;
  showResponsable?: boolean;
}) {
  const urgence = urgenceEcheance(tache.dateEcheance, false);
  const origine = origineAction(tache);

  return (
    <li>
      <div className={`entity-row entity-row--${urgence} entity-row--actions`}>
        <Link href={`/taches/${tache.id}`} className="entity-row__main">
          <strong>
            {tache.titre}
            {urgence === "retard" ? (
              <span className="tag tag--danger"> En retard</span>
            ) : null}
          </strong>
          <span className="entity-row__meta">
            {CATEGORIE_TACHE_LABELS[tache.categorie]}
            {showResponsable ? ` · ${tache.responsable.nom}` : ""}
            {" · "}
            {origine.href ? (
              <>
                <span className="link-inline">{origine.label}</span>
              </>
            ) : (
              origine.label
            )}
            {" · "}
            {STATUT_TACHE_LABELS[tache.statut]} · {PRIORITE_LABELS[tache.priorite]}
          </span>
        </Link>
        <span className="entity-row__date">{formatDate(tache.dateEcheance)}</span>
        {tache.statut !== "TERMINE" ? (
          <form action={completeTacheRapide}>
            <input type="hidden" name="id" value={tache.id} />
            <input type="hidden" name="retour" value={retour} />
            <SubmitButton pendingLabel="…">Terminer</SubmitButton>
          </form>
        ) : null}
      </div>
    </li>
  );
}

export function ActionBucket({
  title,
  count,
  items,
  retour,
  empty,
  showResponsable,
  tone,
}: {
  title: string;
  count: number;
  items: TacheAction[];
  retour: string;
  empty: string;
  showResponsable?: boolean;
  tone?: "danger" | "warn" | "info";
}) {
  return (
    <div className="panel">
      <div className="panel-head">
        <h2 className="panel-title">
          {title}
          <span className={`bucket-count${tone ? ` bucket-count--${tone}` : ""}`}>
            {count}
          </span>
        </h2>
      </div>
      {items.length === 0 ? (
        <p className="empty">{empty}</p>
      ) : (
        <ul className="entity-list">
          {items.map((t) => (
            <ActionRow
              key={t.id}
              tache={t}
              retour={retour}
              showResponsable={showResponsable}
            />
          ))}
        </ul>
      )}
    </div>
  );
}
