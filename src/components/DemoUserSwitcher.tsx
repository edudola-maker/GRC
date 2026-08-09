"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { switchDemoUser } from "@/app/session/actions";
import { SubmitButton } from "@/components/FormControls";

type UserOpt = { id: string; nom: string; role: string };

export function DemoUserSwitcher({
  users,
  currentId,
}: {
  users: UserOpt[];
  currentId: string;
}) {
  const pathname = usePathname() || "/";
  const search = useSearchParams();
  const qs = search?.toString();
  const retour = qs ? `${pathname}?${qs}` : pathname;

  return (
    <form action={switchDemoUser} className="demo-switcher">
      <input type="hidden" name="retour" value={retour} />
      <label htmlFor="demo-user">
        <span>Profil démo</span>
        <select id="demo-user" name="userId" defaultValue={currentId}>
          {users.map((u) => (
            <option key={u.id} value={u.id}>
              {u.nom}
              {u.role === "ADMINISTRATEUR"
                ? " (admin)"
                : u.role === "RESPONSABLE"
                  ? " (resp.)"
                  : ""}
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
