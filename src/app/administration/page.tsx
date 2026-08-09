import Link from "next/link";
import { PageHeader } from "@/components/ui";

export const dynamic = "force-dynamic";

const HUB_LINKS = [
  {
    href: "/administration/utilisateurs",
    title: "Utilisateurs",
    description: "Inventaire, création et édition des comptes.",
  },
  {
    href: "/administration/unites",
    title: "Unités",
    description: "Administration technique des unités (codes, responsables).",
  },
  {
    href: "/administration/roles",
    title: "Rôles",
    description: "Rôles applicatifs vs rôles de mission — lecture seule.",
  },
] as const;

export default function AdministrationHubPage() {
  return (
    <>
      <PageHeader
        title="Administration"
        description="Paramétrage des utilisateurs, des unités et des rôles applicatifs."
      />
      <ul className="admin-hub">
        {HUB_LINKS.map((item) => (
          <li key={item.href}>
            <Link href={item.href} className="admin-hub__link">
              <strong>{item.title}</strong>
              <span>{item.description}</span>
            </Link>
          </li>
        ))}
      </ul>
    </>
  );
}
