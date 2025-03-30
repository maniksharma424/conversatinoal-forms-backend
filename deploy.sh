#!/bin/bash
set -e  # Exit immediately if a command exits with a non-zero status

echo "========================================"
echo "Starting deployment script..."
echo "========================================"
DEPLOY_DIR="/home/ec2-user/app/app/conversatinoal-forms-backend"

# Navigate to project directory
echo "Changing to project directory: $DEPLOY_DIR"
cd $DEPLOY_DIR

# Verify environment files exist
echo "Checking environment files..."
if [ ! -f .env ]; then
    echo "ERROR: .env file not found!"
    exit 1
fi

if [ ! -f .env.example ]; then
    echo "ERROR: .env.example file not found!"
    exit 1
fi

# Install dependencies
echo "Installing dependencies..."
npm ci

# Build the application
echo "Building the application..."
npm run build

# Ensure environment files are copied to build directory
echo "Copying environment files to build directory..."
cp .env dist/
cp .env.example dist/

# Restart the application with PM2
echo "Restarting the application with PM2..."
# Stop and delete existing instances
pm2 stop forms-api || true
pm2 delete forms-api || true

# Start a new instance
pm2 start dist/index.js --node-args="-r tsconfig-paths/register" --name "forms-api"

# Save PM2 configuration to persist across reboots
echo "Saving PM2 process list..."
pm2 save

echo "========================================"
echo "Deployment completed successfully!"
echo "========================================"