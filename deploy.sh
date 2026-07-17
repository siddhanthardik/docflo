#!/bin/bash

# Docflo VPS Deployment Script
# Run this script on your Hostinger VPS after pulling your code.

echo "🚀 Starting Docflo Deployment..."

# 1. Install Dependencies
echo "📦 Installing Node modules..."
npm install

# 2. Generate Prisma Client
echo "🗄️ Generating Prisma Client..."
npx prisma generate

# 3. Build the Next.js Application
echo "🏗️ Building the Next.js App for Production..."
npm run build

# 4. Start/Restart with PM2
echo "🔄 Starting PM2 process named 'docflo' on port 3007..."
# Check if PM2 has docflo running already
if pm2 list | grep -q "docflo"; then
  pm2 reload docflo
else
  pm2 start ecosystem.config.cjs
  pm2 save
fi

echo "✅ Deployment Successful!"
echo ""
echo "⚠️ Don't forget to:"
echo "1. Create your .env file on the VPS"
echo "2. Copy nginx.conf.example to /etc/nginx/sites-available/planmyhospital.com"
echo "3. Run: sudo ln -s /etc/nginx/sites-available/planmyhospital.com /etc/nginx/sites-enabled/"
echo "4. Run: sudo nginx -t && sudo systemctl reload nginx"
