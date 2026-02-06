#!/bin/sh
set -e

echo "🚀 Starting application..."

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
    echo "❌ Error: DATABASE_URL environment variable is not set."
    echo "ℹ️  Please set DATABASE_URL in your Railway project settings."
    exit 1
fi

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
