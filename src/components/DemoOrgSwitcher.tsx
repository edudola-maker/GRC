"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { switchDemoOrganisation } from "@/app/session/actions";
import { SubmitButton } from "@/components/FormControls";

type OrgOpt = {
  id: string;
  nom: string;
  nomCourt: string | null;
  code: string;
};

/**
 * Sélecteur Organisation (tenant) — masqué si une seule Organisation.
 * Discret : ne donne pas l’impression d’un SaaS complexe.
 */
export function DemoOrgSwitcher({
  organisations,
  currentId,
}: {
  organisations: OrgOpt[];
  currentId: string;
}) {
  const pathname = usePathname() || "/";
  const search = useSearchParams();
  const qs = search?.toString();
  const retour = qs ? `${pathname}?${qs}` : pathname;

  if (organisations.length <= 1) return null;

  return (
    <form action={switchDemoOrganisation} className="demo-switcher demo-switcher--org">
      <input type="hidden" name="retour" value={retour} />
      <label htmlFor="demo-org">
        <span>Organisation</span>
        <select id="demo-org" name="organisationId" defaultValue={currentId}>
          {organisations.map((o) => (
            <option key={o.id} value={o.id}>
              {o.nomCourt || o.nom}
            </option>
          ))}
        </select>
      </label>
      <SubmitButton variant="ghost" pendingLabel="…">
        OK
      </SubmitButton>
    </form>
  );
}
