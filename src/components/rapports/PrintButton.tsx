"use client";

export function PrintButton({
  label = "Imprimer / PDF",
}: {
  label?: string;
}) {
  return (
    <button
      type="button"
      className="btn btn--primary report-toolbar__print"
      onClick={() => window.print()}
    >
      {label}
    </button>
  );
}
