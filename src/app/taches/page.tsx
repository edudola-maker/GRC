import { redirect } from "next/navigation";

/** Liste Tâches retirée de la navigation → Dashboard collaborateur. */
export default function TachesListRedirect() {
  redirect("/");
}
