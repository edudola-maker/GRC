import { MacroprocessusForm } from "@/components/macroprocessus/MacroprocessusForm";
import { FlashBanner, BackLink } from "@/components/Flash";
import { ModuleHelp } from "@/components/ModuleHelp";
import { PageHeader } from "@/components/ui";
import { MODULE_HELP } from "@/lib/catalog";
import { peekNextCode } from "@/lib/codes";
import { prisma } from "@/lib/prisma";
import {
  formatUtilisateurNom,
  getCurrentUser,
  listUtilisateursActifsForCurrentUnite,
} from "@/lib/session";
import { createMacroprocessus } from "../actions";

export const dynamic = "force-dynamic";

export default async function NouveauMacroprocessusPage({
  searchParams,
}: {
  searchParams: Promise<{ erreur?: string }>;
}) {
  const sp = await searchParams;
  const user = await getCurrentUser();
  const [usersRaw, unites, suggestedCode] = await Promise.all([
    listUtilisateursActifsForCurrentUnite(),
    prisma.unite.findMany({
      where: { actif: true },
      select: { id: true, nom: true, code: true },
      orderBy: { nom: "asc" },
    }),
    peekNextCode("MACROPROCESSUS", user.uniteId),
  ]);
  const users = usersRaw.map((u) => ({
    id: u.id,
    nom: formatUtilisateurNom(u),
  }));

  return (
    <>
      <BackLink href="/macroprocessus" label="← Retour aux macroprocessus" />
      <PageHeader
        title="Nouveau macroprocessus"
        help={<ModuleHelp {...MODULE_HELP.macroprocessus} />}
      />
      <FlashBanner erreur={sp.erreur} />
      <div className="entity-form-wrap">
        <MacroprocessusForm
          suggestedCode={suggestedCode}
          action={createMacroprocessus}
          users={users}
          unites={unites}
          defaultUniteId={user.uniteId}
          cancelHref="/macroprocessus"
          submitLabel="Créer le macroprocessus"
        />
      </div>
    </>
  );
}
