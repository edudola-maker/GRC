-- Distinguer planification (plage de travail) et échéance (deadline).
-- dateFinPlanifiee : fin de plage planifiée sur Projet et Tâche.
-- Mission conserve dateDebut / dateFin comme planification.

ALTER TABLE "Projet" ADD COLUMN "dateFinPlanifiee" DATETIME;
ALTER TABLE "Tache" ADD COLUMN "dateFinPlanifiee" DATETIME;

-- Migrer les plages historiques : si début + échéance existaient,
-- l’ancienne UI traitait l’échéance comme fin de bande → copier en fin planifiée.
UPDATE "Projet"
SET "dateFinPlanifiee" = "dateEcheance"
WHERE "dateDebut" IS NOT NULL
  AND "dateEcheance" IS NOT NULL
  AND "dateFinPlanifiee" IS NULL;

UPDATE "Tache"
SET "dateFinPlanifiee" = "dateEcheance"
WHERE "dateDebut" IS NOT NULL
  AND "dateEcheance" IS NOT NULL
  AND "dateFinPlanifiee" IS NULL;
