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
echo "🔧 Using direct connection for schema push (port 5432)"

echo "🔄 Pushing database schema..."
DATABASE_URL="$DIRECT_URL" npx prisma db push --accept-data-loss --skip-generate || {
    echo "⚠️  Schema push failed, continuing anyway..."
}

echo "🌱 Seeding super admin (AA000001)..."
DATABASE_URL="$DIRECT_URL" node prisma/seed.js || {
    echo "⚠️  Seeding failed, continuing anyway..."
}

echo "✅ Ready. Starting server..."
node dist/main.js
