#!/bin/sh
set -e

echo "🚀 Starting application..."
echo "📊 Listening on Port: ${PORT:-3001}"

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
    echo "❌ Error: DATABASE_URL environment variable is not set."
    exit 1
fi

# Convert pooler URL to direct URL for schema push
# Pooler uses port 6543, direct uses port 5432
DIRECT_URL=$(echo "$DATABASE_URL" | sed 's/:6543/:5432/g' | sed 's/pgbouncer=true//')

echo "🔄 Pushing database schema (using port 5432)..."
DATABASE_URL="$DIRECT_URL" npx prisma db push --accept-data-loss --skip-generate || {
    echo "⚠️  Schema push failed, continuing anyway (schema might be outdated)..."
}

# NOTE: Seeding is now handled inside NestJS AuthService.onModuleInit()
# This ensures it uses the app's bcrypt logic and connection pool properly.

echo "✅ Ready. Starting server..."
node dist/main.js
