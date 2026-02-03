#!/bin/sh
set -e

echo "🚀 Running database migrations..."
npx prisma db push --force-reset --accept-data-loss

echo "🌱 Seeding default data..."
node prisma/seed.js

echo "✅ Migrations complete. Starting server..."
node dist/main.js
