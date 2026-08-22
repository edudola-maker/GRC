import { requireExportContext } from "@/lib/exports/auth";
import { buildCsv, csvAttachmentResponse } from "@/lib/exports/csv";
import {
  CATEGORIE_RISQUE_LABELS,
  STATUT_RISQUE_LABELS,
  STRATEGIE_RISQUE_LABELS,
  formatDate,
} from "@/lib/labels";
import { prisma } from "@/lib/prisma";
import { formatUtilisateurNom } from "@/lib/session";

export const dynamic = "force-dynamic";

export async function GET() {
  const { unite } = await requireExportContext();

  const risques = await prisma.risque.findMany({
    where: { uniteId: unite.id, archive: false },
    include: {
      responsable: { select: { nom: true, prenom: true } },
      processusRef: { select: { code: true, nom: true } },
      controles: {
        include: {
          controle: { select: { code: true } },
        },
      },
    },
    orderBy: [{ criticite: "desc" }, { code: "asc" }],
  });

  const headers = [
    "code",
    "titre",
    "statut",
    "categorie",
    "strategie",
    "probabilite",
    "impact",
    "criticite",
    "probabilite_residuelle",
    "impact_residuel",
    "criticite_residuelle",
    "responsable",
    "processus_code",
    "processus_nom",
    "controles",
    "description",
    "modifie_le",
  ];

  const rows = risques.map((r) => [
    r.code,
    r.nom,
    STATUT_RISQUE_LABELS[r.statut] ?? r.statut,
    CATEGORIE_RISQUE_LABELS[r.categorie] ?? r.categorie,
    r.strategie
      ? (STRATEGIE_RISQUE_LABELS[r.strategie] ?? r.strategie)
      : "",
    r.probabilite,
    r.impact,
    r.criticite,
    r.probabiliteResiduelle ?? "",
    r.impactResiduel ?? "",
    r.criticiteResiduelle ?? "",
    formatUtilisateurNom(r.responsable),
    r.processusRef?.code ?? "",
    r.processusRef?.nom ?? "",
    r.controles.map((c) => c.controle.code).join(", "),
    r.description ?? "",
    formatDate(r.modifieLe),
  ]);

  const csv = buildCsv(headers, rows);
  const stamp = new Date().toISOString().slice(0, 10);
  return csvAttachmentResponse(
    `risques_${unite.code}_${stamp}.csv`,
    csv,
  );
}
