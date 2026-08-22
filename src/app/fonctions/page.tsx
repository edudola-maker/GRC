import Link from "next/link";
import { FlashBanner } from "@/components/Flash";
import { PageHeader, BtnLink } from "@/components/ui";
import {
  PERIMETRE_ACCES_LABELS,
  ROLE_UTILISATEUR_LABELS,
} from "@/lib/labels";
import { prisma } from "@/lib/prisma";
import { formatUtilisateurNom, getCurrentUser } from "@/lib/session";

export const dynamic = "force-dynamic";

export default async function FonctionsPage({
  searchParams,
}: {
  searchParams: Promise<{ ok?: string; erreur?: string }>;
}) {
  const sp = await searchParams;
  const user = await getCurrentUser();
  const rows = await prisma.fonction.findMany({
    where: { uniteId: user.uniteId, archive: false },
    include: {
      affectations: {
        include: {
          utilisateur: { select: { id: true, nom: true, prenom: true } },
        },
      },
      _count: { select: { raciParticipants: true } },
    },
    orderBy: { code: "asc" },
  });

  return (
    <>
      <PageHeader
        title="Fonctions"
        actions={
          <BtnLink href="/fonctions/nouveau" variant="ghost">
            + Fonction
          </BtnLink>
        }
      />
      <FlashBanner ok={sp.ok} erreur={sp.erreur} />
      <p className="muted" style={{ marginTop: 0 }}>
        Référentiel organisationnel durable (FCT) — distinct des rôles
        applicatifs. Les titulaires héritent des responsabilités structurelles
        (RACI, etc.).
      </p>

      {rows.length === 0 ? (
        <p className="empty">Aucune fonction — créez le référentiel.</p>
      ) : (
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Code</th>
                <th>Nom</th>
                <th>Titulaires</th>
                <th>Rôle app.</th>
                <th>Périmètre</th>
                <th>RACI</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((f) => {
                const tit = f.affectations.filter((a) => a.type === "TITULAIRE");
                const sup = f.affectations.filter((a) => a.type === "SUPPLEANT");
                return (
                  <tr key={f.id}>
                    <td>
                      <Link href={`/fonctions/${f.id}`}>{f.code}</Link>
                    </td>
                    <td>
                      <Link href={`/fonctions/${f.id}`}>
                        <strong>{f.nom}</strong>
                      </Link>
                      {!f.actif ? (
                        <span className="muted"> · inactive</span>
                      ) : null}
                    </td>
                    <td>
                      {tit.length === 0 ? (
                        <span className="muted">—</span>
                      ) : (
                        tit
                          .map((a) => formatUtilisateurNom(a.utilisateur))
                          .join(", ")
                      )}
                      {sup.length > 0 ? (
                        <span className="muted">
                          {" "}
                          · suppl.{" "}
                          {sup
                            .map((a) => formatUtilisateurNom(a.utilisateur))
                            .join(", ")}
                        </span>
                      ) : null}
                    </td>
                    <td>
                      {f.roleApplicatif
                        ? ROLE_UTILISATEUR_LABELS[f.roleApplicatif]
                        : "—"}
                    </td>
                    <td>{PERIMETRE_ACCES_LABELS[f.perimetre] ?? f.perimetre}</td>
                    <td>{f._count.raciParticipants}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
