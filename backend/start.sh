#!/bin/sh
set -e

echo "🚀 Starting application..."
echo "📊 Listening on Port: ${PORT:-3001}"

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
    echo "❌ Error: DATABASE_URL environment variable is not set."
    exit 1
fi

echo "🚀 Running database migrations..."
if [ -d "prisma/migrations" ] && [ "$(ls -A prisma/migrations)" ]; then
    echo "Applying migrations..."
    npx prisma migrate deploy
else
    echo "⚠ No migrations found. Pushing schema with --accept-data-loss..."
    npx prisma db push --accept-data-loss
fi

echo "🌱 Seeding default data..."
node prisma/seed.js

echo "✅ Ready. Starting server..."
node dist/main.js
