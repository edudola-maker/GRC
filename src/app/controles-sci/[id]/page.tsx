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
  archiveControleSCI,
  ajouterPreuveControle,
  deleteControleSCI,
  lierRisqueControle,
  realiserControleSCI,
  unarchiveControleSCI,
} from "../actions";
import {
  CATEGORIE_TACHE_LABELS,
  FREQUENCE_LABELS,
  STATUT_CONTROLE_LABELS,
  STATUT_TACHE_LABELS,
  TAXINOMIE_LABELS,
  TYPE_CONTROLE_LABELS,
  formatDate,
  urgenceEcheance,
} from "@/lib/labels";
import { TACHE_STATUTS_CLOS } from "@/lib/catalog";
import { prisma } from "@/lib/prisma";
import { parseTags } from "@/lib/tags";
import { getCurrentUser } from "@/lib/session";
import { ElementsAssocies } from "@/components/liens/ElementsAssocies";

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
  const user = await getCurrentUser();
  const uniteId = user.uniteId;

  const controle = await prisma.controleSCI.findUnique({
    where: { id },
    include: {
      responsable: true,
      creePar: true,
      modifiePar: true,
      preuves: {
        include: { document: true },
        orderBy: { creeLe: "desc" },
      },
      risques: {
        include: { risque: true },
        orderBy: { creeLe: "desc" },
      },
      taches: {
        include: { responsable: true },
        orderBy: { dateEcheance: "asc" },
      },
    },
  });
  if (!controle) notFound();

  const risquesDispo = await prisma.risque.findMany({
    where: {
      uniteId,
      archive: false,
      id: { notIn: controle.risques.map((r) => r.risqueId) },
    },
    orderBy: { nom: "asc" },
    select: { id: true, nom: true },
  });

  const clos =
    controle.statut === "REALISE" && controle.frequence === "PONCTUELLE";
  const urgence = urgenceEcheance(
    controle.dateProchaineEcheance,
    clos || controle.archive,
  );
  const tags = parseTags(controle.tags);

  return (
    <>
      <BackLink href="/controles-sci" label="← Retour aux contrôles" />
      <PageHeader
        title={`${controle.code} — ${controle.nom}`}
        description={controle.description ?? "Aucune description."}
        actions={
          <>
            {!controle.archive ? (
              <BtnLink href={`/controles-sci/${controle.id}/modifier`}>
                Modifier
              </BtnLink>
            ) : null}
            {!controle.archive && controle.statut !== "REALISE" ? (
              <ConfirmActionButton
                action={realiserControleSCI}
                id={controle.id}
                label="Marquer réalisé"
                confirmMessage="Valider la réalisation ? La prochaine échéance sera recalculée et une tâche de suivi pourra être créée."
                variant="primary"
              />
            ) : null}
            {controle.archive ? (
              <ConfirmActionButton
                action={unarchiveControleSCI}
                id={controle.id}
                label="Désarchiver"
                confirmMessage="Remettre ce contrôle dans la liste active ?"
              />
            ) : (
              <ConfirmActionButton
                action={archiveControleSCI}
                id={controle.id}
                label="Archiver"
                confirmMessage="Archiver ce contrôle ?"
              />
            )}
            <ConfirmDeleteButton
              action={deleteControleSCI}
              id={controle.id}
              confirmMessage="Supprimer définitivement ce contrôle ?"
            />
          </>
        }
      />

      <FlashBanner ok={sp.ok} erreur={sp.erreur} />
      {controle.archive ? (
        <div className="flash flash--warn">Ce contrôle est archivé.</div>
      ) : null}
      {urgence === "retard" ? (
        <div className="flash flash--error">
          Échéance dépassée : {formatDate(controle.dateProchaineEcheance)}.
        </div>
      ) : null}

      <div className="detail-grid">
        <div className="panel">
          <h2 className="panel-title">Informations</h2>
          <dl className="kv">
            <div>
              <dt>Code</dt>
              <dd>{controle.code}</dd>
            </div>
            <div>
              <dt>Processus</dt>
              <dd>{controle.processusConcerne}</dd>
            </div>
            <div>
              <dt>Responsable</dt>
              <dd>{controle.responsable.nom}</dd>
            </div>
            <div>
              <dt>Type</dt>
              <dd>{TYPE_CONTROLE_LABELS[controle.typeControle]}</dd>
            </div>
            <div>
              <dt>Fréquence</dt>
              <dd>{FREQUENCE_LABELS[controle.frequence]}</dd>
            </div>
            <div>
              <dt>Statut</dt>
              <dd>{STATUT_CONTROLE_LABELS[controle.statut]}</dd>
            </div>
            <div>
              <dt>Fenêtre de déclenchement</dt>
              <dd>{controle.fenetreDeclenchementJours} j.</dd>
            </div>
            <div>
              <dt>Délai de réalisation</dt>
              <dd>
                {controle.delaiRealisationJours != null
                  ? `${controle.delaiRealisationJours} j.`
                  : "—"}
              </dd>
            </div>
            <div>
              <dt>Taxinomie</dt>
              <dd>
                {controle.taxinomie
                  ? (TAXINOMIE_LABELS[controle.taxinomie] ??
                    controle.taxinomie)
                  : "—"}
              </dd>
            </div>
            <div>
              <dt>Tags</dt>
              <dd>
                {tags.length ? tags.map((t) => `#${t}`).join(" ") : "—"}
              </dd>
            </div>
            <div>
              <dt>Dernière réalisation</dt>
              <dd>{formatDate(controle.dateDerniereRealisation)}</dd>
            </div>
            <div>
              <dt>Prochaine échéance</dt>
              <dd>{formatDate(controle.dateProchaineEcheance)}</dd>
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

        <div className="stack-panels">
          <div className="panel">
            <h2 className="panel-title">
              Preuves ({controle.preuves.length})
            </h2>
            {!controle.archive ? (
              <form action={ajouterPreuveControle} className="inline-form">
                <input type="hidden" name="controleSCIId" value={controle.id} />
                <div className="inline-form__row">
                  <label className="field" htmlFor="preuve-nom">
                    <span className="field__label">Nom</span>
                    <input
                      id="preuve-nom"
                      name="nom"
                      placeholder="Ex. Capture d'écran"
                    />
                  </label>
                  <label className="field" htmlFor="preuve-ref">
                    <span className="field__label">Référence *</span>
                    <input
                      id="preuve-ref"
                      name="reference"
                      required
                      placeholder="URL ou chemin"
                    />
                  </label>
                  <SubmitButton>Ajouter</SubmitButton>
                </div>
              </form>
            ) : null}
            {controle.preuves.length === 0 ? (
              <p className="empty">Aucune preuve liée.</p>
            ) : (
              <ul className="entity-list">
                {controle.preuves.map((p) => (
                  <li key={p.id}>
                    <Link
                      href={`/documents/${p.document.id}`}
                      className="entity-row"
                    >
                      <div className="entity-row__main">
                        <strong>{p.document.nom}</strong>
                        <span className="entity-row__meta">
                          {p.document.reference ?? "Sans référence"}
                        </span>
                      </div>
                      <span className="entity-row__date">
                        {formatDate(p.creeLe)}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="panel">
            <h2 className="panel-title">
              Risques liés ({controle.risques.length})
            </h2>
            {!controle.archive && risquesDispo.length > 0 ? (
              <form action={lierRisqueControle} className="inline-form">
                <input type="hidden" name="controleSCIId" value={controle.id} />
                <div className="inline-form__row">
                  <label className="field" htmlFor="risqueId">
                    <span className="field__label">Risque</span>
                    <select id="risqueId" name="risqueId" required>
                      {risquesDispo.map((r) => (
                        <option key={r.id} value={r.id}>
                          {r.nom}
                        </option>
                      ))}
                    </select>
                  </label>
                  <SubmitButton>Lier</SubmitButton>
                </div>
              </form>
            ) : null}
            {controle.risques.length === 0 ? (
              <p className="empty">Aucun risque associé.</p>
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
                          Criticité {rc.risque.criticite}
                        </span>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>

      <div className="panel" style={{ marginTop: "1rem" }}>
        <div className="panel-head">
          <h2 className="panel-title">Tâches ({controle.taches.length})</h2>
          {!controle.archive ? (
            <BtnLink
              href={`/taches/nouvelle?controleSCIId=${controle.id}&categorie=SCI`}
              variant="ghost"
            >
              Ajouter une tâche
            </BtnLink>
          ) : null}
        </div>
        {controle.taches.length === 0 ? (
          <p className="empty">Aucune tâche liée.</p>
        ) : (
          <ul className="entity-list">
            {controle.taches.map((t) => {
              const tClos = (TACHE_STATUTS_CLOS as readonly string[]).includes(
                t.statut,
              );
              const tUrgence = urgenceEcheance(t.dateEcheance, tClos);
              return (
                <li key={t.id}>
                  <Link
                    href={`/taches/${t.id}`}
                    className={`entity-row entity-row--${tUrgence}`}
                  >
                    <div className="entity-row__main">
                      <strong>{t.titre}</strong>
                      <span className="entity-row__meta">
                        {t.responsable.nom} ·{" "}
                        {CATEGORIE_TACHE_LABELS[t.categorie]} ·{" "}
                        {STATUT_TACHE_LABELS[t.statut]}
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

      <ElementsAssocies
        uniteId={user.uniteId}
        type="CONTROLE_SCI"
        id={controle.id}
        retour={`/controles-sci/${controle.id}`}
      />
    </>
  );
}
