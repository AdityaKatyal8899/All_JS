#!/bin/bash

# YouTube Downloader Startup Script

echo "🚀 Starting YouTube Downloader..."

# Check if Python is installed
if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 is not installed. Please install Python 3.7 or higher."
    exit 1
fi

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 14 or higher."
    exit 1
fi

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed. Please install npm."
    exit 1
fi

# Check if .env file exists
if [ ! -f .env ]; then
    echo "❌ .env file not found. Please create a .env file with your configuration."
    exit 1
fi

# Install Python dependencies if requirements.txt exists
if [ -f requirements.txt ]; then
    echo "📦 Installing Python dependencies..."
    pip3 install -r requirements.txt
fi

# Install Node.js dependencies if package.json exists
if [ -f package.json ]; then
    echo "📦 Installing Node.js dependencies..."
    npm install
fi

# Create downloads directory if it doesn't exist
mkdir -p downloads

echo "✅ Dependencies installed and directories created."

# Start Flask API in background
echo "🐍 Starting Flask API..."
python3 flask_api.py &
FLASK_PID=$!

# Wait a moment for Flask to start
sleep 3

# Start Node.js server
echo "🟢 Starting Node.js server..."
npm run dev &
NODE_PID=$!

echo "🎉 Both services are starting..."
echo "📱 Flask API: http://localhost:5001"
echo "🌐 Web App: http://localhost:3000"
echo ""
echo "Press Ctrl+C to stop both services"

# Function to cleanup on exit
cleanup() {
    echo ""
    echo "🛑 Stopping services..."
    kill $FLASK_PID 2>/dev/null
    kill $NODE_PID 2>/dev/null
    echo "✅ Services stopped."
    exit 0
}

# Set trap to cleanup on script exit
trap cleanup SIGINT SIGTERM

# Wait for both processes
wait
