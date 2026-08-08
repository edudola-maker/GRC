import { notFound } from "next/navigation";
import {
  ConfirmActionButton,
  ConfirmDeleteButton,
  SubmitButton,
} from "@/components/FormControls";
import { FlashBanner, BackLink } from "@/components/Flash";
import {
  EditableSection,
  SectionSaveActions,
} from "@/components/module/EditableSection";
import { ModeleTacheEtapesPanel } from "@/components/modeles-taches/ModeleTacheEtapesPanel";
import { ModeleTacheForm } from "@/components/modeles-taches/ModeleTacheForm";
import { ModeleTacheProcessusPanel } from "@/components/modeles-taches/ModeleTacheProcessusPanel";
import { PageHeader } from "@/components/ui";
import {
  activerModeleTache,
  createTacheDepuisModele,
  deleteModeleTache,
  desactiverModeleTache,
  updateModeleTache,
} from "../actions";
import { CATEGORIE_TACHE_LABELS, formatDate } from "@/lib/labels";
import { prisma } from "@/lib/prisma";
import { listSectionRedactions } from "@/lib/section-redaction";
import {
  getCurrentUser,
  listUtilisateursActifsForCurrentUnite,
} from "@/lib/session";

export const dynamic = "force-dynamic";

const EDIT_SECTIONS = [
  "INFOS_GENERALES",
  "CHECKLIST",
  "PROCESSUS_ASSOCIES",
  "PARAMETRES",
] as const;

type EditSection = (typeof EDIT_SECTIONS)[number];

function parseEdit(raw: string | undefined): EditSection | null {
  if (!raw) return null;
  return (EDIT_SECTIONS as readonly string[]).includes(raw)
    ? (raw as EditSection)
    : null;
}

export default async function ModeleTacheDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ ok?: string; erreur?: string; edit?: string }>;
}) {
  const { id } = await params;
  const sp = await searchParams;
  const edit = parseEdit(sp.edit);
  const user = await getCurrentUser();

  const [modele, users, processusCandidats, redactions] = await Promise.all([
    prisma.modeleTache.findUnique({
      where: { id },
      include: {
        creePar: true,
        responsableDefaut: true,
        unite: true,
        etapes: { orderBy: { ordre: "asc" } },
        processus: {
          include: {
            processus: { select: { id: true, code: true, nom: true } },
          },
          orderBy: { lieLe: "asc" },
        },
      },
    }),
    listUtilisateursActifsForCurrentUnite(),
    prisma.processus.findMany({
      where: { uniteId: user.uniteId, archive: false },
      select: { id: true, code: true, nom: true },
      orderBy: { nom: "asc" },
    }),
    listSectionRedactions("MODELE_TACHE", id),
  ]);
  if (!modele) notFound();

  const canEdit = true;
  const baseHref = `/modeles-taches/${modele.id}`;

  return (
    <>
      <BackLink href="/modeles-taches" label="← Retour aux modèles" />
      <PageHeader
        title={`${modele.code} — ${modele.nom}`}
        description={
          modele.description ??
          "Modèle de tâche — checklist standard, sans sync rétroactive."
        }
        actions={
          <>
            {modele.actif ? (
              <>
                <form action={createTacheDepuisModele}>
                  <input type="hidden" name="modeleTacheId" value={modele.id} />
                  <SubmitButton>Créer une tâche</SubmitButton>
                </form>
                <ConfirmActionButton
                  action={desactiverModeleTache}
                  id={modele.id}
                  label="Désactiver"
                  confirmMessage="Désactiver ce modèle ?"
                />
              </>
            ) : (
              <ConfirmActionButton
                action={activerModeleTache}
                id={modele.id}
                label="Réactiver"
                confirmMessage="Réactiver ce modèle ?"
              />
            )}
            <ConfirmDeleteButton
              action={deleteModeleTache}
              id={modele.id}
              confirmMessage="Supprimer définitivement ce modèle ?"
            />
          </>
        }
      />
      <FlashBanner ok={sp.ok} erreur={sp.erreur} />
      {!modele.actif ? (
        <div className="flash flash--warn">Ce modèle est inactif.</div>
      ) : null}

      <EditableSection
        title="Informations générales"
        sectionKey="INFOS_GENERALES"
        baseHref={baseHref}
        edit={edit}
        canEdit={canEdit}
        redaction={redactions.get("INFOS_GENERALES")}
        defaultOpen
        editChildren={
          <ModeleTacheForm
            action={updateModeleTache}
            users={users}
            values={modele}
            cancelHref={baseHref}
            submitLabel="Finaliser"
            section="INFOS_GENERALES"
            draftActions
          />
        }
      >
        <dl className="kv">
          <div>
            <dt>Code</dt>
            <dd>{modele.code}</dd>
          </div>
          <div>
            <dt>Unité</dt>
            <dd>{modele.unite.nom}</dd>
          </div>
          <div>
            <dt>Description</dt>
            <dd>{modele.description ?? "—"}</dd>
          </div>
          <div>
            <dt>État</dt>
            <dd>{modele.actif ? "Actif" : "Inactif"}</dd>
          </div>
        </dl>
        <p className="detail-trace">
          Créé par {modele.creePar.nom} · {formatDate(modele.modifieLe)}
        </p>
      </EditableSection>

      <EditableSection
        title="Checklist standard"
        sectionKey="CHECKLIST"
        baseHref={baseHref}
        edit={edit}
        canEdit={canEdit}
        redaction={redactions.get("CHECKLIST")}
        defaultOpen
        badge={`${modele.etapes.length}`}
        editChildren={
          <>
            <ModeleTacheEtapesPanel
              modeleTacheId={modele.id}
              etapes={modele.etapes}
              editable
            />
            <form action={updateModeleTache} className="entity-form">
              <input type="hidden" name="id" value={modele.id} />
              <input type="hidden" name="sectionKey" value="CHECKLIST" />
              <SectionSaveActions cancelHref={baseHref} />
            </form>
          </>
        }
      >
        <ModeleTacheEtapesPanel
          modeleTacheId={modele.id}
          etapes={modele.etapes}
          editable={false}
        />
      </EditableSection>

      <EditableSection
        title="Processus associés"
        sectionKey="PROCESSUS_ASSOCIES"
        baseHref={baseHref}
        edit={edit}
        canEdit={canEdit}
        redaction={redactions.get("PROCESSUS_ASSOCIES")}
        defaultOpen
        badge={`${modele.processus.length}`}
        editChildren={
          <>
            <ModeleTacheProcessusPanel
              modeleTacheId={modele.id}
              links={modele.processus}
              candidats={processusCandidats}
              editable
            />
            <form action={updateModeleTache} className="entity-form">
              <input type="hidden" name="id" value={modele.id} />
              <input
                type="hidden"
                name="sectionKey"
                value="PROCESSUS_ASSOCIES"
              />
              <SectionSaveActions cancelHref={baseHref} />
            </form>
          </>
        }
      >
        <ModeleTacheProcessusPanel
          modeleTacheId={modele.id}
          links={modele.processus}
          candidats={processusCandidats}
          editable={false}
        />
      </EditableSection>

      <EditableSection
        title="Paramètres"
        sectionKey="PARAMETRES"
        baseHref={baseHref}
        edit={edit}
        canEdit={canEdit}
        redaction={redactions.get("PARAMETRES")}
        defaultOpen={false}
        editChildren={
          <ModeleTacheForm
            action={updateModeleTache}
            users={users}
            values={modele}
            cancelHref={baseHref}
            submitLabel="Finaliser"
            section="PARAMETRES"
            draftActions
          />
        }
      >
        <dl className="kv">
          <div>
            <dt>Délai standard</dt>
            <dd>
              {modele.delaiJours != null ? `${modele.delaiJours} jours` : "—"}
            </dd>
          </div>
          <div>
            <dt>Responsable par défaut</dt>
            <dd>{modele.responsableDefaut?.nom ?? "—"}</dd>
          </div>
          <div>
            <dt>Catégorie par défaut</dt>
            <dd>
              {modele.categorieDefaut
                ? (CATEGORIE_TACHE_LABELS[modele.categorieDefaut] ??
                  modele.categorieDefaut)
                : "—"}
            </dd>
          </div>
        </dl>
      </EditableSection>
    </>
  );
}
