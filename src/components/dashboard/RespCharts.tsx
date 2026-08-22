import Link from "next/link";

export type DonutSlice = {
  key: string;
  label: string;
  value: number;
  href: string;
  color: string;
};

/** Anneau SVG simple — chaque part est un lien cliquable. */
export function DonutChart({
  slices,
  size = 168,
  thickness = 28,
  centerLabel,
}: {
  slices: DonutSlice[];
  size?: number;
  thickness?: number;
  centerLabel?: string;
}) {
  const total = slices.reduce((s, x) => s + x.value, 0);
  const r = (size - thickness) / 2;
  const c = 2 * Math.PI * r;
  const cx = size / 2;
  const cy = size / 2;

  let offset = 0;
  const arcs =
    total === 0
      ? null
      : slices
          .filter((s) => s.value > 0)
          .map((s) => {
            const len = (s.value / total) * c;
            const dash = `${len} ${c - len}`;
            const el = (
              <Link
                key={s.key}
                href={s.href}
                className="donut-slice"
                title={`${s.label} : ${s.value}`}
                aria-label={`${s.label} : ${s.value}`}
              >
                <circle
                  cx={cx}
                  cy={cy}
                  r={r}
                  fill="none"
                  stroke={s.color}
                  strokeWidth={thickness}
                  strokeDasharray={dash}
                  strokeDashoffset={-offset}
                  strokeLinecap="butt"
                />
              </Link>
            );
            offset += len;
            return el;
          });

  return (
    <div className="donut">
      <svg
        className="donut__svg"
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        style={{ transform: "rotate(-90deg)" }}
        role="img"
        aria-label="Répartition d’activité"
      >
        <circle
          cx={cx}
          cy={cy}
          r={r}
          fill="none"
          stroke="#ebe4da"
          strokeWidth={thickness}
        />
        {arcs}
      </svg>
      <div className="donut__center">
        <strong>{total}</strong>
        <span>{centerLabel ?? "actifs"}</span>
      </div>
      <ul className="donut__legend">
        {slices.map((s) => (
          <li key={s.key}>
            <Link href={s.href}>
              <i style={{ background: s.color }} aria-hidden />
              <span>
                {s.label} <strong>{s.value}</strong>
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

export type BarItem = {
  key: string;
  label: string;
  value: number;
  href: string;
  tone?: "default" | "warn" | "danger";
  /** Sous-titre optionnel (ex. cible). */
  subtitle?: string;
};

export function HBarChart({
  items,
  max,
}: {
  items: BarItem[];
  max?: number;
}) {
  const m = Math.max(1, max ?? Math.max(1, ...items.map((i) => i.value)));
  return (
    <div className="hbar">
      {items.map((i) => {
        const pct = Math.round((i.value / m) * 100);
        return (
          <Link key={i.key} href={i.href} className="hbar__row">
            <span className="hbar__label">
              {i.label}
              {i.subtitle ? (
                <em className="hbar__subtitle">{i.subtitle}</em>
              ) : null}
            </span>
            <span className="hbar__track">
              <span
                className={`hbar__fill${i.tone && i.tone !== "default" ? ` hbar__fill--${i.tone}` : ""}`}
                style={{ width: `${pct}%` }}
              />
            </span>
            <strong className="hbar__value">{i.value}</strong>
          </Link>
        );
      })}
      {items.length === 0 ? <p className="muted">Aucune donnée.</p> : null}
    </div>
  );
}

export type AttentionItem = {
  key: string;
  value: number;
  label: string;
  href: string;
  tone?: "danger" | "warn" | "info" | "default";
};

/** Compteurs d’attention — chiffres clairs, cliquables. */
export function AttentionCounters({ items }: { items: AttentionItem[] }) {
  return (
    <div className="attention-strip" role="group" aria-label="Points d’attention">
      {items.map((i) => (
        <Link
          key={i.key}
          href={i.href}
          className={`attention-strip__item attention-strip__item--${i.tone ?? "default"}`}
        >
          <strong>{i.value}</strong>
          <span>{i.label}</span>
        </Link>
      ))}
    </div>
  );
}

export type BucketItem = {
  key: string;
  label: string;
  value: number;
  href: string;
  tone?: "danger" | "warn" | "info" | "default";
};

/** Répartition temporelle simple (colonnes cliquables). */
export function TimeBuckets({ items }: { items: BucketItem[] }) {
  const max = Math.max(1, ...items.map((i) => i.value));
  return (
    <div className="time-buckets" role="group" aria-label="Échéances">
      {items.map((i) => {
        const h = Math.max(8, Math.round((i.value / max) * 88));
        return (
          <Link
            key={i.key}
            href={i.href}
            className={`time-buckets__col time-buckets__col--${i.tone ?? "default"}`}
            title={`${i.label} : ${i.value}`}
          >
            <span className="time-buckets__value">{i.value}</span>
            <span className="time-buckets__bar" style={{ height: `${h}px` }} />
            <span className="time-buckets__label">{i.label}</span>
          </Link>
        );
      })}
    </div>
  );
}
