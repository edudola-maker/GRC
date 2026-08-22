import Link from "next/link";
import { notFound } from "next/navigation";
import { FlashBanner } from "@/components/Flash";
import { ElementsAssocies } from "@/components/liens/ElementsAssocies";
import { ModuleHelp } from "@/components/ModuleHelp";
import {
  EditableSection,
  SectionSaveActions,
} from "@/components/module/EditableSection";
import { CollapsibleSection } from "@/components/module/CollapsibleSection";
import { PilotageStrip } from "@/components/module/PilotageStrip";
import { PageHeader, BtnLink } from "@/components/ui";
import { UniteAttributionsPanel } from "@/components/unite/UniteAttributionsPanel";
import { updateUnite } from "./actions";
import { MODULE_HELP } from "@/lib/catalog";
import {
  PRIORITE_LABELS,
  ROLE_UTILISATEUR_LABELS,
  STATUT_OBJECTIF_LABELS,
  formatDate,
} from "@/lib/labels";
import { isAdministrateur } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { listSectionRedactions } from "@/lib/section-redaction";
import { formatUtilisateurNom, getCurrentUser } from "@/lib/session";
import { getUnitePilotage } from "@/lib/unite-overview";

export const dynamic = "force-dynamic";

const EDIT_SECTIONS = [
  "PRESENTATION",
  "ATTRIBUTIONS",
  "OBJECTIFS",
  "ELEMENTS_ASSOCIES",
] as const;

type EditSection = (typeof EDIT_SECTIONS)[number];

function parseEdit(raw: string | undefined): EditSection | null {
  if (!raw) return null;
  return (EDIT_SECTIONS as readonly string[]).includes(raw)
    ? (raw as EditSection)
    : null;
}

export default async function UnitePage({
  searchParams,
}: {
  searchParams: Promise<{
    ok?: string;
    erreur?: string;
    edit?: string;
    focus?: string;
  }>;
}) {
  const sp = await searchParams;
  const edit = parseEdit(sp.edit);
  const user = await getCurrentUser();
  const uniteId = user.uniteId;
  const isAdmin = isAdministrateur(user);

  const [
    unite,
    redactions,
    pilotage,
    attributions,
    objectifs,
    membres,
    macros,
  ] = await Promise.all([
    prisma.unite.findUnique({
      where: { id: uniteId },
      include: {
        responsable: true,
        adjoint: true,
      },
    }),
    listSectionRedactions("UNITE", uniteId),
    getUnitePilotage(uniteId),
    prisma.uniteAttribution.findMany({
      where: { uniteId },
      orderBy: [{ ordre: "asc" }, { titre: "asc" }],
    }),
    prisma.objectif.findMany({
      where: { uniteId },
      include: { responsable: true },
      orderBy: [{ annee: "desc" }, { intitule: "asc" }],
    }),
    prisma.utilisateur.findMany({
      where: { uniteId },
      orderBy: [{ actif: "desc" }, { nom: "asc" }, { prenom: "asc" }],
      select: {
        id: true,
        nom: true,
        prenom: true,
        role: true,
        initiales: true,
        fonction: true,
        email: true,
        actif: true,
      },
    }),
    prisma.macroprocessus.findMany({
      where: { uniteId, archive: false },
      include: {
        processus: {
          where: { archive: false },
          select: { id: true, code: true, nom: true },
          orderBy: { nom: "asc" },
        },
      },
      orderBy: [{ ordre: "asc" }, { nom: "asc" }],
    }),
  ]);

  if (!unite) notFound();

  const baseHref = "/unite";
  const canEdit = unite.actif;
  const attributionsActives = attributions.filter((a) => a.actif);
  const nbProcessus = macros.reduce((n, m) => n + m.processus.length, 0);

  return (
    <>
      <PageHeader
        title={`${unite.code} — ${unite.nom}`}
        help={<ModuleHelp {...MODULE_HELP.unite} />}
        actions={
          <>
            <BtnLink href="/objectifs/nouveau">+ Objectif</BtnLink>
            {isAdmin ? (
              <BtnLink href="/administration/unites" variant="ghost">
                Administration
              </BtnLink>
            ) : null}
          </>
        }
      />
      <FlashBanner ok={sp.ok} erreur={sp.erreur} />
      {!unite.actif ? (
        <div className="flash flash--warn">Cette unité est inactive.</div>
      ) : null}

      <div className="unite-structural-box unite-structural-box--compact">
        <p className="unite-structural-box__label">
          Structure
          {isAdmin ? (
            <>
              {" "}
              —{" "}
              <Link href="/administration/unites">Administration</Link>
            </>
          ) : null}
        </p>
        <dl className="kv unite-structural-box__kv">
          <div>
            <dt>Responsable</dt>
            <dd>
              {unite.responsable
                ? formatUtilisateurNom(unite.responsable)
                : "—"}
            </dd>
          </div>
          <div>
            <dt>Adjoint</dt>
            <dd>
              {unite.adjoint ? formatUtilisateurNom(unite.adjoint) : "—"}
            </dd>
          </div>
        </dl>
      </div>

      <PilotageStrip
        items={[
          {
            value: pilotage.objectifsEnCours,
            label: "objectifs",
            tone: "ok",
          },
          { value: pilotage.projetsActifs, label: "projets" },
          { value: pilotage.missionsEnCours, label: "missions" },
          { value: pilotage.processusActifs, label: "processus" },
          {
            value: pilotage.tachesEnRetard,
            label: "à traiter",
            tone: pilotage.tachesEnRetard > 0 ? "danger" : "default",
            href:
              pilotage.tachesEnRetard > 0 ? "/?vue=retard" : undefined,
          },
        ]}
      />

      <EditableSection
        title="Présentation de l’unité"
        sectionKey="PRESENTATION"
        baseHref={baseHref}
        edit={edit}
        canEdit={canEdit}
        redaction={redactions.get("PRESENTATION")}
        defaultOpen
        editChildren={
          <form action={updateUnite} className="entity-form">
            <input type="hidden" name="id" value={unite.id} />
            <input type="hidden" name="sectionKey" value="PRESENTATION" />
            <label className="field" htmlFor="presentation">
              <span className="field__label">Présentation</span>
              <textarea
                id="presentation"
                name="presentation"
                rows={8}
                defaultValue={unite.presentation ?? ""}
              />
            </label>
            <SectionSaveActions
              baseHref={baseHref}
              sectionKey="PRESENTATION"
            />
          </form>
        }
      >
        {unite.presentation?.trim() ? (
          <p className="unite-presentation" style={{ whiteSpace: "pre-wrap" }}>
            {unite.presentation}
          </p>
        ) : (
          <p className="empty">Aucune présentation renseignée.</p>
        )}
      </EditableSection>

      <EditableSection
        title="Missions permanentes"
        sectionKey="ATTRIBUTIONS"
        baseHref={baseHref}
        edit={edit}
        canEdit={canEdit}
        redaction={redactions.get("ATTRIBUTIONS")}
        defaultOpen
        badge={`${attributionsActives.length}`}
        editChildren={
          <>
            <p className="muted" style={{ marginTop: 0 }}>
              Missions institutionnelles permanentes de l’unité — distinctes
              des missions d’assurance (audits / revues).
            </p>
            <UniteAttributionsPanel attributions={attributions} editable />
            <form action={updateUnite} className="entity-form">
              <input type="hidden" name="id" value={unite.id} />
              <input type="hidden" name="sectionKey" value="ATTRIBUTIONS" />
              <SectionSaveActions
                baseHref={baseHref}
                sectionKey="ATTRIBUTIONS"
              />
            </form>
          </>
        }
      >
        <UniteAttributionsPanel
          attributions={attributions}
          editable={false}
        />
      </EditableSection>

      <CollapsibleSection
        title="Cartographie des activités"
        defaultOpen
        badge={`${macros.length} / ${nbProcessus}`}
      >
        <div className="form-actions" style={{ marginBottom: "0.65rem" }}>
          <BtnLink href="/processus?vue=arborescence" variant="ghost">
            Voir l’arborescence
          </BtnLink>
        </div>
        {macros.length === 0 ? (
          <p className="empty">
            Aucun macroprocessus.{" "}
            <Link href="/macroprocessus/nouveau">Créer le premier</Link>.
          </p>
        ) : (
          <ul className="unite-cartographie">
            {macros.map((m) => (
              <li key={m.id} className="unite-cartographie__macro">
                <Link href={`/macroprocessus/${m.id}`}>
                  <strong>
                    {m.code} — {m.nom}
                  </strong>
                </Link>
                {m.processus.length === 0 ? (
                  <p className="muted" style={{ margin: "0.25rem 0 0" }}>
                    Aucun processus rattaché.
                  </p>
                ) : (
                  <ul className="unite-cartographie__processus">
                    {m.processus.map((p) => (
                      <li key={p.id}>
                        <Link href={`/processus/${p.id}`}>
                          {p.code} — {p.nom}
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            ))}
          </ul>
        )}
      </CollapsibleSection>

      <EditableSection
        title="Objectifs annuels"
        sectionKey="OBJECTIFS"
        baseHref={baseHref}
        edit={edit}
        canEdit={canEdit}
        redaction={redactions.get("OBJECTIFS")}
        defaultOpen
        badge={`${objectifs.filter((o) => o.statut === "EN_COURS").length}`}
        editChildren={
          <>
            <div className="form-actions" style={{ marginBottom: "0.75rem" }}>
              <BtnLink href="/objectifs/nouveau">+ Nouvel objectif</BtnLink>
            </div>
            <ObjectifsList objectifs={objectifs} />
            <form action={updateUnite} className="entity-form">
              <input type="hidden" name="id" value={unite.id} />
              <input type="hidden" name="sectionKey" value="OBJECTIFS" />
              <SectionSaveActions baseHref={baseHref} sectionKey="OBJECTIFS" />
            </form>
          </>
        }
      >
        <div id="objectifs">
          <ObjectifsList objectifs={objectifs} />
        </div>
      </EditableSection>

      <div id="equipe">
        <CollapsibleSection
          title="Collaborateurs"
          defaultOpen
          badge={`${membres.filter((m) => m.actif).length}/${membres.length}`}
        >
          <p className="muted" style={{ marginTop: 0 }}>
            Utilisateurs rattachés à cette unité (référentiel Administration).
          </p>
          {membres.length === 0 ? (
            <p className="empty">Aucun collaborateur rattaché à l’unité.</p>
          ) : (
            <ul className="unite-equipe__list">
              {membres.map((m) => {
                let roleLabel =
                  ROLE_UTILISATEUR_LABELS[m.role] ?? "Collaborateur";
                if (m.id === unite.responsableId) {
                  roleLabel = "Responsable d’unité";
                } else if (m.id === unite.adjointId) {
                  roleLabel = "Adjoint";
                }
                return (
                  <li
                    key={m.id}
                    className={`unite-equipe__row${m.actif ? "" : " is-inactive"}`}
                  >
                    <span className="unite-equipe__id">
                      <span className="initiales-badge" aria-hidden>
                        {m.initiales?.trim() || "—"}
                      </span>
                      <span>
                        <strong>{formatUtilisateurNom(m)}</strong>
                        {m.fonction ? (
                          <span className="muted"> · {m.fonction}</span>
                        ) : null}
                      </span>
                    </span>
                    <span className="unite-equipe__meta muted">
                      {roleLabel}
                      {" · "}
                      {m.actif ? "Actif" : "Inactif"}
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
        </CollapsibleSection>
      </div>

      <EditableSection
        title="Éléments associés"
        sectionKey="ELEMENTS_ASSOCIES"
        baseHref={baseHref}
        edit={edit}
        canEdit={canEdit}
        redaction={redactions.get("ELEMENTS_ASSOCIES")}
        defaultOpen={false}
        editChildren={
          <>
            <ElementsAssocies
              uniteId={uniteId}
              type="UNITE"
              id={unite.id}
              retour={`${baseHref}?edit=ELEMENTS_ASSOCIES`}
              editable
              wrapInSection={false}
            />
            <form action={updateUnite} className="entity-form">
              <input type="hidden" name="id" value={unite.id} />
              <input
                type="hidden"
                name="sectionKey"
                value="ELEMENTS_ASSOCIES"
              />
              <SectionSaveActions
                baseHref={baseHref}
                sectionKey="ELEMENTS_ASSOCIES"
              />
            </form>
          </>
        }
      >
        <ElementsAssocies
          uniteId={uniteId}
          type="UNITE"
          id={unite.id}
          retour={baseHref}
          editable={false}
          wrapInSection={false}
        />
      </EditableSection>
    </>
  );
}

function ObjectifsList({
  objectifs,
}: {
  objectifs: Array<{
    id: string;
    code: string;
    intitule: string;
    annee: number;
    statut: string;
    priorite: string;
    dateEcheance: Date | null;
    cible?: string | null;
    progression?: number | null;
    responsable: { nom: string; prenom?: string | null };
  }>;
}) {
  if (objectifs.length === 0) {
    return (
      <p className="empty">
        Aucun objectif.{" "}
        <Link href="/objectifs/nouveau">Créer le premier</Link>.
      </p>
    );
  }

  return (
    <ul className="unite-objectifs__list">
      {objectifs.map((o) => (
        <li key={o.id} className="unite-objectifs__row">
          <div>
            <Link href={`/objectifs/${o.id}`}>
              <strong>
                {o.code} — {o.intitule}
              </strong>
            </Link>
            <span className="muted">
              {" "}
              · {o.annee} · {STATUT_OBJECTIF_LABELS[o.statut] ?? o.statut} ·{" "}
              {PRIORITE_LABELS[o.priorite] ?? o.priorite} ·{" "}
              {formatUtilisateurNom(o.responsable)}
              {o.dateEcheance ? ` · éch. ${formatDate(o.dateEcheance)}` : ""}
              {o.cible?.trim() ? ` · cible : ${o.cible}` : ""}
              {typeof o.progression === "number"
                ? ` · ${o.progression} %`
                : ""}
            </span>
          </div>
        </li>
      ))}
    </ul>
  );
}
