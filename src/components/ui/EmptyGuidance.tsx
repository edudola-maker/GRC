import Link from "next/link";

/** Empty state guidé — lien optionnel vers le guide Découvrir. */
export function EmptyGuidance({
  title,
  children,
  guideHref = "/decouvrir",
  guideLabel = "Découvrir l’outil",
  actionHref,
  actionLabel,
}: {
  title: string;
  children: React.ReactNode;
  guideHref?: string;
  guideLabel?: string;
  actionHref?: string;
  actionLabel?: string;
}) {
  return (
    <div className="empty-guidance">
      <p className="empty-guidance__title">{title}</p>
      <div className="empty-guidance__body muted">{children}</div>
      <div className="empty-guidance__actions">
        {actionHref && actionLabel ? (
          <Link href={actionHref} className="btn btn--primary">
            {actionLabel}
          </Link>
        ) : null}
        <Link href={guideHref} className="btn btn--ghost">
          {guideLabel}
        </Link>
      </div>
    </div>
  );
}
