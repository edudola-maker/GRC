import Link from "next/link";
import { PageHeader, BtnLink } from "@/components/ui";
import { DECOUVRIR_PARCOURS } from "@/lib/decouvrir-parcours";

export const dynamic = "force-dynamic";

const GROUPES: { id: string; label: string; slugs: string[] }[] = [
  {
    id: "demarrer",
    label: "Démarrer",
    slugs: ["definir-strategie", "objectifs", "creer-projet", "planning"],
  },
  {
    id: "maitrise",
    label: "Maîtriser",
    slugs: [
      "documenter-processus",
      "cartographie-risques",
      "identifier-risque",
      "evaluer-risque",
      "creer-controle",
      "revue-qualite",
      "point-lpd",
    ],
  },
  {
    id: "gouvernance",
    label: "Gouvernance",
    slugs: [
      "gouvernance-fondamentaux",
      "documenter-decision",
      "documenter-arbitrage",
      "fonctions-roles",
    ],
  },
];

export default function GuidePage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | undefined>>;
}) {
  // Support éventuel ?from=decouvrir
  void searchParams;

  const bySlug = Object.fromEntries(DECOUVRIR_PARCOURS.map((p) => [p.slug, p]));

  return (
    <>
      <PageHeader
        title="Guide"
        description="Centre d’accompagnement — structurer progressivement votre organisation. Distinct du module métier Conseils."
        actions={<BtnLink href="/guide/diagnostic">Diagnostic initial</BtnLink>}
      />

      <section className="guide-hero-actions">
        <Link href="/guide/diagnostic" className="guide-cta">
          <strong>Parlez-nous de votre organisation</strong>
          <span className="muted">
            Quelques questions → parcours recommandé (À faire / À revoir). Aucun
            score artificiel.
          </span>
        </Link>
        <Link href="/guide/bonnes-pratiques" className="guide-cta">
          <strong>Bibliothèque de bonnes pratiques</strong>
          <span className="muted">
            Obligation vs bonne pratique — modèles et fréquences de revue.
          </span>
        </Link>
      </section>

      {GROUPES.map((g) => {
        const items = g.slugs
          .map((s) => bySlug[s])
          .filter(Boolean) as typeof DECOUVRIR_PARCOURS;
        if (items.length === 0) return null;
        return (
          <section key={g.id} className="guide-group">
            <h2>{g.label}</h2>
            <ul className="decouvrir-index">
              {items.map((p) => (
                <li key={p.slug} className="decouvrir-index__item">
                  <div>
                    <Link
                      href={`/decouvrir/${p.slug}`}
                      className="decouvrir-index__title"
                    >
                      {p.titre}
                    </Link>
                    <p className="muted" style={{ margin: "0.35rem 0 0" }}>
                      {p.resume}
                    </p>
                  </div>
                  <Link href={`/decouvrir/${p.slug}`} className="btn btn--ghost">
                    Commencer
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        );
      })}

      <p className="muted">
        Les parcours créent des objets seulement après votre confirmation — jamais
        silencieusement.
      </p>
    </>
  );
}
