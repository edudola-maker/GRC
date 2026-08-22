import Link from "next/link";
import type { ReactNode } from "react";
import { PrintButton } from "@/components/rapports/PrintButton";
import { formatDate } from "@/lib/labels";

export function ReportShell({
  title,
  subtitle,
  uniteLabel,
  backHref = "/rapports",
  meta,
  children,
}: {
  title: string;
  subtitle?: string;
  uniteLabel?: string;
  backHref?: string;
  meta?: ReactNode;
  children: ReactNode;
}) {
  const generatedAt = formatDate(new Date());

  return (
    <div className="report-page">
      <div className="report-toolbar no-print">
        <Link href={backHref} className="btn btn--ghost">
          ← Retour
        </Link>
        <PrintButton />
      </div>

      <article className="report-doc">
        <header className="report-doc__header">
          <div className="report-doc__brand">
            <span className="report-doc__mark">GRC</span>
            <span className="report-doc__product">Pilotage</span>
          </div>
          {uniteLabel ? (
            <p className="report-doc__unite">{uniteLabel}</p>
          ) : null}
          <h1 className="report-doc__title">{title}</h1>
          {subtitle ? <p className="report-doc__subtitle">{subtitle}</p> : null}
          <p className="report-doc__meta">
            Généré le {generatedAt}
            {meta ? <> · {meta}</> : null}
          </p>
        </header>
        <div className="report-doc__body">{children}</div>
        <footer className="report-doc__footer">
          Document généré depuis GRC Pilotage — usage interne
        </footer>
      </article>
    </div>
  );
}

export function ReportSection({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="report-section">
      <h2 className="report-section__title">{title}</h2>
      <div className="report-section__body">{children}</div>
    </section>
  );
}

export function ReportKpis({
  items,
}: {
  items: Array<{ label: string; value: string | number }>;
}) {
  return (
    <div className="report-kpis">
      {items.map((item) => (
        <div key={item.label} className="report-kpi">
          <span className="report-kpi__value">{item.value}</span>
          <span className="report-kpi__label">{item.label}</span>
        </div>
      ))}
    </div>
  );
}
