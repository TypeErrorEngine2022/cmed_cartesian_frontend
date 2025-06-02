#!/bin/bash
# A script to test the runtime config by serving the build with custom environment variables

# Build with custom values (these simulate Vercel environment settings)
export VITE_API_URL="https://mock-api-for-testing.vercel.app"
export VITE_NICKNAME="VercelUser"

# Build the app
echo "Building with test environment values..."
npm run build

# Serve the built app
echo ""
echo "Starting server with runtime config..."
echo "API URL: $VITE_API_URL"
echo "Nickname: $VITE_NICKNAME"
echo ""
echo "Open http://localhost:3000 to test"
npx serve dist -l 3000
