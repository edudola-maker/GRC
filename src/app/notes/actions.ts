"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { redirectWithError, redirectWithOk } from "@/lib/action-helpers";
import { optDate, optFloat, optStr, str } from "@/lib/form";
import { isNoteParent } from "@/lib/notes";
import { prisma } from "@/lib/prisma";
import { revalidateApp } from "@/lib/revalidate";
import { sectionSavedHref } from "@/lib/section-nav";
import { getCurrentUser } from "@/lib/session";
import type { TypeObjetMetier, TypeNoteTravail } from "@/generated/prisma/client";

function parentHref(typeObjet: string, objetId: string, focus?: string) {
  const base =
    typeObjet === "PROJET"
      ? `/projets/${objetId}`
      : typeObjet === "CONSEIL"
        ? `/conseils/${objetId}`
        : typeObjet === "MISSION"
          ? `/missions/${objetId}`
          : "/";
  return focus ? sectionSavedHref(base, focus) : base;
}

function parseParent(formData: FormData) {
  const typeObjet = str(formData, "typeObjet");
  const objetId = str(formData, "objetId");
  if (!typeObjet || !objetId || !isNoteParent(typeObjet)) {
    return null;
  }
  return { typeObjet: typeObjet as TypeObjetMetier, objetId };
}

export async function createNoteTravail(formData: FormData) {
  const current = await getCurrentUser();
  const parent = parseParent(formData);
  const retour = str(formData, "retour") || "/";
  if (!parent) redirectWithError(retour, "Objet parent invalide.");

  const titre = str(formData, "titre");
  if (!titre) redirectWithError(retour, "Le titre de la note est obligatoire.");

  const typeRaw = str(formData, "type") || "TRAVAIL";
  const type: TypeNoteTravail =
    typeRaw === "SEANCE" ? "SEANCE" : "TRAVAIL";
  const date = optDate(formData, "date") ?? new Date();
  const notesLibres = optStr(formData, "notesLibres");
  const etapeMission = optStr(formData, "etapeMission");

  const note = await prisma.noteTravail.create({
    data: {
      uniteId: current.uniteId,
      typeObjet: parent.typeObjet,
      objetId: parent.objetId,
      titre,
      date,
      type,
      notesLibres,
      etapeMission,
      auteurId: current.id,
    },
  });

  const participantsInternes = formData.getAll("participantIds").map(String).filter(Boolean);
  const externes = (optStr(formData, "participantsExternes") ?? "")
    .split(/[;\n,]+/)
    .map((s) => s.trim())
    .filter(Boolean);

  if (participantsInternes.length || externes.length) {
    await prisma.noteParticipant.createMany({
      data: [
        ...participantsInternes.map((utilisateurId) => ({
          noteId: note.id,
          utilisateurId,
        })),
        ...externes.map((nomExterne) => ({
          noteId: note.id,
          nomExterne,
        })),
      ],
    });
  }

  revalidateApp([parentHref(parent.typeObjet, parent.objetId)]);
  redirectWithOk(
    parentHref(parent.typeObjet, parent.objetId, "NOTES"),
    "note",
  );
}

export async function addNoteQuestion(formData: FormData) {
  const noteId = str(formData, "noteId");
  const libelle = str(formData, "libelle");
  const retour = str(formData, "retour") || "/";
  if (!noteId) redirectWithError(retour, "Note introuvable.");
  if (!libelle) redirectWithError(retour, "La question est obligatoire.");

  const note = await prisma.noteTravail.findUnique({ where: { id: noteId } });
  if (!note) redirectWithError(retour, "Note introuvable.");

  const max = await prisma.noteQuestion.aggregate({
    where: { noteId },
    _max: { ordre: true },
  });
  await prisma.noteQuestion.create({
    data: {
      noteId,
      libelle,
      ordre: (max._max.ordre ?? -1) + 1,
    },
  });

  revalidatePath(parentHref(note.typeObjet, note.objetId));
  redirect(parentHref(note.typeObjet, note.objetId, "NOTES"));
}

export async function updateNoteQuestion(formData: FormData) {
  const questionId = str(formData, "questionId");
  const reponse = optStr(formData, "reponse");
  const retour = str(formData, "retour") || "/";
  if (!questionId) redirectWithError(retour, "Question introuvable.");

  const q = await prisma.noteQuestion.findUnique({
    where: { id: questionId },
    include: { note: true },
  });
  if (!q) redirectWithError(retour, "Question introuvable.");

  await prisma.noteQuestion.update({
    where: { id: questionId },
    data: { reponse },
  });

  revalidatePath(parentHref(q.note.typeObjet, q.note.objetId));
  redirect(parentHref(q.note.typeObjet, q.note.objetId, "NOTES"));
}

export async function updateNoteLibres(formData: FormData) {
  const noteId = str(formData, "noteId");
  const notesLibres = optStr(formData, "notesLibres");
  const retour = str(formData, "retour") || "/";
  if (!noteId) redirectWithError(retour, "Note introuvable.");

  const note = await prisma.noteTravail.findUnique({ where: { id: noteId } });
  if (!note) redirectWithError(retour, "Note introuvable.");

  await prisma.noteTravail.update({
    where: { id: noteId },
    data: { notesLibres },
  });

  revalidatePath(parentHref(note.typeObjet, note.objetId));
  redirect(parentHref(note.typeObjet, note.objetId, "NOTES"));
}

export async function deleteNoteTravail(formData: FormData) {
  const noteId = str(formData, "noteId") || str(formData, "id");
  const retour = str(formData, "retour") || "/";
  if (!noteId) redirectWithError(retour, "Note introuvable.");

  const note = await prisma.noteTravail.findUnique({ where: { id: noteId } });
  if (!note) redirectWithError(retour, "Note introuvable.");

  await prisma.noteTravail.delete({ where: { id: noteId } });
  revalidateApp([parentHref(note.typeObjet, note.objetId)]);
  redirectWithOk(parentHref(note.typeObjet, note.objetId, "NOTES"), "supprime");
}

/** Création rapide d’une tâche depuis une Note (titre, responsable, échéance, charge). */
export async function createTacheDepuisNote(formData: FormData) {
  const current = await getCurrentUser();
  const noteId = str(formData, "noteId");
  const retour = str(formData, "retour") || "/";
  if (!noteId) redirectWithError(retour, "Note introuvable.");

  const note = await prisma.noteTravail.findUnique({ where: { id: noteId } });
  if (!note) redirectWithError(retour, "Note introuvable.");

  const titre = str(formData, "titre");
  if (!titre) redirectWithError(retour, "Le titre de la tâche est obligatoire.");
  const responsableId = str(formData, "responsableId") || current.id;
  const dateEcheance = optDate(formData, "dateEcheance");
  const chargeJours = optFloat(formData, "chargeJours");

  const data: {
    uniteId: string;
    titre: string;
    responsableId: string;
    dateEcheance: Date | null;
    chargeJours: number | null;
    noteTravailId: string;
    creeParId: string;
    modifieParId: string;
    categorie: "PROJET" | "CONSEIL" | "MISSION" | "AUTRE";
    projetId?: string;
    conseilId?: string;
    missionId?: string;
  } = {
    uniteId: current.uniteId,
    titre,
    responsableId,
    dateEcheance,
    chargeJours,
    noteTravailId: note.id,
    creeParId: current.id,
    modifieParId: current.id,
    categorie: "AUTRE",
  };

  if (note.typeObjet === "PROJET") {
    data.projetId = note.objetId;
    data.categorie = "PROJET";
  } else if (note.typeObjet === "CONSEIL") {
    data.conseilId = note.objetId;
    data.categorie = "CONSEIL";
  } else if (note.typeObjet === "MISSION") {
    data.missionId = note.objetId;
    data.categorie = "MISSION";
  }

  const tache = await prisma.tache.create({ data });
  revalidateApp([
    parentHref(note.typeObjet, note.objetId),
    `/taches/${tache.id}`,
  ]);
  redirectWithOk(
    parentHref(note.typeObjet, note.objetId, "NOTES"),
    "tache",
  );
}

/** Création rapide depuis un objet (Risque, etc.) — rattachement auto. */
export async function createTacheRapide(formData: FormData) {
  const current = await getCurrentUser();
  const retour = str(formData, "retour") || "/taches";
  const titre = str(formData, "titre");
  if (!titre) redirectWithError(retour, "Le titre est obligatoire.");

  const responsableId = str(formData, "responsableId") || current.id;
  const dateEcheance = optDate(formData, "dateEcheance");
  const chargeJours = optFloat(formData, "chargeJours");
  const projetId = optStr(formData, "projetId");
  const conseilId = optStr(formData, "conseilId");
  const missionId = optStr(formData, "missionId");
  const risqueId = optStr(formData, "risqueId");
  const documentId = optStr(formData, "documentId");
  const controleSCIId = optStr(formData, "controleSCIId");

  let cat: "PROJET" | "CONSEIL" | "MISSION" | "DOCUMENT" | "SCI" | "AUTRE" =
    "AUTRE";
  if (projetId) cat = "PROJET";
  else if (conseilId) cat = "CONSEIL";
  else if (missionId) cat = "MISSION";
  else if (documentId) cat = "DOCUMENT";
  else if (controleSCIId) cat = "SCI";

  const tache = await prisma.tache.create({
    data: {
      uniteId: current.uniteId,
      titre,
      responsableId,
      dateEcheance,
      chargeJours,
      projetId,
      conseilId,
      missionId,
      risqueId,
      documentId,
      controleSCIId,
      categorie: cat,
      creeParId: current.id,
      modifieParId: current.id,
    },
  });

  revalidateApp([retour, `/taches/${tache.id}`]);
  const base = retour.split("?")[0] || retour;
  redirectWithOk(base, "tache");
}
