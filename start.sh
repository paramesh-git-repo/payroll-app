#!/bin/bash

# Start Payroll App Servers

echo "🚀 Starting Payroll App..."

# Kill any existing processes on ports 3000 and 5001
echo "🧹 Cleaning up existing processes..."
lsof -ti:3000 | xargs kill -9 2>/dev/null || true
lsof -ti:5001 | xargs kill -9 2>/dev/null || true

# Start backend server
echo "🔧 Starting backend server..."
cd backend && npm start &
BACKEND_PID=$!

# Wait a moment for backend to start
sleep 3

# Start frontend server
echo "🎨 Starting frontend server..."
cd ../frontend && npm start &
FRONTEND_PID=$!

echo ""
echo "✅ Both servers are starting..."
echo "🌐 Frontend: http://localhost:3000"
echo "🔧 Backend:  http://localhost:5001"
echo ""
echo "Press Ctrl+C to stop both servers"

# Wait for user interrupt
trap "echo '🛑 Stopping servers...'; kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; exit" INT
wait
