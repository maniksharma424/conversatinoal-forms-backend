#!/bin/bash
set -e

echo "========================================"
echo "Starting deployment script..."
echo "========================================"
DEPLOY_DIR="/home/ec2-user/app/conversatinoal-forms-backend"

# Navigate to project directory
echo "Changing to project directory: $DEPLOY_DIR"
cd $DEPLOY_DIR

# Update from git repository (optional - useful if you're not using rsync for file transfer)
# echo "Pulling latest code from repository..."
# git pull origin main

# Install dependencies including type definitions
echo "Installing dependencies..."
npm ci
npm install --save-dev @types/dotenv-safe @types/express @types/cors @types/uuid @types/bcrypt

# Create type declarations file if needed
echo "Creating type declarations file..."
mkdir -p src/types
cat > src/types/declarations.d.ts << EOF
declare module 'dotenv-safe';
declare module 'express';
declare module 'cors';
declare module 'uuid';
declare module 'bcrypt';
EOF

# Copy environment file (if it doesn't exist in source)
echo "Ensuring environment file exists..."
if [ ! -f .env ]; then
    echo "ERROR: .env file not found!"
    exit 1
fi

# Build the application
echo "Building the application..."
npm run build

# Ensure environment file is copied to build directory
echo "Copying environment files to build directory..."
cp .env .env.example dist/

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