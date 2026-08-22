/** CSV Excel-compatible (UTF-8 BOM, séparateur `;` pour Excel FR). */

export const CSV_SEP = ";";
export const CSV_BOM = "\uFEFF";

/** Échappe une cellule CSV (guillemets si nécessaire). */
export function escapeCsvCell(value: string | number | null | undefined): string {
  if (value == null) return "";
  const s = String(value);
  if (/[;"\r\n]/.test(s)) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

/** Construit une ligne CSV à partir de cellules. */
export function csvRow(cells: Array<string | number | null | undefined>): string {
  return cells.map(escapeCsvCell).join(CSV_SEP);
}

/** Document CSV complet avec BOM UTF-8. */
export function buildCsv(
  headers: string[],
  rows: Array<Array<string | number | null | undefined>>,
): string {
  const lines = [csvRow(headers), ...rows.map((r) => csvRow(r))];
  return CSV_BOM + lines.join("\r\n") + "\r\n";
}

/** Réponse HTTP attachment CSV. */
export function csvAttachmentResponse(
  filename: string,
  csvBody: string,
): Response {
  const safeName = filename.replace(/[^\w.\-]+/g, "_");
  return new Response(csvBody, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${safeName}"`,
      "Cache-Control": "no-store",
    },
  });
}
