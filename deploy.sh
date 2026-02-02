#!/bin/bash

# 🚀 Quick Deploy to GitHub → Vercel
# Run this script to push your changes

echo "🚀 Starting deployment process..."

# Check for large files
echo ""
echo "📦 Checking for large files..."
LARGE_FILES=$(find . -type f -size +50M -not -path "*/node_modules/*" -not -path "*/.next/*" -not -path "*/.git/*" 2>/dev/null)

if [ -n "$LARGE_FILES" ]; then
    echo "❌ Found large files (>50MB):"
    echo "$LARGE_FILES"
    echo ""
    echo "⚠️  GitHub won't accept these files!"
    echo "Please add them to .gitignore or use Git LFS"
    exit 1
else
    echo "✅ No large files found"
fi

# Git status
echo ""
echo "📋 Current changes:"
git status --short

# Confirm
echo ""
read -p "🤔 Do you want to commit and push these changes? (y/n) " -n 1 -r
echo

if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "❌ Deployment cancelled"
    exit 0
fi

# Get commit message
echo ""
read -p "💬 Enter commit message (or press Enter for default): " COMMIT_MSG

if [ -z "$COMMIT_MSG" ]; then
    COMMIT_MSG="chore: update OS - performance optimizations & Firebase fixes"
fi

# Commit and push
echo ""
echo "📝 Committing changes..."
git add .
git commit -m "$COMMIT_MSG"

echo ""
echo "⬆️  Pushing to GitHub..."
git push origin main

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Successfully pushed to GitHub!"
    echo "🎉 Vercel will auto-deploy your changes in ~2 minutes"
    echo ""
    echo "📺 Monitor deployment at: https://vercel.com/dashboard"
else
    echo ""
    echo "❌ Push failed! Check error above"
    exit 1
fi

# Show next steps
echo ""
echo "🎯 NEXT STEPS:"
echo "1. Wait 2-3 minutes for Vercel to deploy"
echo "2. Visit your Vercel URL to test"
echo "3. Check browser console for errors"
echo ""
echo "🔧 If you need to deploy backend:"
echo "   → See DEPLOYMENT_GUIDE.md for Render setup"
echo ""
echo "✨ Done!"
