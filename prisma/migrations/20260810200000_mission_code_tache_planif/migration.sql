-- Mission.contenuVersion + Tache planification (dateDebut, chargeJours)

ALTER TABLE "Mission" ADD COLUMN "contenuVersion" INTEGER NOT NULL DEFAULT 1;

ALTER TABLE "Tache" ADD COLUMN "dateDebut" DATETIME;
ALTER TABLE "Tache" ADD COLUMN "chargeJours" REAL;
