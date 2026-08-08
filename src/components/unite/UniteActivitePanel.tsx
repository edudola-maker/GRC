import Link from "next/link";
import type { UniteActivite, UniteActiviteSlice } from "@/lib/unite-overview";

function SliceList({
  title,
  items,
  seeAllHref,
}: {
  title: string;
  items: UniteActiviteSlice[];
  seeAllHref: string;
}) {
  return (
    <div className="unite-activite__slice">
      <div className="unite-activite__slice-head">
        <h3>{title}</h3>
        <Link href={seeAllHref} className="muted">
          Voir tout
        </Link>
      </div>
      {items.length === 0 ? (
        <p className="empty">Aucun élément.</p>
      ) : (
        <ul className="unite-activite__list">
          {items.map((item) => (
            <li key={item.id}>
              <Link href={item.href}>
                <strong>
                  {item.code !== "ACT" ? `${item.code} — ` : ""}
                  {item.titre}
                </strong>
              </Link>
              <span className="muted">{item.meta}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function UniteActivitePanel({ activite }: { activite: UniteActivite }) {
  return (
    <div className="unite-activite">
      <p className="muted" style={{ marginTop: 0 }}>
        Agrégation depuis les modules existants — aucune double saisie.
      </p>
      <div className="unite-activite__grid">
        <SliceList
          title="Objectifs"
          items={activite.objectifs}
          seeAllHref="/unite#objectifs"
        />
        <SliceList
          title="Projets"
          items={activite.projets}
          seeAllHref="/projets"
        />
        <SliceList
          title="Missions"
          items={activite.missions}
          seeAllHref="/audits"
        />
        <SliceList
          title="Processus"
          items={activite.processus}
          seeAllHref="/processus"
        />
        <SliceList
          title="Conseils"
          items={activite.conseils}
          seeAllHref="/conseils"
        />
        <SliceList
          title="Risques"
          items={activite.risques}
          seeAllHref="/risques"
        />
        <SliceList
          title="Contrôles SCI"
          items={activite.controles}
          seeAllHref="/controles-sci"
        />
        <SliceList title="Tâches" items={activite.taches} seeAllHref="/taches" />
        <SliceList
          title="Documents"
          items={activite.documents}
          seeAllHref="/documents"
        />
      </div>
    </div>
  );
}
