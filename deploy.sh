#!/bin/bash
set -e

echo "Starting deployment..."
cd /home/ec2-user/app/conversatinoal-forms-backend

echo "Installing dependencies..."
npm ci --production

echo "Building the application..."
npm run build

echo "Copying environment file..."
cp .env dist/

echo "Restarting the application..."
pm2 restart forms-api || pm2 start dist/index.js --node-args="-r tsconfig-paths/register" --name "forms-api"

echo "Deployment completed successfully!"