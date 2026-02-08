#!/bin/sh
set -e

echo "🚀 Starting application..."
echo "📊 Listening on Port: ${PORT:-3001}"

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
    echo "❌ Error: DATABASE_URL environment variable is not set."
    exit 1
fi

# Convert pooler URL to direct URL for migrations
# Pooler uses port 6543, direct uses port 5432
# pgBouncer doesn't support transaction mode needed for migrations
DIRECT_URL=$(echo "$DATABASE_URL" | sed 's/:6543/:5432/g' | sed 's/pgbouncer=true//')
echo "🔧 Using direct connection for migrations (port 5432)"

echo "🚀 Running database migrations..."
if [ -d "prisma/migrations" ] && [ "$(ls -A prisma/migrations)" ]; then
    echo "Applying migrations with direct connection..."
    DATABASE_URL="$DIRECT_URL" npx prisma migrate deploy || {
        echo "⚠️  Migration failed, trying db push..."
        DATABASE_URL="$DIRECT_URL" npx prisma db push --accept-data-loss --skip-generate
    }
else
    echo "⚠ No migrations found. Pushing schema..."
    DATABASE_URL="$DIRECT_URL" npx prisma db push --accept-data-loss --skip-generate
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
