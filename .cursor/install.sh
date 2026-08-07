#!/usr/bin/env bash
# Idempotent repository setup for GRC Pilotage (Next.js + Prisma + SQLite).
set -euo pipefail

cd "$(dirname "$0")/.."

# Install dependencies (includes the better-sqlite3 native addon).
# `npm install` is used rather than `npm ci` because the committed
# package-lock.json is out of sync with package.json; install reconciles it.
npm install

# Provide a local env file if one does not already exist.
[ -f .env ] || cp .env.example .env

# Apply committed migrations to the local SQLite database (non-interactive).
npx prisma migrate deploy

# Generate the Prisma client into src/generated/prisma (gitignored).
npx prisma generate

# Load demonstration data (resets and recreates demo rows).
npm run db:seed
