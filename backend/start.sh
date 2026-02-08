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
    npx prisma migrate deploy || {
        echo "⚠️  Migration failed, trying db push..."
        npx prisma db push --accept-data-loss --skip-generate
    }
else
    echo "⚠ No migrations found. Pushing schema..."
    npx prisma db push --accept-data-loss --skip-generate
fi

# Only seed if explicitly enabled (to avoid timeouts on first deploy)
if [ "$ENABLE_SEED" = "true" ]; then
    echo "🌱 Seeding default data..."
    node prisma/seed.js || echo "⚠️  Seeding failed, continuing anyway..."
else
    echo "⏭️  Skipping seed (set ENABLE_SEED=true to enable)"
fi

echo "✅ Ready. Starting server..."
node dist/main.js
