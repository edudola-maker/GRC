# GRC — Pilotage & Monitoring

Application web interne de pilotage pour une unité administrative.

**Vision produit / feuille de route :** [ROADMAP.md](./ROADMAP.md)  
**Ancrage architecture :** [ARCHITECTURE.md](./ARCHITECTURE.md)

## Module 1 (MVP actuel)

- **Pilotage** — tableau de bord (données réelles SQLite)
- **Backlog** — tâches à traiter + filtres (vue d’action)
- **Tâches** — CRUD des actions (dont catégorie Conseil — pont vers futur objet Conseil)
- **Projets** — CRUD complet
- **Contrôles SCI** — modèle prêt, UI placeholder

## Prérequis

- Node.js 20+
- npm

## Démarrage local

```bash
npm install
cp .env.example .env
npx prisma migrate dev
npm run db:seed
npm run dev
```

Ouvrir [http://localhost:3000](http://localhost:3000).

## Stack

- Next.js (App Router) + TypeScript
- Prisma + SQLite (`prisma/dev.db`)
- Tailwind CSS

## Notes

- Les fichiers joints (preuves SCI) seront stockés hors base dans `uploads/`.
- Sans authentification pour l’instant : le premier utilisateur actif sert d’auteur des créations/modifications.
- Ne pas démarrer les modules Risques / Documents / Équipe / Audits / boîte de réception tant qu’ils ne sont pas explicitement demandés — la feuille de route les cadre déjà.
