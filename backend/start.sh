#!/bin/sh
set -e

echo "🚀 Starting application..."

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
    echo "❌ Error: DATABASE_URL environment variable is not set."
    echo "ℹ️  Please set DATABASE_URL in your Railway project settings."
    exit 1
fi

# Debug validation for the URL format
case "$DATABASE_URL" in
    postgresql://*|postgres://*)
        echo "✅ DATABASE_URL has correct protocol."
        ;;
    \"*\"|'*')
        echo "❌ Error: DATABASE_URL contains leading/trailing quotes. Please remove them in Railway settings."
        echo "Value starts with: ${DATABASE_URL:0:10}..."
        exit 1
        ;;
    *)
        echo "❌ Error: DATABASE_URL must start with postgresql:// or postgres://"
        echo "Current value starts with: ${DATABASE_URL:0:15}..."
        exit 1
        ;;
esac

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
