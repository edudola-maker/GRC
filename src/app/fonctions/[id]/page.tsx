import Link from "next/link";
import { notFound } from "next/navigation";
import { FlashBanner, BackLink } from "@/components/Flash";
import { SubmitButton } from "@/components/FormControls";
import { PageHeader } from "@/components/ui";
import {
  PERIMETRE_ACCES_LABELS,
  ROLE_UTILISATEUR_LABELS,
  formatDate,
} from "@/lib/labels";
import { prisma } from "@/lib/prisma";
import {
  formatUtilisateurNom,
  getCurrentUser,
  listUtilisateursActifsForCurrentUnite,
} from "@/lib/session";
import {
  addFonctionAffectation,
  removeFonctionAffectation,
  updateFonction,
} from "../actions";

export const dynamic = "force-dynamic";

export default async function FonctionDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ ok?: string; erreur?: string }>;
}) {
  const { id } = await params;
  const sp = await searchParams;
  const user = await getCurrentUser();

  const [f, users] = await Promise.all([
    prisma.fonction.findFirst({
      where: { id, uniteId: user.uniteId },
      include: {
        affectations: {
          include: {
            utilisateur: { select: { id: true, nom: true, prenom: true } },
          },
          orderBy: [{ type: "asc" }, { creeLe: "asc" }],
        },
        raciParticipants: {
          include: {
            ligne: {
              include: {
                processus: { select: { id: true, code: true, nom: true } },
              },
            },
          },
          take: 40,
        },
      },
    }),
    listUtilisateursActifsForCurrentUnite(),
  ]);

  if (!f) notFound();

  const titulaires = f.affectations.filter((a) => a.type === "TITULAIRE");
  const suppleants = f.affectations.filter((a) => a.type === "SUPPLEANT");

  return (
    <>
      <BackLink href="/fonctions" label="← Retour aux fonctions" />
      <PageHeader title={`${f.code} — ${f.nom}`} />
      <FlashBanner ok={sp.ok} erreur={sp.erreur} />

      <section className="card-section">
        <h2>Identité</h2>
        <form action={updateFonction} className="entity-form">
          <input type="hidden" name="id" value={f.id} />
          <label>
            Code
            <input name="code" defaultValue={f.code} required />
          </label>
          <label>
            Nom
            <input name="nom" defaultValue={f.nom} required />
          </label>
          <label>
            Description
            <textarea
              name="description"
              rows={3}
              defaultValue={f.description ?? ""}
            />
          </label>
          <label>
            Rôle applicatif associé
            <select name="roleApplicatif" defaultValue={f.roleApplicatif ?? ""}>
              <option value="">—</option>
              {Object.entries(ROLE_UTILISATEUR_LABELS).map(([v, l]) => (
                <option key={v} value={v}>
                  {l}
                </option>
              ))}
            </select>
          </label>
          <label>
            Périmètre
            <select name="perimetre" defaultValue={f.perimetre}>
              {Object.entries(PERIMETRE_ACCES_LABELS).map(([v, l]) => (
                <option key={v} value={v}>
                  {l}
                </option>
              ))}
            </select>
          </label>
          <label className="checkbox-label">
            <input type="checkbox" name="actif" defaultChecked={f.actif} />{" "}
            Active
          </label>
          <div className="form-actions">
            <SubmitButton>Enregistrer</SubmitButton>
          </div>
        </form>
      </section>

      <section className="card-section">
        <h2>Titulaires &amp; suppléance</h2>
        <p className="muted">
          Architecture de suppléance prête — pas de moteur de délégation
          temporaire pour l’instant.
        </p>
        <ul className="compact-list">
          {titulaires.map((a) => (
            <li key={a.id}>
              <strong>{formatUtilisateurNom(a.utilisateur)}</strong>
              <span className="muted"> · titulaire</span>
              <form action={removeFonctionAffectation} className="inline-form">
                <input type="hidden" name="id" value={a.id} />
                <button type="submit" className="btn btn--ghost btn--sm">
                  Retirer
                </button>
              </form>
            </li>
          ))}
          {suppleants.map((a) => (
            <li key={a.id}>
              <strong>{formatUtilisateurNom(a.utilisateur)}</strong>
              <span className="muted"> · suppléant</span>
              <form action={removeFonctionAffectation} className="inline-form">
                <input type="hidden" name="id" value={a.id} />
                <button type="submit" className="btn btn--ghost btn--sm">
                  Retirer
                </button>
              </form>
            </li>
          ))}
          {f.affectations.length === 0 ? (
            <li className="muted">Aucun titulaire.</li>
          ) : null}
        </ul>
        <form action={addFonctionAffectation} className="entity-form inline-row">
          <input type="hidden" name="fonctionId" value={f.id} />
          <label>
            Collaborateur
            <select name="utilisateurId" required defaultValue="">
              <option value="" disabled>
                Choisir…
              </option>
              {users.map((u) => (
                <option key={u.id} value={u.id}>
                  {formatUtilisateurNom(u)}
                </option>
              ))}
            </select>
          </label>
          <label>
            Type
            <select name="type" defaultValue="TITULAIRE">
              <option value="TITULAIRE">Titulaire</option>
              <option value="SUPPLEANT">Suppléant</option>
            </select>
          </label>
          <SubmitButton>Ajouter</SubmitButton>
        </form>
      </section>

      <section className="card-section">
        <h2>Responsabilités structurelles (RACI)</h2>
        {f.raciParticipants.length === 0 ? (
          <p className="empty">Aucune ligne RACI liée.</p>
        ) : (
          <ul className="compact-list">
            {f.raciParticipants.map((p) => (
              <li key={p.id}>
                <Link href={`/processus/${p.ligne.processus.id}`}>
                  {p.ligne.processus.code}
                </Link>
                <span className="muted">
                  {" "}
                  · {p.role} · {p.ligne.activite}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <p className="muted" style={{ fontSize: "0.8rem" }}>
        Créée {formatDate(f.creeLe)} · modifiée {formatDate(f.modifieLe)}
      </p>
    </>
  );
}
