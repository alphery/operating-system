#!/bin/sh
set -e

echo "🚀 Running database migrations..."
npx prisma db push --accept-data-loss

echo "✅ Migrations complete. Starting server..."
node dist/main.js
