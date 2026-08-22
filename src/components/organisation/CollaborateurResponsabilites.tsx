import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { TACHE_STATUTS_CLOS } from "@/lib/catalog";

/** Synthèse responsabilités structurelles + opérationnelles (fiche Collaborateur). */
export async function CollaborateurResponsabilites({
  utilisateurId,
  uniteId,
}: {
  utilisateurId: string;
  uniteId: string;
}) {
  const [fonctions, raci, taches, projets, missions, conseils] =
    await Promise.all([
      prisma.fonctionAffectation.findMany({
        where: { utilisateurId, fonction: { uniteId, archive: false } },
        include: {
          fonction: { select: { id: true, code: true, nom: true } },
        },
      }),
      prisma.processusRaciParticipant.findMany({
        where: {
          OR: [
            { utilisateurId },
            {
              fonction: {
                affectations: {
                  some: { utilisateurId, type: "TITULAIRE" },
                },
              },
            },
          ],
        },
        include: {
          ligne: {
            include: {
              processus: { select: { id: true, code: true, nom: true } },
            },
          },
          fonction: { select: { nom: true } },
        },
        take: 20,
      }),
      prisma.tache.count({
        where: {
          responsableId: utilisateurId,
          statut: { notIn: [...TACHE_STATUTS_CLOS] },
        },
      }),
      prisma.projet.count({
        where: {
          uniteId,
          archive: false,
          OR: [
            { responsableId: utilisateurId },
            { membres: { some: { utilisateurId } } },
          ],
          statut: { notIn: ["CLOTURE", "ABANDONNE"] },
        },
      }),
      prisma.mission.count({
        where: {
          uniteId,
          archive: false,
          OR: [
            { responsableId: utilisateurId },
            { membres: { some: { utilisateurId } } },
          ],
          statut: { notIn: ["ANNULE"] },
        },
      }),
      prisma.conseil.count({
        where: {
          uniteId,
          archive: false,
          responsableId: utilisateurId,
          statut: { notIn: ["CLOTURE", "ANNULE"] },
        },
      }),
    ]);

  return (
    <div className="collab-resp">
      <section className="card-section">
        <h2>Fonction(s)</h2>
        {fonctions.length === 0 ? (
          <p className="empty">Aucune affectation FCT.</p>
        ) : (
          <ul className="compact-list">
            {fonctions.map((a) => (
              <li key={a.id}>
                <Link href={`/fonctions/${a.fonction.id}`}>
                  {a.fonction.code} — {a.fonction.nom}
                </Link>
                <span className="muted">
                  {" "}
                  · {a.type === "SUPPLEANT" ? "suppléant" : "titulaire"}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="card-section">
        <h2>Responsabilités structurelles</h2>
        {raci.length === 0 ? (
          <p className="empty">Aucun RACI lié.</p>
        ) : (
          <ul className="compact-list">
            {raci.map((p) => (
              <li key={p.id}>
                <Link href={`/processus/${p.ligne.processus.id}`}>
                  {p.ligne.processus.code}
                </Link>
                <span className="muted">
                  {" "}
                  · {p.role} · {p.ligne.activite}
                  {p.fonction ? ` (${p.fonction.nom})` : ""}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="card-section">
        <h2>Responsabilités opérationnelles</h2>
        <ul className="compact-list">
          <li>
            Tâches ouvertes : <strong>{taches}</strong>
          </li>
          <li>
            Projets : <strong>{projets}</strong>
          </li>
          <li>
            Missions : <strong>{missions}</strong>
          </li>
          <li>
            Conseils : <strong>{conseils}</strong>
          </li>
        </ul>
      </section>
    </div>
  );
}
