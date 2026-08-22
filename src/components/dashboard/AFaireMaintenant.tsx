import Link from "next/link";
import type { AFaireItem } from "@/lib/a-faire-maintenant";

export function AFaireMaintenant({
  items,
  title = "À faire maintenant",
}: {
  items: AFaireItem[];
  title?: string;
}) {
  if (items.length === 0) return null;

  return (
    <section className="a-faire" aria-label={title}>
      <h2 className="a-faire__title">{title}</h2>
      <ul className="a-faire__list">
        {items.map((item) => (
          <li
            key={item.id}
            className={`a-faire__item a-faire__item--${item.priorite}`}
          >
            <Link href={item.href} className="a-faire__link">
              <span className="a-faire__prio" aria-hidden>
                {item.priorite === "haute"
                  ? "!"
                  : item.priorite === "moyenne"
                    ? "·"
                    : "–"}
              </span>
              <span>
                <strong>{item.titre}</strong>
                <span className="muted a-faire__detail">{item.detail}</span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
