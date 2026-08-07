import { redirect } from "next/navigation";
import { getCurrentUser, isResponsable } from "@/lib/session";

/** Vue Équipe absorbée par le Dashboard responsable. */
export default async function EquipeRedirect() {
  const user = await getCurrentUser();
  if (isResponsable(user)) redirect("/responsable");
  redirect("/");
}
