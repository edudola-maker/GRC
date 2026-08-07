import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ConfirmActionButton,
  ConfirmDeleteButton,
  SubmitButton,
} from "@/components/FormControls";
import { FlashBanner, BackLink } from "@/components/Flash";
import { PageHeader, BtnLink } from "@/components/ui";
import {
  archiveProjet,
  createJalon,
  deleteJalon,
  deleteProjet,
  linkProjetDocument,
  setProjetMembres,
  toggleJalon,
  unarchiveProjet,
  unlinkProjetDocument,
} from "../actions";
import {
  CATEGORIE_TACHE_LABELS,
  PRIORITE_LABELS,
  STATUT_PROJET_LABELS,
  STATUT_TACHE_LABELS,
  TYPE_DOCUMENT_LABELS,
  formatDate,
  urgenceEcheance,
} from "@/lib/labels";
import { TACHE_STATUTS_CLOS } from "@/lib/catalog";
import { prisma } from "@/lib/prisma";
import { listUtilisateursActifs } from "@/lib/session";

export const dynamic = "force-dynamic";

export default async function ProjetDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ ok?: string; erreur?: string }>;
}) {
  const { id } = await params;
  const sp = await searchParams;
  const [projet, users, documentsDispo] = await Promise.all([
    prisma.projet.findUnique({
      where: { id },
      include: {
        responsable: true,
        creePar: true,
        modifiePar: true,
        membres: { include: { utilisateur: true } },
        jalons: { orderBy: { dateEcheance: "asc" } },
        documents: {
          include: { document: true },
          orderBy: { creeLe: "desc" },
        },
        taches: {
          include: { responsable: true },
          orderBy: { dateEcheance: "asc" },
        },
      },
    }),
    listUtilisateursActifs(),
    prisma.document.findMany({
      where: { archive: false },
      orderBy: { nom: "asc" },
      select: { id: true, nom: true, typeDocument: true },
    }),
  ]);

  if (!projet) notFound();

  const membreIds = new Set(projet.membres.map((m) => m.utilisateurId));
  const linkedDocIds = new Set(projet.documents.map((d) => d.documentId));
  const docsDisponibles = documentsDispo.filter((d) => !linkedDocIds.has(d.id));
  const jalonsAtteints = projet.jalons.filter((j) => j.atteint).length;

  return (
    <>
      <BackLink href="/projets" label="← Retour aux projets" />
      <PageHeader
        title={projet.nom}
        description={projet.description ?? "Aucune description."}
        actions={
          <>
            {!projet.archive ? (
              <BtnLink href={`/projets/${projet.id}/modifier`}>Modifier</BtnLink>
            ) : null}
            {!projet.archive ? (
              <BtnLink
                href={`/taches/nouvelle?projetId=${projet.id}`}
                variant="ghost"
              >
                Ajouter une tâche
              </BtnLink>
            ) : null}
            {projet.archive ? (
              <ConfirmActionButton
                action={unarchiveProjet}
                id={projet.id}
                label="Désarchiver"
                confirmMessage="Remettre ce projet dans la liste active ?"
                pendingLabel="…"
              />
            ) : (
              <ConfirmActionButton
                action={archiveProjet}
                id={projet.id}
                label="Archiver"
                confirmMessage="Archiver ce projet ? Il disparaîtra de la liste active mais restera consultable."
                pendingLabel="…"
              />
            )}
            <ConfirmDeleteButton
              action={deleteProjet}
              id={projet.id}
              confirmMessage="Supprimer définitivement ce projet ? Les tâches associées resteront, sans projet."
            />
          </>
        }
      />

      <FlashBanner ok={sp.ok} erreur={sp.erreur} />

      {projet.archive ? (
        <div className="flash flash--warn" role="status">
          Ce projet est archivé. Vous pouvez le désarchiver ou le consulter en
          lecture.
        </div>
      ) : null}

      <div className="stats" style={{ marginBottom: "1rem" }}>
        <div className="stat">
          <strong>{projet.avancement}%</strong>
          Avancement
        </div>
        <div className="stat">
          <strong>
            {jalonsAtteints}/{projet.jalons.length}
          </strong>
          Jalons atteints
        </div>
        <div className="stat">
          <strong>{projet.taches.length}</strong>
          Tâches
        </div>
        <div className="stat">
          <strong>{projet.membres.length + 1}</strong>
          Équipe
        </div>
      </div>

      <div className="detail-grid">
        <div className="panel">
          <h2 className="panel-title">Informations</h2>
          <dl className="kv">
            <div>
              <dt>Responsable</dt>
              <dd>{projet.responsable.nom}</dd>
            </div>
            <div>
              <dt>Statut</dt>
              <dd>{STATUT_PROJET_LABELS[projet.statut]}</dd>
            </div>
            <div>
              <dt>Priorité</dt>
              <dd>{PRIORITE_LABELS[projet.priorite]}</dd>
            </div>
            <div>
              <dt>Avancement</dt>
              <dd>{projet.avancement} %</dd>
            </div>
            <div>
              <dt>Début</dt>
              <dd>{formatDate(projet.dateDebut)}</dd>
            </div>
            <div>
              <dt>Échéance</dt>
              <dd>{formatDate(projet.dateEcheance)}</dd>
            </div>
          </dl>
          {projet.commentaires ? (
            <p className="detail-note">{projet.commentaires}</p>
          ) : null}
          <p className="detail-trace">
            Créé par {projet.creePar.nom} · Modifié par {projet.modifiePar.nom} ·{" "}
            {formatDate(projet.modifieLe)}
          </p>
        </div>

        <div className="panel">
          <h2 className="panel-title">Équipe projet</h2>
          <p className="muted" style={{ marginBottom: "0.65rem" }}>
            Responsable : {projet.responsable.nom}. Cochez les membres
            éventuels.
          </p>
          {!projet.archive ? (
            <form action={setProjetMembres}>
              <input type="hidden" name="projetId" value={projet.id} />
              <ul className="check-list">
                {users
                  .filter((u) => u.id !== projet.responsableId)
                  .map((u) => (
                    <li key={u.id}>
                      <label>
                        <input
                          type="checkbox"
                          name="membreIds"
                          value={u.id}
                          defaultChecked={membreIds.has(u.id)}
                        />
                        {u.nom}
                      </label>
                    </li>
                  ))}
              </ul>
              <div className="form-actions" style={{ marginTop: "0.65rem" }}>
                <SubmitButton>Enregistrer l&apos;équipe</SubmitButton>
              </div>
            </form>
          ) : (
            <ul className="entity-list">
              {projet.membres.length === 0 ? (
                <li>
                  <p className="empty">Aucun membre additionnel.</p>
                </li>
              ) : (
                projet.membres.map((m) => (
                  <li key={m.id}>
                    <span className="entity-row__main">
                      <strong>{m.utilisateur.nom}</strong>
                    </span>
                  </li>
                ))
              )}
            </ul>
          )}
        </div>
      </div>

      <div className="detail-grid" style={{ marginTop: "1rem" }}>
        <div className="panel">
          <h2 className="panel-title">Jalons ({projet.jalons.length})</h2>
          {!projet.archive ? (
            <form action={createJalon} className="inline-form">
              <input type="hidden" name="projetId" value={projet.id} />
              <div className="inline-form__row">
                <label className="field" htmlFor="jalon-nom">
                  <span className="field__label">Nom *</span>
                  <input
                    id="jalon-nom"
                    name="nom"
                    required
                    placeholder="Ex. Livraison V1"
                  />
                </label>
                <label className="field" htmlFor="jalon-date">
                  <span className="field__label">Échéance</span>
                  <input id="jalon-date" name="dateEcheance" type="date" />
                </label>
                <SubmitButton>Ajouter</SubmitButton>
              </div>
            </form>
          ) : null}
          {projet.jalons.length === 0 ? (
            <p className="empty">Aucun jalon.</p>
          ) : (
            <ul className="jalon-list">
              {projet.jalons.map((j) => (
                <li key={j.id} className={j.atteint ? "is-done" : undefined}>
                  <div>
                    <strong>{j.nom}</strong>
                    <span className="entity-row__meta">
                      {" "}
                      {formatDate(j.dateEcheance)}
                      {j.atteint && j.dateAtteinte
                        ? ` · Atteint le ${formatDate(j.dateAtteinte)}`
                        : ""}
                    </span>
                  </div>
                  {!projet.archive ? (
                    <div className="form-actions">
                      <form action={toggleJalon}>
                        <input type="hidden" name="id" value={j.id} />
                        <SubmitButton variant="ghost" pendingLabel="…">
                          {j.atteint ? "Rouvrir" : "Atteint"}
                        </SubmitButton>
                      </form>
                      <form action={deleteJalon}>
                        <input type="hidden" name="id" value={j.id} />
                        <SubmitButton variant="danger" pendingLabel="…">
                          ×
                        </SubmitButton>
                      </form>
                    </div>
                  ) : null}
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="panel">
          <h2 className="panel-title">
            Documents liés ({projet.documents.length})
          </h2>
          {!projet.archive && docsDisponibles.length > 0 ? (
            <form action={linkProjetDocument} className="inline-form">
              <input type="hidden" name="projetId" value={projet.id} />
              <div className="inline-form__row">
                <label className="field" htmlFor="documentId">
                  <span className="field__label">Document</span>
                  <select id="documentId" name="documentId" required defaultValue="">
                    <option value="" disabled>
                      Choisir…
                    </option>
                    {docsDisponibles.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.nom} ({TYPE_DOCUMENT_LABELS[d.typeDocument]})
                      </option>
                    ))}
                  </select>
                </label>
                <SubmitButton>Lier</SubmitButton>
              </div>
            </form>
          ) : null}
          {projet.documents.length === 0 ? (
            <p className="empty">Aucun document lié.</p>
          ) : (
            <ul className="entity-list">
              {projet.documents.map((link) => (
                <li key={link.id}>
                  <div className="entity-row">
                    <div className="entity-row__main">
                      <Link href={`/documents/${link.document.id}`}>
                        <strong>{link.document.nom}</strong>
                      </Link>
                      <span className="entity-row__meta">
                        {TYPE_DOCUMENT_LABELS[link.document.typeDocument]}
                        {link.document.version
                          ? ` · v${link.document.version}`
                          : ""}
                      </span>
                    </div>
                    {!projet.archive ? (
                      <form action={unlinkProjetDocument}>
                        <input type="hidden" name="id" value={link.id} />
                        <SubmitButton variant="ghost" pendingLabel="…">
                          Retirer
                        </SubmitButton>
                      </form>
                    ) : null}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <div className="panel" style={{ marginTop: "1rem" }}>
        <div className="panel-head">
          <h2 className="panel-title">Tâches ({projet.taches.length})</h2>
        </div>
        {projet.taches.length === 0 ? (
          <p className="empty">Aucune tâche rattachée.</p>
        ) : (
          <ul className="entity-list">
            {projet.taches.map((t) => {
              const clos = (TACHE_STATUTS_CLOS as readonly string[]).includes(
                t.statut,
              );
              const urgence = urgenceEcheance(t.dateEcheance, clos);
              return (
                <li key={t.id}>
                  <Link
                    href={`/taches/${t.id}`}
                    className={`entity-row entity-row--${urgence}`}
                  >
                    <div className="entity-row__main">
                      <strong>{t.titre}</strong>
                      <span className="entity-row__meta">
                        {t.responsable.nom} ·{" "}
                        {CATEGORIE_TACHE_LABELS[t.categorie]} ·{" "}
                        {STATUT_TACHE_LABELS[t.statut]}
                        {urgence === "retard" ? " · En retard" : ""}
                      </span>
                    </div>
                    <span className="entity-row__date">
                      {formatDate(t.dateEcheance)}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </>
  );
}
