import { notFound } from "next/navigation";
import {
  ReportKpis,
  ReportSection,
  ReportShell,
} from "@/components/rapports/ReportShell";
import {
  hasSection,
  parseProcessusSections,
  PROCESSUS_SECTION_LABELS,
  type ProcessusReportSection,
} from "@/lib/exports/processus-sections";
import {
  CRITICITE_CONTINUITE_LABELS,
  FREQUENCE_REVUE_QUALITE_LABELS,
  NIVEAU_CONFIDENTIALITE_LABELS,
  ROLE_RACI_LABELS,
  STATUT_ACTIF_IT_LABELS,
  STATUT_ARBITRAGE_LABELS,
  STATUT_CONFORMITE_LABELS,
  STATUT_DOCUMENT_LABELS,
  STATUT_PROCESSUS_LABELS,
  STATUT_RISQUE_LABELS,
  TYPE_ACTIF_IT_LABELS,
  UNITE_DUREE_CONTINUITE_LABELS,
  formatDate,
} from "@/lib/labels";
import { prisma } from "@/lib/prisma";
import {
  formatUtilisateurNom,
  getCurrentUser,
} from "@/lib/session";

export const dynamic = "force-dynamic";

function dureeLabel(
  valeur: number | null | undefined,
  unite: string | null | undefined,
) {
  if (valeur == null || !unite) return "—";
  return `${valeur} ${UNITE_DUREE_CONTINUITE_LABELS[unite] ?? unite}`;
}

export default async function RapportProcessusPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ sections?: string }>;
}) {
  const { id } = await params;
  const sp = await searchParams;
  const sections = parseProcessusSections(sp.sections);
  const user = await getCurrentUser();

  const processus = await prisma.processus.findFirst({
    where: { id, uniteId: user.uniteId },
    include: {
      unite: { select: { code: true, nom: true } },
      responsable: true,
      macroprocessus: { select: { code: true, nom: true } },
      etapes: { orderBy: { ordre: "asc" } },
      raciLignes: {
        include: {
          participants: {
            include: {
              utilisateur: { select: { nom: true, prenom: true } },
              fonction: { select: { nom: true, code: true } },
            },
          },
        },
        orderBy: { ordre: "asc" },
      },
      actifsIT: {
        include: {
          actifIT: {
            select: {
              code: true,
              nom: true,
              type: true,
              statut: true,
              archive: true,
            },
          },
        },
      },
      continuite: true,
      qualite: {
        include: {
          responsableRevue: { select: { nom: true, prenom: true } },
        },
      },
      qualiteRevues: {
        orderBy: { dateRevue: "desc" },
        take: 5,
        include: {
          responsable: { select: { nom: true, prenom: true } },
        },
      },
      ecartsQualite: {
        where: { statut: "OUVERT" },
        orderBy: { creeLe: "desc" },
        take: 10,
      },
      documents: {
        include: {
          document: {
            select: {
              code: true,
              nom: true,
              statut: true,
              archive: true,
            },
          },
        },
      },
      exigences: {
        include: {
          exigence: {
            select: {
              code: true,
              titre: true,
              statut: true,
              archive: true,
            },
          },
        },
      },
      arbitrages: {
        where: { archive: false },
        orderBy: { code: "asc" },
      },
      risques: {
        where: { archive: false },
        include: {
          controles: {
            include: {
              controle: {
                select: { code: true, nom: true, statut: true },
              },
            },
          },
        },
        orderBy: [{ criticite: "desc" }, { code: "asc" }],
      },
    },
  });

  if (!processus) notFound();

  const controlesMap = new Map<
    string,
    { code: string; nom: string; statut: string }
  >();
  for (const r of processus.risques) {
    for (const link of r.controles) {
      controlesMap.set(link.controle.code, link.controle);
    }
  }
  const controles = [...controlesMap.values()].sort((a, b) =>
    a.code.localeCompare(b.code),
  );

  const actifs = processus.actifsIT
    .filter((l) => !l.actifIT.archive)
    .map((l) => l.actifIT);
  const docs = processus.documents
    .filter((l) => !l.document.archive)
    .map((l) => l.document);
  const exigences = processus.exigences
    .filter((l) => !l.exigence.archive)
    .map((l) => l.exigence);

  const sectionList = [...sections]
    .map((s) => PROCESSUS_SECTION_LABELS[s as ProcessusReportSection])
    .join(", ");

  const show = (key: ProcessusReportSection) => hasSection(sections, key);

  return (
    <ReportShell
      title={`Processus ${processus.code}`}
      subtitle={processus.nom}
      uniteLabel={`${processus.unite.code} — ${processus.unite.nom}`}
      backHref={`/processus/${processus.id}`}
      meta={`Sections : ${sectionList}`}
    >
      {show("presentation") ? (
        <ReportSection title="Présentation">
          <dl className="report-dl">
            <div>
              <dt>Statut</dt>
              <dd>
                {STATUT_PROCESSUS_LABELS[processus.statut] ?? processus.statut}
              </dd>
            </div>
            <div>
              <dt>Responsable</dt>
              <dd>{formatUtilisateurNom(processus.responsable)}</dd>
            </div>
            <div>
              <dt>Macroprocessus</dt>
              <dd>
                {processus.macroprocessus
                  ? `${processus.macroprocessus.code} — ${processus.macroprocessus.nom}`
                  : "—"}
              </dd>
            </div>
            <div>
              <dt>Criticité</dt>
              <dd>{processus.criticite ?? "—"}</dd>
            </div>
            <div>
              <dt>Confidentialité</dt>
              <dd>
                {NIVEAU_CONFIDENTIALITE_LABELS[
                  processus.niveauConfidentialite
                ] ?? processus.niveauConfidentialite}
              </dd>
            </div>
            <div>
              <dt>Données personnelles</dt>
              <dd>
                {processus.contientDonneesPersonnelles ? "Oui" : "Non"}
              </dd>
            </div>
          </dl>
          {processus.description ? (
            <p className="report-prose">{processus.description}</p>
          ) : null}
          {processus.reference ? (
            <p className="report-prose">
              <strong>Référence :</strong> {processus.reference}
            </p>
          ) : null}
        </ReportSection>
      ) : null}

      {show("etapes") ? (
        <ReportSection title="Étapes">
          {processus.etapes.length === 0 ? (
            <p className="report-empty">Aucune étape définie.</p>
          ) : (
            <ol className="report-ol">
              {processus.etapes.map((e) => (
                <li key={e.id}>
                  <strong>{e.libelle}</strong>
                </li>
              ))}
            </ol>
          )}
        </ReportSection>
      ) : null}

      {show("raci") ? (
        <ReportSection title="RACI">
          {processus.raciLignes.length === 0 ? (
            <p className="report-empty">Aucune ligne RACI.</p>
          ) : (
            <table className="report-table">
              <thead>
                <tr>
                  <th>Activité</th>
                  <th>Rôles</th>
                </tr>
              </thead>
              <tbody>
                {processus.raciLignes.map((l) => (
                  <tr key={l.id}>
                    <td>{l.activite}</td>
                    <td>
                      {l.participants.length === 0
                        ? "—"
                        : l.participants
                            .map((p) => {
                              const who =
                                p.fonction?.nom ??
                                p.libelleFonction ??
                                (p.utilisateur
                                  ? formatUtilisateurNom(p.utilisateur)
                                  : "?");
                              return `${ROLE_RACI_LABELS[p.role] ?? p.role}: ${who}`;
                            })
                            .join(" · ")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </ReportSection>
      ) : null}

      {show("risques") ? (
        <ReportSection title="Risques">
          <ReportKpis
            items={[
              { label: "liés", value: processus.risques.length },
              {
                label: "critiques (≥20)",
                value: processus.risques.filter((r) => r.criticite >= 20)
                  .length,
              },
            ]}
          />
          {processus.risques.length === 0 ? (
            <p className="report-empty">Aucun risque lié.</p>
          ) : (
            <table className="report-table">
              <thead>
                <tr>
                  <th>Code</th>
                  <th>Titre</th>
                  <th>Statut</th>
                  <th>Criticité</th>
                </tr>
              </thead>
              <tbody>
                {processus.risques.map((r) => (
                  <tr key={r.id}>
                    <td>{r.code}</td>
                    <td>{r.nom}</td>
                    <td>{STATUT_RISQUE_LABELS[r.statut] ?? r.statut}</td>
                    <td>{r.criticite}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </ReportSection>
      ) : null}

      {show("controles") ? (
        <ReportSection title="Contrôles">
          {controles.length === 0 ? (
            <p className="report-empty">
              Aucun contrôle lié via les risques du processus.
            </p>
          ) : (
            <table className="report-table">
              <thead>
                <tr>
                  <th>Code</th>
                  <th>Nom</th>
                  <th>Statut</th>
                </tr>
              </thead>
              <tbody>
                {controles.map((c) => (
                  <tr key={c.code}>
                    <td>{c.code}</td>
                    <td>{c.nom}</td>
                    <td>{c.statut}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </ReportSection>
      ) : null}

      {show("arbitrages") ? (
        <ReportSection title="Arbitrages">
          {processus.arbitrages.length === 0 ? (
            <p className="report-empty">Aucun arbitrage.</p>
          ) : (
            <table className="report-table">
              <thead>
                <tr>
                  <th>Code</th>
                  <th>Titre</th>
                  <th>Statut</th>
                  <th>Règle</th>
                </tr>
              </thead>
              <tbody>
                {processus.arbitrages.map((a) => (
                  <tr key={a.id}>
                    <td>{a.code}</td>
                    <td>{a.titre}</td>
                    <td>
                      {STATUT_ARBITRAGE_LABELS[a.statut] ?? a.statut}
                    </td>
                    <td>{a.regleRetenue}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </ReportSection>
      ) : null}

      {show("conformite") ? (
        <ReportSection title="Conformité">
          {exigences.length === 0 ? (
            <p className="report-empty">Aucune exigence liée.</p>
          ) : (
            <table className="report-table">
              <thead>
                <tr>
                  <th>Code</th>
                  <th>Titre</th>
                  <th>Statut</th>
                </tr>
              </thead>
              <tbody>
                {exigences.map((e) => (
                  <tr key={e.code}>
                    <td>{e.code}</td>
                    <td>{e.titre}</td>
                    <td>
                      {STATUT_CONFORMITE_LABELS[e.statut] ?? e.statut}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </ReportSection>
      ) : null}

      {show("qualite") ? (
        <ReportSection title="Qualité">
          {processus.qualite ? (
            <dl className="report-dl">
              <div>
                <dt>Fréquence</dt>
                <dd>
                  {FREQUENCE_REVUE_QUALITE_LABELS[processus.qualite.frequence] ??
                    processus.qualite.frequence}
                </dd>
              </div>
              <div>
                <dt>Responsable revue</dt>
                <dd>
                  {processus.qualite.responsableRevue
                    ? formatUtilisateurNom(processus.qualite.responsableRevue)
                    : "—"}
                </dd>
              </div>
              <div>
                <dt>Dernière revue</dt>
                <dd>{formatDate(processus.qualite.derniereRevue)}</dd>
              </div>
              <div>
                <dt>Prochaine revue</dt>
                <dd>{formatDate(processus.qualite.prochaineRevue)}</dd>
              </div>
            </dl>
          ) : (
            <p className="report-empty">Pas de fiche qualité.</p>
          )}
          {processus.qualiteRevues.length > 0 ? (
            <>
              <h3 className="report-h3">Dernières revues</h3>
              <table className="report-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Responsable</th>
                    <th>Commentaire</th>
                  </tr>
                </thead>
                <tbody>
                  {processus.qualiteRevues.map((r) => (
                    <tr key={r.id}>
                      <td>{formatDate(r.dateRevue)}</td>
                      <td>
                        {r.responsable
                          ? formatUtilisateurNom(r.responsable)
                          : "—"}
                      </td>
                      <td>{r.commentaire ?? "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </>
          ) : null}
          {processus.ecartsQualite.length > 0 ? (
            <>
              <h3 className="report-h3">Écarts ouverts</h3>
              <ul className="report-ul">
                {processus.ecartsQualite.map((e) => (
                  <li key={e.id}>
                    <strong>{e.titre}</strong>
                    {e.description ? ` — ${e.description}` : null}
                  </li>
                ))}
              </ul>
            </>
          ) : null}
        </ReportSection>
      ) : null}

      {show("actifs") ? (
        <ReportSection title="Actifs">
          {actifs.length === 0 ? (
            <p className="report-empty">Aucun actif lié.</p>
          ) : (
            <table className="report-table">
              <thead>
                <tr>
                  <th>Code</th>
                  <th>Nom</th>
                  <th>Type</th>
                  <th>Statut</th>
                </tr>
              </thead>
              <tbody>
                {actifs.map((a) => (
                  <tr key={a.code}>
                    <td>{a.code}</td>
                    <td>{a.nom}</td>
                    <td>{TYPE_ACTIF_IT_LABELS[a.type] ?? a.type}</td>
                    <td>{STATUT_ACTIF_IT_LABELS[a.statut] ?? a.statut}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </ReportSection>
      ) : null}

      {show("continuite") ? (
        <ReportSection title="Continuité">
          {processus.continuite ? (
            <dl className="report-dl">
              <div>
                <dt>Criticité</dt>
                <dd>
                  {processus.continuite.criticite
                    ? (CRITICITE_CONTINUITE_LABELS[
                        processus.continuite.criticite
                      ] ?? processus.continuite.criticite)
                    : "—"}
                </dd>
              </div>
              <div>
                <dt>MTPD</dt>
                <dd>
                  {dureeLabel(
                    processus.continuite.mtpdValeur,
                    processus.continuite.mtpdUnite,
                  )}
                </dd>
              </div>
              <div>
                <dt>RTO</dt>
                <dd>
                  {dureeLabel(
                    processus.continuite.rtoValeur,
                    processus.continuite.rtoUnite,
                  )}
                </dd>
              </div>
              <div>
                <dt>RPO</dt>
                <dd>
                  {dureeLabel(
                    processus.continuite.rpoValeur,
                    processus.continuite.rpoUnite,
                  )}
                </dd>
              </div>
            </dl>
          ) : (
            <p className="report-empty">Pas d’analyse de continuité.</p>
          )}
          {processus.continuite?.consequencesInterruption ? (
            <p className="report-prose">
              <strong>Conséquences :</strong>{" "}
              {processus.continuite.consequencesInterruption}
            </p>
          ) : null}
          {processus.continuite?.modeDegradeMesures ? (
            <p className="report-prose">
              <strong>Mode dégradé :</strong>{" "}
              {processus.continuite.modeDegradeMesures}
            </p>
          ) : null}
        </ReportSection>
      ) : null}

      {show("documentation") ? (
        <ReportSection title="Documentation">
          {docs.length === 0 ? (
            <p className="report-empty">Aucun document lié.</p>
          ) : (
            <table className="report-table">
              <thead>
                <tr>
                  <th>Code</th>
                  <th>Nom</th>
                  <th>Statut</th>
                </tr>
              </thead>
              <tbody>
                {docs.map((d) => (
                  <tr key={d.code}>
                    <td>{d.code}</td>
                    <td>{d.nom}</td>
                    <td>
                      {STATUT_DOCUMENT_LABELS[d.statut] ?? d.statut}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </ReportSection>
      ) : null}
    </ReportShell>
  );
}
