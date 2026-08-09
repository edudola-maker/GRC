import { redirect } from "next/navigation";

/**
 * Ancien module Équipe autonome — absorbé par la fiche Unité (§ Équipe).
 * Redirection temporaire conservée pour les favoris / liens externes.
 */
export default function EquipeRedirect() {
  redirect("/unite?focus=equipe");
}
