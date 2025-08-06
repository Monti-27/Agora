#!/bin/bash

# Real-Time Chat App Setup Script
# This script helps set up the development environment

set -e

echo "🚀 Real-Time Chat App Setup"
echo "============================"

# Check if required tools are installed
check_tool() {
    if ! command -v $1 &> /dev/null; then
        echo "❌ $1 is not installed. Please install it first."
        exit 1
    fi
    echo "✅ $1 is installed"
}

echo "📋 Checking prerequisites..."
check_tool "rust"
check_tool "cargo" 
check_tool "node"
check_tool "npm"
check_tool "psql"
check_tool "redis-cli"

echo ""
echo "🗄️  Setting up database..."

# Check if PostgreSQL is running
if ! pg_isready &> /dev/null; then
    echo "❌ PostgreSQL is not running. Please start it first."
    echo "   macOS: brew services start postgresql"
    echo "   Linux: sudo systemctl start postgresql"
    exit 1
fi

# Create database if it doesn't exist
if ! psql -lqt | cut -d \| -f 1 | grep -qw chat_app; then
    echo "📦 Creating database 'chat_app'..."
    createdb chat_app
    echo "✅ Database created"
else
    echo "✅ Database 'chat_app' already exists"
fi

# Check if Redis is running
if ! redis-cli ping &> /dev/null; then
    echo "❌ Redis is not running. Please start it first."
    echo "   macOS: brew services start redis"
    echo "   Linux: sudo systemctl start redis"
    echo "   Manual: redis-server"
    exit 1
fi
echo "✅ Redis is running"

echo ""
echo "🔧 Setting up backend..."

# Backend setup
cd backend

if [ ! -f .env ]; then
    echo "📄 Creating backend .env file..."
    cp .env.example .env
    echo "✅ Backend .env file created. Please update it with your settings."
else
    echo "✅ Backend .env file already exists"
fi

echo "📦 Installing backend dependencies..."
cargo build
echo "✅ Backend dependencies installed"

cd ..

echo ""
echo "🎨 Setting up frontend..."

# Frontend setup
cd frontend

if [ ! -f .env.local ]; then
    echo "📄 Creating frontend .env.local file..."
    cp .env.local.example .env.local
    echo "✅ Frontend .env.local file created"
else
    echo "✅ Frontend .env.local file already exists"
fi

echo "📦 Installing frontend dependencies..."
npm install
echo "✅ Frontend dependencies installed"

cd ..

echo ""
echo "🎉 Setup completed successfully!"
echo ""
echo "🚀 To start the application:"
echo ""
echo "1. Start the backend:"
echo "   cd backend && cargo run"
echo ""
echo "2. In another terminal, start the frontend:"
echo "   cd frontend && npm run dev"
echo ""
echo "3. Open your browser and go to:"
echo "   http://localhost:3000"
echo ""
echo "📚 For more information, see README.md"
echo ""
echo "🐳 Alternative: Use Docker Compose"
echo "   docker-compose up --build"
