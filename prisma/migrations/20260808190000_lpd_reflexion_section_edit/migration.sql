-- LPD by design (socle) + champs réflexion Mission / Risque / Conseil

-- CreateEnum (SQLite = TEXT values)
-- AlterTable
ALTER TABLE "Conseil" ADD COLUMN "raisonnement" TEXT;

ALTER TABLE "Risque" ADD COLUMN "justificationEvaluation" TEXT;

ALTER TABLE "Document" ADD COLUMN "contientDonneesPersonnelles" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Document" ADD COLUMN "niveauConfidentialite" TEXT NOT NULL DEFAULT 'INTERNE';

ALTER TABLE "MissionTemplate" ADD COLUMN "contientDonneesPersonnelles" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "MissionTemplate" ADD COLUMN "niveauConfidentialite" TEXT NOT NULL DEFAULT 'INTERNE';

ALTER TABLE "Mission" ADD COLUMN "analyseTravaux" TEXT;
ALTER TABLE "Mission" ADD COLUMN "contientDonneesPersonnelles" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Mission" ADD COLUMN "niveauConfidentialite" TEXT NOT NULL DEFAULT 'INTERNE';

ALTER TABLE "Processus" ADD COLUMN "contientDonneesPersonnelles" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Processus" ADD COLUMN "niveauConfidentialite" TEXT NOT NULL DEFAULT 'INTERNE';
