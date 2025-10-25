#!/bin/bash

# Payroll App Development Script

echo "🚀 Payroll App Development Setup"
echo "================================"

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js first."
    exit 1
fi

# Check if MongoDB is running
if ! pgrep -x "mongod" > /dev/null; then
    echo "⚠️  MongoDB is not running. Please start MongoDB first."
    echo "   You can start it with: brew services start mongodb-community"
fi

echo "📦 Installing dependencies..."

# Install root dependencies
echo "Installing root dependencies..."
npm install

# Install backend dependencies
echo "Installing backend dependencies..."
cd backend && npm install && cd ..

# Install frontend dependencies
echo "Installing frontend dependencies..."
cd frontend && npm install && cd ..

echo "✅ All dependencies installed!"
echo ""
echo "🎯 Available commands:"
echo "  npm run dev      - Start both frontend and backend"
echo "  npm run backend  - Start only backend server"
echo "  npm run frontend - Start only frontend server"
echo "  npm start        - Start production backend"
echo ""
echo "🌐 URLs:"
echo "  Frontend: http://localhost:3000"
echo "  Backend:  http://localhost:5001"
echo ""
echo "Happy coding! 🎉"
