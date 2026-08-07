import Link from "next/link";

export function PageHeader({
  title,
  description,
  actions,
  badge,
}: {
  title: string;
  description?: string;
  actions?: React.ReactNode;
  /** Indicateur discret (ex. vue responsable) */
  badge?: React.ReactNode;
}) {
  return (
    <header className="page-header page-header--row">
      <div>
        <div className="page-header__title-row">
          <h1>{title}</h1>
          {badge ? <span className="page-header__badge">{badge}</span> : null}
        </div>
        {description ? <p>{description}</p> : null}
      </div>
      {actions ? <div className="page-actions">{actions}</div> : null}
    </header>
  );
}

export function BtnLink({
  href,
  children,
  variant = "primary",
}: {
  href: string;
  children: React.ReactNode;
  variant?: "primary" | "ghost" | "danger";
}) {
  return (
    <Link href={href} className={`btn btn--${variant}`}>
      {children}
    </Link>
  );
}

export function BtnSubmit({
  children,
  variant = "primary",
}: {
  children: React.ReactNode;
  variant?: "primary" | "ghost" | "danger";
}) {
  return (
    <button type="submit" className={`btn btn--${variant}`}>
      {children}
    </button>
  );
}
