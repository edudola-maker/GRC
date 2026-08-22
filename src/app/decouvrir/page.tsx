import Link from "next/link";
import { PageHeader } from "@/components/ui";
import { DECOUVRIR_PARCOURS } from "@/lib/decouvrir-parcours";

export const dynamic = "force-dynamic";

export default function DecouvrirPage() {
  return (
    <>
      <PageHeader
        title="Découvrir l’outil"
        description="Parcours courts pour démarrer : chaque guide mène dans l’application, avec un mini-questionnaire optionnel."
      />

      <ul className="decouvrir-index">
        {DECOUVRIR_PARCOURS.map((p) => (
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
    </>
  );
}
