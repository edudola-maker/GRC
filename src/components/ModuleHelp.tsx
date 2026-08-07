export function ModuleHelp({
  title,
  body,
}: {
  title: string;
  body: string;
}) {
  return (
    <details className="module-help">
      <summary aria-label={title}>
        <span className="module-help__icon" aria-hidden>
          ⓘ
        </span>
        <span className="module-help__title">{title}</span>
      </summary>
      <p>{body}</p>
    </details>
  );
}
