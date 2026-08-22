import { requireExportContext } from "@/lib/exports/auth";
import { buildCsv, csvAttachmentResponse } from "@/lib/exports/csv";
import { STATUT_ARBITRAGE_LABELS, formatDate } from "@/lib/labels";
import { prisma } from "@/lib/prisma";
import { formatUtilisateurNom } from "@/lib/session";

export const dynamic = "force-dynamic";

export async function GET() {
  const { unite } = await requireExportContext();

  const arbitrages = await prisma.arbitrage.findMany({
    where: { uniteId: unite.id, archive: false },
    include: {
      responsable: { select: { nom: true, prenom: true } },
      processus: { select: { code: true, nom: true } },
      risque: { select: { code: true, nom: true } },
      decision: { select: { code: true, titre: true } },
    },
    orderBy: { code: "asc" },
  });

  const headers = [
    "code",
    "titre",
    "statut",
    "problematique",
    "regle_retenue",
    "justification",
    "processus_code",
    "processus_nom",
    "risque_code",
    "risque_nom",
    "decision_code",
    "decision_titre",
    "responsable",
    "date_effet",
    "modifie_le",
  ];

  const rows = arbitrages.map((a) => [
    a.code,
    a.titre,
    STATUT_ARBITRAGE_LABELS[a.statut] ?? a.statut,
    a.problematique ?? "",
    a.regleRetenue,
    a.justification ?? "",
    a.processus?.code ?? "",
    a.processus?.nom ?? "",
    a.risque?.code ?? "",
    a.risque?.nom ?? "",
    a.decision?.code ?? "",
    a.decision?.titre ?? "",
    a.responsable ? formatUtilisateurNom(a.responsable) : "",
    a.dateEffet ? formatDate(a.dateEffet) : "",
    formatDate(a.modifieLe),
  ]);

  const csv = buildCsv(headers, rows);
  const stamp = new Date().toISOString().slice(0, 10);
  return csvAttachmentResponse(
    `arbitrages_${unite.code}_${stamp}.csv`,
    csv,
  );
}
