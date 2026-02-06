#!/bin/sh
set -e

echo "🚀 Starting application..."

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
    echo "❌ Error: DATABASE_URL environment variable is not set."
    exit 1
fi

echo "🚀 Running database migrations..."
if [ -d "prisma/migrations" ]; then
    npx prisma migrate deploy
else
    echo "⚠ No migrations found. Pushing schema..."
    npx prisma db push
fi

echo "🌱 Seeding default data..."
node prisma/seed.js

echo "✅ Ready. Starting server..."
node dist/main.js
