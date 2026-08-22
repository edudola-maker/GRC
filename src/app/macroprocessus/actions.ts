"use server";

import { redirectWithError, redirectWithOk } from "@/lib/action-helpers";
import {
  allocateCreateCode,
  assertCodeUnique,
  normalizeCode,
} from "@/lib/codes";
import { optInt, optStr, str } from "@/lib/form";
import {
  diffChamps,
  enregistrerModifications,
} from "@/lib/historique";
import { prisma } from "@/lib/prisma";
import { revalidateApp } from "@/lib/revalidate";
import { formatUtilisateurNom, getCurrentUser } from "@/lib/session";

function revalidateMacro(id: string) {
  revalidateApp([
    `/macroprocessus`,
    `/macroprocessus/${id}`,
    `/macroprocessus/nouveau`,
    `/processus`,
  ]);
}

function parseApplicableUniteIds(formData: FormData, ownerUniteId: string) {
  return [
    ...new Set(
      formData
        .getAll("applicableUniteIds")
        .map(String)
        .map((s) => s.trim())
        .filter(Boolean),
    ),
  ].filter((id) => id !== ownerUniteId);
}

async function assertUniteActive(uniteId: string) {
  return prisma.unite.findFirst({ where: { id: uniteId, actif: true } });
}

async function assertResponsableOptional(id: string | null) {
  if (!id) return true;
  const u = await prisma.utilisateur.findFirst({ where: { id, actif: true } });
  return Boolean(u);
}

async function syncUnitesApplicables(
  macroprocessusId: string,
  ownerUniteId: string,
  selectedIds: string[],
) {
  const ids = selectedIds.filter((id) => id !== ownerUniteId);
  await prisma.macroprocessusUniteApplicable.deleteMany({
    where: { macroprocessusId },
  });
  if (ids.length === 0) return;
  await prisma.macroprocessusUniteApplicable.createMany({
    data: ids.map((uniteId) => ({ macroprocessusId, uniteId })),
  });
}

async function nextHistVersion(objetId: string) {
  const last = await prisma.historiqueModification.aggregate({
    where: { typeObjet: "MACROPROCESSUS", objetId },
    _max: { versionObjet: true },
  });
  return (last._max.versionObjet ?? 0) + 1;
}

async function labelUnite(uniteId: string | null | undefined) {
  if (!uniteId) return null;
  const u = await prisma.unite.findUnique({
    where: { id: uniteId },
    select: { code: true, nom: true },
  });
  return u ? `${u.code} — ${u.nom}` : uniteId;
}

async function labelResponsable(id: string | null | undefined) {
  if (!id) return null;
  const u = await prisma.utilisateur.findUnique({
    where: { id },
    select: { nom: true, prenom: true },
  });
  return u ? formatUtilisateurNom(u) : id;
}

async function labelApplicables(macroprocessusId: string) {
  const rows = await prisma.macroprocessusUniteApplicable.findMany({
    where: { macroprocessusId },
    include: { unite: { select: { code: true } } },
    orderBy: { unite: { code: "asc" } },
  });
  if (rows.length === 0) return null;
  return rows.map((r) => r.unite.code).join(", ");
}

export async function createMacroprocessus(formData: FormData) {
  const current = await getCurrentUser();
  const fallback = "/macroprocessus/nouveau";
  const nom = str(formData, "nom");
  if (!nom) {
    redirectWithError(fallback, "Le nom du macroprocessus est obligatoire.");
  }

  const uniteId = str(formData, "uniteId") || current.uniteId;
  const unite = await assertUniteActive(uniteId);
  if (!unite) redirectWithError(fallback, "Unité introuvable ou inactive.");

  const responsableId = optStr(formData, "responsableId");
  if (!(await assertResponsableOptional(responsableId))) {
    redirectWithError(fallback, "Responsable introuvable.");
  }

  const ordre = optInt(formData, "ordre") ?? 0;
  const applicableUniteIds = parseApplicableUniteIds(formData, uniteId);

  const allocated = await allocateCreateCode(
    "MACROPROCESSUS",
    uniteId,
    optStr(formData, "code"),
  );
  if (!allocated.ok) {
    redirectWithError(fallback, allocated.error);
  }

  if (applicableUniteIds.length > 0) {
    const count = await prisma.unite.count({
      where: {
        id: { in: applicableUniteIds },
        actif: true,
      },
    });
    if (count !== applicableUniteIds.length) {
      redirectWithError(fallback, "Une unité applicable est invalide.");
    }
  }

  const macro = await prisma.macroprocessus.create({
    data: {
      code: allocated.code,
      uniteId,
      nom,
      description: optStr(formData, "description"),
      responsableId: responsableId ?? null,
      ordre,
      archive: false,
      creeParId: current.id,
      modifieParId: current.id,
      ...(applicableUniteIds.length > 0
        ? {
            unitesApplicables: {
              create: applicableUniteIds.map((uid) => ({ uniteId: uid })),
            },
          }
        : {}),
    },
  });

  revalidateMacro(macro.id);
  redirectWithOk(`/macroprocessus/${macro.id}`, "cree");
}

export async function updateMacroprocessus(formData: FormData) {
  const current = await getCurrentUser();
  const id = str(formData, "id");
  if (!id) redirectWithError("/macroprocessus", "Identifiant manquant.");
  const fallback = `/macroprocessus/${id}?edit=INFOS`;

  const existing = await prisma.macroprocessus.findUnique({ where: { id } });
  if (!existing) {
    redirectWithError("/macroprocessus", "Macroprocessus introuvable.");
  }
  if (existing.archive) {
    redirectWithError(
      `/macroprocessus/${id}`,
      "Macroprocessus archivé — modification impossible.",
    );
  }

  const nom = str(formData, "nom");
  if (!nom) redirectWithError(fallback, "Le nom est obligatoire.");

  const uniteId = str(formData, "uniteId") || existing.uniteId;
  const unite = await assertUniteActive(uniteId);
  if (!unite) redirectWithError(fallback, "Unité introuvable ou inactive.");

  const codeRaw = optStr(formData, "code") ?? existing.code;
  const code = normalizeCode(codeRaw);
  const codeErr = await assertCodeUnique("MACROPROCESSUS", code, uniteId, id);
  if (codeErr) redirectWithError(fallback, codeErr);

  const responsableId = optStr(formData, "responsableId");
  if (!(await assertResponsableOptional(responsableId))) {
    redirectWithError(fallback, "Responsable introuvable.");
  }

  const description = optStr(formData, "description");
  const ordre = optInt(formData, "ordre") ?? existing.ordre;
  const applicableUniteIds = parseApplicableUniteIds(formData, uniteId);

  if (applicableUniteIds.length > 0) {
    const count = await prisma.unite.count({
      where: { id: { in: applicableUniteIds }, actif: true },
    });
    if (count !== applicableUniteIds.length) {
      redirectWithError(fallback, "Une unité applicable est invalide.");
    }
  }

  const avantApplicables = await labelApplicables(id);
  const apresApplicablesSorted = await prisma.unite.findMany({
    where: { id: { in: applicableUniteIds } },
    select: { code: true },
    orderBy: { code: "asc" },
  });
  const apresApplicables =
    apresApplicablesSorted.length > 0
      ? apresApplicablesSorted.map((u) => u.code).join(", ")
      : null;

  const [avantUnite, apresUnite, avantResp, apresResp] = await Promise.all([
    labelUnite(existing.uniteId),
    labelUnite(uniteId),
    labelResponsable(existing.responsableId),
    labelResponsable(responsableId),
  ]);

  const changes = diffChamps([
    { champ: "code", avant: existing.code, apres: code },
    { champ: "nom", avant: existing.nom, apres: nom },
    { champ: "description", avant: existing.description, apres: description },
    { champ: "unite", avant: avantUnite, apres: apresUnite },
    { champ: "uniteId", avant: existing.uniteId, apres: uniteId },
    { champ: "responsable", avant: avantResp, apres: apresResp },
    { champ: "ordre", avant: existing.ordre, apres: ordre },
    {
      champ: "unitesApplicables",
      avant: avantApplicables,
      apres: apresApplicables,
    },
  ]);

  await prisma.macroprocessus.update({
    where: { id },
    data: {
      code,
      nom,
      description,
      uniteId,
      responsableId: responsableId ?? null,
      ordre,
      modifieParId: current.id,
    },
  });

  await syncUnitesApplicables(id, uniteId, applicableUniteIds);

  if (changes.length > 0) {
    const versionObjet = await nextHistVersion(id);
    await enregistrerModifications({
      typeObjet: "MACROPROCESSUS",
      objetId: id,
      uniteId,
      modifieParId: current.id,
      changes,
      versionObjet,
    });
  }

  revalidateMacro(id);
  redirectWithOk(`/macroprocessus/${id}`, "modifie");
}

export async function archiveMacroprocessus(formData: FormData) {
  const current = await getCurrentUser();
  const id = str(formData, "id");
  if (!id) redirectWithError("/macroprocessus", "Identifiant manquant.");

  const existing = await prisma.macroprocessus.findUnique({ where: { id } });
  if (!existing) {
    redirectWithError("/macroprocessus", "Macroprocessus introuvable.");
  }
  if (existing.archive) {
    redirectWithOk(`/macroprocessus/${id}`, "archive");
  }

  await prisma.macroprocessus.update({
    where: { id },
    data: { archive: true, modifieParId: current.id },
  });

  const versionObjet = await nextHistVersion(id);
  await enregistrerModifications({
    typeObjet: "MACROPROCESSUS",
    objetId: id,
    uniteId: existing.uniteId,
    modifieParId: current.id,
    changes: diffChamps([
      { champ: "archive", avant: existing.archive, apres: true },
    ]),
    versionObjet,
  });

  revalidateMacro(id);
  redirectWithOk(`/macroprocessus/${id}`, "archive");
}

export async function unarchiveMacroprocessus(formData: FormData) {
  const current = await getCurrentUser();
  const id = str(formData, "id");
  if (!id) redirectWithError("/macroprocessus", "Identifiant manquant.");

  const existing = await prisma.macroprocessus.findUnique({ where: { id } });
  if (!existing) {
    redirectWithError("/macroprocessus", "Macroprocessus introuvable.");
  }
  if (!existing.archive) {
    redirectWithOk(`/macroprocessus/${id}`, "desarchive");
  }

  await prisma.macroprocessus.update({
    where: { id },
    data: { archive: false, modifieParId: current.id },
  });

  const versionObjet = await nextHistVersion(id);
  await enregistrerModifications({
    typeObjet: "MACROPROCESSUS",
    objetId: id,
    uniteId: existing.uniteId,
    modifieParId: current.id,
    changes: diffChamps([
      { champ: "archive", avant: existing.archive, apres: false },
    ]),
    versionObjet,
  });

  revalidateMacro(id);
  redirectWithOk(`/macroprocessus/${id}`, "desarchive");
}
