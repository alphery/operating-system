#!/bin/sh
set -e

echo "🚀 Running database migrations..."
# Check if migrations directory exists, if so migrate, else push
if [ -d "prisma/migrations" ]; then
    echo "🚀 Running database migrations..."
    npx prisma migrate deploy
else
    echo "⚠ No migrations found. Pushing schema..."
    npx prisma db push
fi

echo "🌱 Seeding default data..."
node prisma/seed.js

echo "✅ Migrations complete. Starting server..."
node dist/main.js
