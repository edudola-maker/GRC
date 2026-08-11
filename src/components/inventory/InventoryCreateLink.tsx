import Link from "next/link";

/** Bouton de création standard des inventaires — toujours visible (primary). */
export function InventoryCreateLink({
  href,
  label,
}: {
  href: string;
  label: string;
}) {
  const text = label.trim().startsWith("+") ? label.trim() : `+ ${label.trim()}`;
  return (
    <Link className="btn btn--primary" href={href}>
      {text}
    </Link>
  );
}
