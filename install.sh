#!/bin/bash

echo "🎉 WEDDING WHATSAPP MEDIA COLLECTOR INSTALLER 🎉"
echo "================================================="
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed."
    echo "Please install Node.js from https://nodejs.org/"
    echo "Minimum version required: 16.0.0"
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node -v)
echo "✅ Node.js version: $NODE_VERSION"

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed."
    echo "Please install npm (usually comes with Node.js)"
    exit 1
fi

NPM_VERSION=$(npm -v)
echo "✅ npm version: $NPM_VERSION"
echo ""

# Install dependencies
echo "📦 Installing dependencies..."
npm install

if [ $? -eq 0 ]; then
    echo "✅ Dependencies installed successfully!"
else
    echo "❌ Failed to install dependencies."
    echo "Please check your internet connection and try again."
    exit 1
fi

echo ""

# Create necessary directories
echo "📁 Creating directory structure..."
mkdir -p media/photos
mkdir -p media/videos
mkdir -p qr-codes
mkdir -p config
mkdir -p logs
mkdir -p temp

echo "✅ Directories created!"
echo ""

# Run setup wizard
echo "🔧 Running setup wizard..."
npm run setup

echo ""
echo "🎊 INSTALLATION COMPLETED! 🎊"
echo "=============================="
echo ""
echo "📋 NEXT STEPS:"
echo "1. Set up Google Drive credentials:"
echo "   - Go to https://console.cloud.google.com/"
echo "   - Create a service account and download credentials"
echo "   - Save as config/google-credentials.json"
echo ""
echo "2. Start the bot:"
echo "   npm start"
echo ""
echo "3. Scan QR with WhatsApp Web"
echo ""
echo "4. Share the guest QR code (in qr-codes/) at your wedding!"
echo ""
echo "💕 ¡Felicidades por tu boda!"
echo "" 