import { redirect } from "next/navigation";

/** Plus de hub « Vue d’ensemble » — accès direct aux fonctions utiles. */
export default function AdministrationIndexPage() {
  redirect("/administration/utilisateurs");
}
