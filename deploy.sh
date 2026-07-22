#!/bin/bash

# Gyrex VPS Deployment Script
# Run this script on your Hostinger VPS after pulling your code.

echo "🚀 Starting Gyrex Deployment..."

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
echo "🔄 Starting PM2 process named 'gyrex' on port 3007..."
# Check if PM2 has gyrex running already
if pm2 list | grep -q "gyrex"; then
  pm2 reload gyrex
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
