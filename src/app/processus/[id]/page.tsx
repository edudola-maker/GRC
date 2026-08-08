import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ConfirmActionButton,
  ConfirmDeleteButton,
} from "@/components/FormControls";
import { FlashBanner, BackLink } from "@/components/Flash";
import { ElementsAssocies } from "@/components/liens/ElementsAssocies";
import { CollapsibleSection } from "@/components/module/CollapsibleSection";
import { PageHeader, BtnLink } from "@/components/ui";
import {
  archiveProcessus,
  deleteProcessus,
  unarchiveProcessus,
} from "../actions";
import {
  NIVEAU_CONFIDENTIALITE_LABELS,
  STATUT_PROCESSUS_LABELS,
  formatDate,
} from "@/lib/labels";
import { listLiensFor } from "@/lib/liens";
import { prisma } from "@/lib/prisma";
import { parseTags } from "@/lib/tags";
import { getCurrentUser } from "@/lib/session";

export const dynamic = "force-dynamic";

export default async function ProcessusDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ ok?: string; erreur?: string }>;
}) {
  const { id } = await params;
  const sp = await searchParams;
  const user = await getCurrentUser();

  const processus = await prisma.processus.findUnique({
    where: { id },
    include: {
      responsable: true,
      creePar: true,
      modifiePar: true,
      parent: true,
      enfants: { where: { archive: false }, orderBy: { nom: "asc" } },
    },
  });
  if (!processus) notFound();

  const tags = parseTags(processus.tags);
  const liens = await listLiensFor(user.uniteId, "PROCESSUS", processus.id);
  const risques = liens.filter((l) => l.autre.type === "RISQUE");
  const controles = liens.filter((l) => l.autre.type === "CONTROLE_SCI");
  const confluenceUrl =
    processus.reference && /^https?:\/\//i.test(processus.reference)
      ? processus.reference
      : null;

  return (
    <>
      <BackLink href="/processus" label="← Retour aux processus" />
      <PageHeader
        title={`${processus.code} — ${processus.nom}`}
        description={processus.description ?? "Aucune description."}
        actions={
          <>
            {!processus.archive ? (
              <BtnLink href={`/processus/${processus.id}/modifier`}>
                Modifier
              </BtnLink>
            ) : null}
            {processus.archive ? (
              <ConfirmActionButton
                action={unarchiveProcessus}
                id={processus.id}
                label="Désarchiver"
                confirmMessage="Remettre ce processus dans la liste active ?"
              />
            ) : (
              <ConfirmActionButton
                action={archiveProcessus}
                id={processus.id}
                label="Archiver"
                confirmMessage="Archiver ce processus ?"
              />
            )}
            <ConfirmDeleteButton
              action={deleteProcessus}
              id={processus.id}
              confirmMessage="Supprimer définitivement ce processus ?"
            />
          </>
        }
      />
      <FlashBanner ok={sp.ok} erreur={sp.erreur} />
      {processus.archive ? (
        <div className="flash flash--warn">Ce processus est archivé.</div>
      ) : null}

      <CollapsibleSection title="Informations" defaultOpen>
        <dl className="kv">
          <div>
            <dt>Code</dt>
            <dd>{processus.code}</dd>
          </div>
          <div>
            <dt>Responsable</dt>
            <dd>{processus.responsable.nom}</dd>
          </div>
          <div>
            <dt>Statut</dt>
            <dd>{STATUT_PROCESSUS_LABELS[processus.statut]}</dd>
          </div>
          <div>
            <dt>Criticité</dt>
            <dd>{processus.criticite ?? "—"}</dd>
          </div>
          <div>
            <dt>Processus parent</dt>
            <dd>
              {processus.parent ? (
                <Link href={`/processus/${processus.parent.id}`}>
                  {processus.parent.code} — {processus.parent.nom}
                </Link>
              ) : (
                "—"
              )}
            </dd>
          </div>
          <div>
            <dt>Documentation Confluence</dt>
            <dd>
              {confluenceUrl ? (
                <a href={confluenceUrl} target="_blank" rel="noreferrer">
                  {processus.reference}
                </a>
              ) : (
                (processus.reference ?? "—")
              )}
            </dd>
          </div>
          <div>
            <dt>Données personnelles</dt>
            <dd>
              {processus.contientDonneesPersonnelles ? "Oui" : "Non"}
            </dd>
          </div>
          <div>
            <dt>Niveau de confidentialité</dt>
            <dd>
              {NIVEAU_CONFIDENTIALITE_LABELS[processus.niveauConfidentialite] ??
                processus.niveauConfidentialite}
            </dd>
          </div>
        </dl>
        <p className="detail-trace">
          Créé par {processus.creePar.nom} · Modifié par{" "}
          {processus.modifiePar.nom} · {formatDate(processus.modifieLe)}
        </p>
      </CollapsibleSection>

      <CollapsibleSection
        title="Risques associés"
        defaultOpen
        badge={`${risques.length}`}
      >
        <p className="muted" style={{ marginTop: 0 }}>
          Via Éléments associés — consultation. Modifier la fiche pour lier.
        </p>
        {risques.length === 0 ? (
          <p className="empty">Aucun risque lié.</p>
        ) : (
          <ul className="entity-list entity-list--compact">
            {risques.map((l) => (
              <li key={l.lienId}>
                <Link href={l.autre.href} className="entity-row">
                  <div className="entity-row__main">
                    <strong>
                      {l.autre.code} — {l.autre.titre}
                    </strong>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </CollapsibleSection>

      <CollapsibleSection
        title="Contrôles SCI associés"
        defaultOpen
        badge={`${controles.length}`}
      >
        {controles.length === 0 ? (
          <p className="empty">Aucun contrôle lié.</p>
        ) : (
          <ul className="entity-list entity-list--compact">
            {controles.map((l) => (
              <li key={l.lienId}>
                <Link href={l.autre.href} className="entity-row">
                  <div className="entity-row__main">
                    <strong>
                      {l.autre.code} — {l.autre.titre}
                    </strong>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </CollapsibleSection>

      {processus.enfants.length > 0 ? (
        <CollapsibleSection
          title="Sous-processus"
          defaultOpen={false}
          badge={`${processus.enfants.length}`}
        >
          <ul className="entity-list entity-list--compact">
            {processus.enfants.map((e) => (
              <li key={e.id}>
                <Link href={`/processus/${e.id}`} className="entity-row">
                  <div className="entity-row__main">
                    <strong>
                      {e.code} — {e.nom}
                    </strong>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </CollapsibleSection>
      ) : null}

      <ElementsAssocies
        uniteId={user.uniteId}
        type="PROCESSUS"
        id={processus.id}
        retour={`/processus/${processus.id}`}
        editable={false}
      />

      <CollapsibleSection title="Tags" defaultOpen={false}>
        <p style={{ margin: 0 }}>
          {tags.length ? tags.map((t) => `#${t}`).join(" ") : "Aucun tag."}
        </p>
      </CollapsibleSection>
    </>
  );
}
