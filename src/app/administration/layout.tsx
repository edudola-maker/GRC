import { assertCanAccessAdministration } from "@/lib/permissions";

export const dynamic = "force-dynamic";

export default async function AdministrationLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await assertCanAccessAdministration();

  return (
    <div className="admin-shell">
      <header className="admin-shell__header">
        <p className="admin-shell__eyebrow">Administration</p>
      </header>
      {children}
    </div>
  );
}
