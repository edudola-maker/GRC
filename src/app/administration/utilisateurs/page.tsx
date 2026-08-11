import { FlashBanner } from "@/components/Flash";
import { UtilisateurInventory } from "@/components/administration/UtilisateurInventory";
import { PageHeader } from "@/components/ui";
import { ROLE_UTILISATEUR_LABELS } from "@/lib/labels";
import { prisma } from "@/lib/prisma";
import { formatUtilisateurNom } from "@/lib/session";

export const dynamic = "force-dynamic";

export default async function AdminUtilisateursPage({
  searchParams,
}: {
  searchParams: Promise<{ ok?: string; erreur?: string }>;
}) {
  const sp = await searchParams;
  const [users, unites] = await Promise.all([
    prisma.utilisateur.findMany({
      include: { unite: { select: { id: true, code: true, nom: true } } },
      orderBy: [{ actif: "desc" }, { nom: "asc" }, { prenom: "asc" }],
    }),
    prisma.unite.findMany({
      orderBy: { nom: "asc" },
      select: { id: true, code: true, nom: true },
    }),
  ]);

  const items = users.map((u) => ({
    id: u.id,
    nomAffiche: formatUtilisateurNom(u),
    email: u.email,
    fonction: u.fonction,
    role: u.role,
    roleLabel: ROLE_UTILISATEUR_LABELS[u.role] ?? u.role,
    uniteId: u.uniteId,
    uniteLabel: `${u.unite.code} — ${u.unite.nom}`,
    actif: u.actif,
  }));

  const roles = Object.entries(ROLE_UTILISATEUR_LABELS).map(
    ([value, label]) => ({ value, label }),
  );

  return (
    <>
      <PageHeader
        title="Utilisateurs"
      />
      <FlashBanner ok={sp.ok} erreur={sp.erreur} />

      <UtilisateurInventory
        items={items}
        unites={unites.map((u) => ({
          id: u.id,
          label: `${u.code} — ${u.nom}`,
        }))}
        roles={roles}
        createHref="/administration/utilisateurs/nouveau"
        createLabel="Nouvel utilisateur"
      />
    </>
  );
}
