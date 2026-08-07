import Link from "next/link";

export function PageHeader({
  title,
  description,
  actions,
}: {
  title: string;
  description?: string;
  actions?: React.ReactNode;
}) {
  return (
    <header className="page-header page-header--row">
      <div>
        <h1>{title}</h1>
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
