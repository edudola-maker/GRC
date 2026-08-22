import Link from "next/link";
import { PageHeader } from "@/components/ui";
import {
  labelTypeRecherche,
  rechercherGlobal,
} from "@/lib/recherche-globale";
import { getCurrentUser } from "@/lib/session";

export const dynamic = "force-dynamic";

export default async function RecherchePage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const sp = await searchParams;
  const q = (sp.q ?? "").trim();
  const user = await getCurrentUser();
  const hits = q ? await rechercherGlobal(user.uniteId, q) : [];

  const byType = new Map<string, typeof hits>();
  for (const h of hits) {
    const list = byType.get(h.type) ?? [];
    list.push(h);
    byType.set(h.type, list);
  }

  return (
    <>
      <PageHeader
        title="Recherche"
        description="Recherche simple par code ou titre dans l’unité courante (Cmd+K → cette page)."
      />

      <form className="recherche-form" method="get" action="/recherche">
        <label className="field" style={{ flex: 1, margin: 0 }}>
          <span className="sr-only">Rechercher</span>
          <input
            type="search"
            name="q"
            defaultValue={q}
            placeholder="Code ou titre (ex. PRC-0001, risque…)"
            autoFocus
            autoComplete="off"
          />
        </label>
        <button type="submit" className="btn btn--primary">
          Rechercher
        </button>
      </form>

      {!q ? (
        <p className="muted">Saisissez au moins un caractère.</p>
      ) : hits.length === 0 ? (
        <p className="empty">Aucun résultat pour « {q} ».</p>
      ) : (
        <div className="recherche-results">
          <p className="muted">
            {hits.length} résultat{hits.length > 1 ? "s" : ""}
          </p>
          {[...byType.entries()].map(([type, list]) => (
            <section key={type} className="recherche-group">
              <h2 className="recherche-group__title">
                {labelTypeRecherche(type as (typeof list)[0]["type"])}
              </h2>
              <ul className="recherche-group__list">
                {list.map((h) => (
                  <li key={`${h.type}-${h.id}`}>
                    <Link href={h.href}>
                      <span className="recherche-code">{h.code}</span>
                      <strong>{h.titre}</strong>
                      {h.meta ? (
                        <span className="muted"> · {h.meta}</span>
                      ) : null}
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}
    </>
  );
}
