import type { ReactNode } from "react";

export type ModuleHelpSection = {
  heading: string;
  body: string;
};

/**
 * Aide contextuelle pédagogique (≈ 1–2 min de lecture).
 * Repliable pour ne pas surcharger l’interface.
 */
export function ModuleHelp({
  title,
  body,
  sections,
}: {
  title: string;
  /** Texte court de secours si pas de sections structurées */
  body?: string;
  sections?: readonly ModuleHelpSection[];
}) {
  return (
    <details className="module-help">
      <summary aria-label={title}>
        <span className="module-help__icon" aria-hidden>
          ⓘ
        </span>
        <span className="module-help__title">{title}</span>
        <span className="module-help__hint muted">Aide du module</span>
      </summary>
      <div className="module-help__content">
        {sections && sections.length > 0 ? (
          sections.map((s) => (
            <div key={s.heading} className="module-help__block">
              <h3 className="module-help__heading">{s.heading}</h3>
              <HelpParagraphs text={s.body} />
            </div>
          ))
        ) : body ? (
          <HelpParagraphs text={body} />
        ) : null}
      </div>
    </details>
  );
}

function HelpParagraphs({ text }: { text: string }) {
  const parts = text.split(/\n\n+/).filter(Boolean);
  return (
    <>
      {parts.map((p, i) => (
        <p key={i}>{p}</p>
      ))}
    </>
  );
}

export function ModuleHelpRich({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <details className="module-help">
      <summary aria-label={title}>
        <span className="module-help__icon" aria-hidden>
          ⓘ
        </span>
        <span className="module-help__title">{title}</span>
        <span className="module-help__hint muted">Aide du module</span>
      </summary>
      <div className="module-help__content">{children}</div>
    </details>
  );
}
