import Link from "next/link";
import type { ReactNode } from "react";

export function PageHeader({
  title,
  description,
  actions,
  badge,
  help,
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
  /** Indicateur discret (ex. vue responsable) */
  badge?: ReactNode;
  /** Icône ⓘ d’aide à côté du titre */
  help?: ReactNode;
}) {
  return (
    <header className="page-header page-header--row page-header--compact">
      <div>
        <div className="page-header__title-row">
          <h1>{title}</h1>
          {help ? <span className="page-header__help">{help}</span> : null}
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
