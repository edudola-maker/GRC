import type { ReactNode } from "react";

export type ModuleHelpSection = {
  heading: string;
  body: string;
};

/**
 * Aide contextuelle — icône ⓘ discrète (popover), plus de grande box.
 */
export function ModuleHelp({
  title,
  body,
  sections,
}: {
  title: string;
  body?: string;
  sections?: readonly ModuleHelpSection[];
}) {
  return (
    <details className="module-help module-help--icon">
      <summary aria-label={`Aide : ${title}`} title={`Aide — ${title}`}>
        <span className="module-help__icon" aria-hidden>
          ⓘ
        </span>
      </summary>
      <div className="module-help__popover" role="note">
        <p className="module-help__popover-title">{title}</p>
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
    <details className="module-help module-help--icon">
      <summary aria-label={`Aide : ${title}`} title={`Aide — ${title}`}>
        <span className="module-help__icon" aria-hidden>
          ⓘ
        </span>
      </summary>
      <div className="module-help__popover" role="note">
        <p className="module-help__popover-title">{title}</p>
        <div className="module-help__content">{children}</div>
      </div>
    </details>
  );
}
