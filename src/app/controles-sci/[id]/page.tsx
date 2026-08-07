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
  addPreuve,
  archiveControle,
  createTacheDepuisControle,
  deleteControle,
  removePreuve,
  unarchiveControle,
  validerControle,
} from "../actions";
import {
  CATEGORIE_RISQUE_LABELS,
  CATEGORIE_TACHE_LABELS,
  FREQUENCE_LABELS,
  STATUT_CONTROLE_LABELS,
  STATUT_RISQUE_LABELS,
  STATUT_TACHE_LABELS,
  formatDate,
  startOfToday,
  urgenceEcheance,
} from "@/lib/labels";
import { TACHE_STATUTS_CLOS } from "@/lib/catalog";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function ControleSCIDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ ok?: string; erreur?: string }>;
}) {
  const { id } = await params;
  const sp = await searchParams;
  const today = startOfToday();

  const [controle, documents] = await Promise.all([
    prisma.controleSCI.findUnique({
      where: { id },
      include: {
        responsable: true,
        creePar: true,
        modifiePar: true,
        soumisPar: true,
        validePar: true,
        preuves: {
          include: { document: true },
          orderBy: { creeLe: "desc" },
        },
        risques: {
          include: { risque: { include: { responsable: true } } },
          orderBy: { creeLe: "desc" },
        },
        taches: {
          include: { responsable: true },
          orderBy: { dateEcheance: "asc" },
        },
      },
    }),
    prisma.document.findMany({
      where: { archive: false },
      orderBy: { nom: "asc" },
      select: { id: true, nom: true },
    }),
  ]);
  if (!controle) notFound();

  const clos = controle.statut === "REALISE";
  const enRetard =
    controle.statut === "EN_RETARD" ||
    (!clos &&
      controle.dateProchaineEcheance != null &&
      controle.dateProchaineEcheance < today);
  const peutValider = !controle.archive && !clos;
  const preuveIds = new Set(controle.preuves.map((p) => p.documentId));
  const docsDisponibles = documents.filter((d) => !preuveIds.has(d.id));

  return (
    <>
      <BackLink href="/controles-sci" label="← Retour aux contrôles SCI" />
      <PageHeader
        title={controle.nom}
        description={controle.description ?? "Aucune description."}
        actions={
          <>
            {!controle.archive ? (
              <BtnLink href={`/controles-sci/${controle.id}/modifier`}>
                Modifier
              </BtnLink>
            ) : null}
            {peutValider ? (
              <ConfirmActionButton
                action={validerControle}
                id={controle.id}
                label={
                  controle.statut === "A_VALIDER"
                    ? "Valider / Réaliser"
                    : "Marquer réalisé"
                }
                confirmMessage="Marquer ce contrôle comme réalisé ? La prochaine échéance et une tâche de suivi seront calculées selon la fréquence."
                variant="primary"
                pendingLabel="Validation…"
              />
            ) : null}
            {controle.archive ? (
              <ConfirmActionButton
                action={unarchiveControle}
                id={controle.id}
                label="Désarchiver"
                confirmMessage="Remettre ce contrôle dans la liste active ?"
              />
            ) : (
              <ConfirmActionButton
                action={archiveControle}
                id={controle.id}
                label="Archiver"
                confirmMessage="Archiver ce contrôle ?"
              />
            )}
            <ConfirmDeleteButton
              action={deleteControle}
              id={controle.id}
              confirmMessage="Supprimer définitivement ce contrôle ? Les preuves liées seront retirées ; les tâches resteront sans contrôle."
            />
          </>
        }
      />
      <FlashBanner ok={sp.ok} erreur={sp.erreur} />

      {controle.archive ? (
        <div className="flash flash--warn" role="status">
          Ce contrôle est archivé. Vous pouvez le désarchiver ou le consulter en
          lecture.
        </div>
      ) : null}
      {enRetard ? (
        <div className="flash flash--error">
          Échéance dépassée — contrôle en retard.
        </div>
      ) : null}

      <div className="detail-grid">
        <div className="panel">
          <h2 className="panel-title">Informations</h2>
          <dl className="kv">
            <div>
              <dt>Responsable</dt>
              <dd>{controle.responsable.nom}</dd>
            </div>
            <div>
              <dt>Processus</dt>
              <dd>{controle.processusConcerne}</dd>
            </div>
            <div>
              <dt>Statut</dt>
              <dd>{STATUT_CONTROLE_LABELS[controle.statut]}</dd>
            </div>
            <div>
              <dt>Fréquence</dt>
              <dd>{FREQUENCE_LABELS[controle.frequence]}</dd>
            </div>
            <div>
              <dt>Dernière réalisation</dt>
              <dd>{formatDate(controle.dateDerniereRealisation)}</dd>
            </div>
            <div>
              <dt>Prochaine échéance</dt>
              <dd>{formatDate(controle.dateProchaineEcheance)}</dd>
            </div>
            <div>
              <dt>Soumis par</dt>
              <dd>
                {controle.soumisPar?.nom ?? "—"}
                {controle.dateSoumission
                  ? ` · ${formatDate(controle.dateSoumission)}`
                  : ""}
              </dd>
            </div>
            <div>
              <dt>Validé par</dt>
              <dd>
                {controle.validePar?.nom ?? "—"}
                {controle.dateValidation
                  ? ` · ${formatDate(controle.dateValidation)}`
                  : ""}
              </dd>
            </div>
          </dl>
          {controle.commentaires ? (
            <p className="detail-note">{controle.commentaires}</p>
          ) : null}
          <p className="detail-trace">
            Créé par {controle.creePar.nom} · Modifié par{" "}
            {controle.modifiePar.nom} · {formatDate(controle.modifieLe)}
          </p>
        </div>

        <div className="panel">
          <div className="panel-head">
            <h2 className="panel-title">
              Preuves ({controle.preuves.length})
            </h2>
          </div>
          {!controle.archive ? (
            <form
              action={addPreuve}
              className="form-actions"
              style={{ marginBottom: "0.85rem", flexWrap: "wrap" }}
            >
              <input type="hidden" name="controleSCIId" value={controle.id} />
              <label className="field" htmlFor="documentId" style={{ flex: 1, minWidth: "12rem" }}>
                <span className="field__label">Lier un document</span>
                <select
                  id="documentId"
                  name="documentId"
                  required
                  defaultValue=""
                >
                  <option value="" disabled>
                    {docsDisponibles.length === 0
                      ? "Aucun document disponible"
                      : "Choisir un document…"}
                  </option>
                  {docsDisponibles.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.nom}
                    </option>
                  ))}
                </select>
              </label>
              <SubmitButton pendingLabel="Ajout…">Ajouter la preuve</SubmitButton>
            </form>
          ) : null}
          {controle.preuves.length === 0 ? (
            <p className="empty">Aucune preuve liée.</p>
          ) : (
            <ul className="entity-list">
              {controle.preuves.map((p) => (
                <li key={p.id}>
                  <div className="entity-row">
                    <div className="entity-row__main">
                      <strong>
                        <Link href={`/documents/${p.document.id}`}>
                          {p.document.nom}
                        </Link>
                      </strong>
                      <span className="entity-row__meta">
                        Lié le {formatDate(p.creeLe)}
                      </span>
                    </div>
                    {!controle.archive ? (
                      <form action={removePreuve}>
                        <input type="hidden" name="id" value={p.id} />
                        <input
                          type="hidden"
                          name="controleSCIId"
                          value={controle.id}
                        />
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

        <div className="panel">
          <div className="panel-head">
            <h2 className="panel-title">
              Risques liés ({controle.risques.length})
            </h2>
          </div>
          {controle.risques.length === 0 ? (
            <p className="empty">Aucun risque lié.</p>
          ) : (
            <ul className="entity-list">
              {controle.risques.map((rc) => (
                <li key={rc.id}>
                  <Link
                    href={`/risques/${rc.risque.id}`}
                    className="entity-row"
                  >
                    <div className="entity-row__main">
                      <strong>{rc.risque.nom}</strong>
                      <span className="entity-row__meta">
                        {CATEGORIE_RISQUE_LABELS[rc.risque.categorie]} ·{" "}
                        {STATUT_RISQUE_LABELS[rc.risque.statut]} · Criticité{" "}
                        {rc.risque.criticite} · {rc.risque.responsable.nom}
                      </span>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="panel">
          <div className="panel-head">
            <h2 className="panel-title">
              Tâches liées ({controle.taches.length})
            </h2>
          </div>
          {!controle.archive ? (
            <form
              action={createTacheDepuisControle}
              className="form-actions"
              style={{ marginBottom: "0.85rem" }}
            >
              <input type="hidden" name="controleSCIId" value={controle.id} />
              <SubmitButton>Ajouter une tâche</SubmitButton>
            </form>
          ) : null}
          {controle.taches.length === 0 ? (
            <p className="empty">Aucune tâche liée.</p>
          ) : (
            <ul className="entity-list">
              {controle.taches.map((t) => {
                const tClos = (TACHE_STATUTS_CLOS as readonly string[]).includes(
                  t.statut,
                );
                const urgence = urgenceEcheance(t.dateEcheance, tClos);
                return (
                  <li key={t.id}>
                    <Link
                      href={`/taches/${t.id}`}
                      className={`entity-row entity-row--${urgence}`}
                    >
                      <div className="entity-row__main">
                        <strong>{t.titre}</strong>
                        <span className="entity-row__meta">
                          {CATEGORIE_TACHE_LABELS[t.categorie]} ·{" "}
                          {t.responsable.nom} · {STATUT_TACHE_LABELS[t.statut]}
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
      </div>
    </>
  );
}
