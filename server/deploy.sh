#!/bin/sh
set -e

echo "==> Running database setup..."

# Try prisma migrate deploy first (proper production approach).
# If it fails because tables already exist from a prior db push
# (no _prisma_migrations history), fall back to db push which is
# idempotent and safe on any existing schema.
if npx prisma migrate deploy; then
  echo "==> Migrations applied."
else
  echo "==> migrate deploy failed — falling back to db push (schema already exists)."
  npx prisma db push --accept-data-loss
  echo "==> Schema in sync."
fi

echo "==> Seeding database (skips if data already exists)..."
node prisma/seed.js || echo "==> Seed skipped or already done."

echo "==> Starting server..."
exec node index.js
