import { FlashBanner } from "@/components/Flash";
import {
  InventoryEmpty,
  InventoryList,
  InventoryRow,
} from "@/components/inventory/InventoryRow";
import { PageHeader, BtnLink } from "@/components/ui";
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
  const users = await prisma.utilisateur.findMany({
    include: { unite: { select: { code: true, nom: true } } },
    orderBy: [{ actif: "desc" }, { nom: "asc" }],
  });

  return (
    <>
      <PageHeader
        title="Utilisateurs"
        description="Inventaire des comptes — création et édition réservées aux administrateurs."
        actions={
          <BtnLink href="/administration/utilisateurs/nouveau">
            Nouvel utilisateur
          </BtnLink>
        }
      />
      <FlashBanner ok={sp.ok} erreur={sp.erreur} />

      {users.length === 0 ? (
        <InventoryEmpty>Aucun utilisateur.</InventoryEmpty>
      ) : (
        <InventoryList
          columns={["Nom", "Rôle", "Unité"]}
          secondaryColumns={["E-mail", "Fonction", "Statut"]}
        >
          {users.map((u) => (
            <li key={u.id}>
              <InventoryRow
                href={`/administration/utilisateurs/${u.id}`}
                archived={!u.actif}
                primary={[
                  {
                    value: formatUtilisateurNom(u),
                    emphasis: "title",
                  },
                  {
                    value:
                      ROLE_UTILISATEUR_LABELS[u.role] ?? u.role,
                    emphasis: "status",
                    badgeTone:
                      u.role === "ADMINISTRATEUR"
                        ? "info"
                        : u.role === "RESPONSABLE"
                          ? "ok"
                          : "neutral",
                  },
                  {
                    value: `${u.unite.code} — ${u.unite.nom}`,
                  },
                ]}
                secondary={[
                  { value: u.email, emphasis: "muted" },
                  { value: u.fonction ?? "—", emphasis: "muted" },
                  {
                    value: u.actif ? "Actif" : "Inactif",
                    emphasis: "muted",
                  },
                ]}
              />
            </li>
          ))}
        </InventoryList>
      )}
    </>
  );
}
