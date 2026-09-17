import { redirect } from "next/navigation";

/** Ancien libellé — redirige vers le Centre d’accompagnement (Guide). */
export default function DecouvrirRedirect() {
  redirect("/guide");
}
