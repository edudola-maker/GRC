import Link from "next/link";
import type { MissionEtapeSlug, MissionEtapeVue } from "@/lib/mission-etapes";

export function MissionEtapesNav({
  etapes,
  currentSlug,
  cockpitHref,
  activeCockpit,
}: {
  etapes: MissionEtapeVue[];
  currentSlug?: MissionEtapeSlug | null;
  cockpitHref: string;
  activeCockpit?: boolean;
}) {
  return (
    <nav className="mission-etapes-nav" aria-label="Étapes de la mission">
      <Link
        href={cockpitHref}
        className={
          activeCockpit
            ? "mission-etapes-nav__item mission-etapes-nav__item--active"
            : "mission-etapes-nav__item"
        }
      >
        <span className="mission-etapes-nav__ordre" aria-hidden>
          ·
        </span>
        <span className="mission-etapes-nav__title">Cockpit</span>
      </Link>
      {etapes.map((e) => {
        const active = currentSlug === e.slug;
        return (
          <Link
            key={e.key}
            href={e.href}
            className={
              active
                ? "mission-etapes-nav__item mission-etapes-nav__item--active"
                : "mission-etapes-nav__item"
            }
            title={e.question}
          >
            <span className="mission-etapes-nav__ordre">{e.ordre}</span>
            <span className="mission-etapes-nav__body">
              <span className="mission-etapes-nav__title">{e.title}</span>
              <span
                className={`mission-etapes-nav__etat mission-etapes-nav__etat--${e.progressEtat.toLowerCase()}`}
              >
                {e.progressLabel}
              </span>
              {e.metric ? (
                <span className="mission-etapes-nav__metric">{e.metric}</span>
              ) : null}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}

/** Cartes cliquables sur le cockpit. */
export function MissionEtapesCards({
  etapes,
  recommandeeSlug,
}: {
  etapes: MissionEtapeVue[];
  recommandeeSlug?: MissionEtapeSlug | null;
}) {
  return (
    <ol className="mission-etapes-cards">
      {etapes.map((e) => (
        <li key={e.key}>
          <Link
            href={e.href}
            className={
              recommandeeSlug === e.slug
                ? "mission-etapes-card mission-etapes-card--current"
                : "mission-etapes-card"
            }
          >
            <span className="mission-etapes-card__ordre">{e.ordre}</span>
            <span className="mission-etapes-card__main">
              <strong>{e.title}</strong>
              <span className="muted">{e.question}</span>
              <span
                className={`mission-etapes-nav__etat mission-etapes-nav__etat--${e.progressEtat.toLowerCase()}`}
              >
                {e.progressLabel}
              </span>
              {e.metric ? (
                <span className="mission-etapes-nav__metric">{e.metric}</span>
              ) : null}
            </span>
          </Link>
        </li>
      ))}
    </ol>
  );
}
