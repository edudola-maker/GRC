import Link from "next/link";
import { PageHeader } from "@/components/ui";
import {
  BONNES_PRATIQUES,
  NATURE_LABELS,
} from "@/lib/bonnes-pratiques";

export const dynamic = "force-dynamic";

export default function BonnesPratiquesPage() {
  return (
    <>
      <p style={{ margin: "0 0 0.75rem" }}>
        <Link href="/guide" className="btn-link">
          ← Guide
        </Link>
      </p>
      <PageHeader
        title="Bonnes pratiques"
        description="Pourquoi · quand · nature (obligation ≠ bonne pratique) · responsable · fréquence. Jamais présentée automatiquement comme obligation."
      />

      <ul className="bp-list">
        {BONNES_PRATIQUES.map((bp) => (
          <li key={bp.id} className="bp-card">
            <header className="bp-card__head">
              <h2>{bp.titre}</h2>
              <span
                className={`bp-nature bp-nature--${bp.nature === "BONNE_PRATIQUE" || bp.nature === "RECOMMANDATION" ? "soft" : "strong"}`}
              >
                {NATURE_LABELS[bp.nature]}
              </span>
            </header>
            <dl className="bp-dl">
              <div>
                <dt>Pourquoi ?</dt>
                <dd>{bp.pourquoi}</dd>
              </div>
              <div>
                <dt>Quand est-ce pertinent ?</dt>
                <dd>{bp.quandPertinent}</dd>
              </div>
              <div>
                <dt>Responsable recommandé</dt>
                <dd>{bp.responsableRecommande}</dd>
              </div>
              <div>
                <dt>Fréquence de revue</dt>
                <dd>{bp.frequenceRevue}</dd>
              </div>
              <div>
                <dt>Modèle</dt>
                <dd>
                  {bp.modeleDisponible
                    ? "Canevas / checklist disponible (démo)"
                    : "Pas encore de modèle — architecture prête"}
                </dd>
              </div>
            </dl>
            {bp.parcoursSlug ? (
              <p>
                <Link
                  href={`/decouvrir/${bp.parcoursSlug}`}
                  className="btn btn--ghost"
                >
                  Parcours associé
                </Link>
              </p>
            ) : null}
          </li>
        ))}
      </ul>
    </>
  );
}
