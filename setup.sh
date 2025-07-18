#!/bin/bash

# Doctor Booking App - Supabase Setup Script
# This script helps you set up the environment for the app

echo "🏥 Doctor Booking App - Supabase Setup"
echo "======================================"

# Check if .env file exists
if [ ! -f .env ]; then
    echo "📝 Creating .env file from template..."
    cp .env.example .env
    echo "✅ .env file created. Please edit it with your Supabase credentials."
else
    echo "📄 .env file already exists."
fi

# Check if node_modules exists
if [ ! -d node_modules ]; then
    echo "📦 Installing dependencies..."
    npm install
else
    echo "📦 Dependencies already installed."
fi

echo ""
echo "🚀 Next Steps:"
echo "1. Edit .env file with your Supabase URL and anon key"
echo "2. Run the SQL scripts in Supabase SQL Editor:"
echo "   - Copy and paste the schema from SUPABASE_SETUP.md"
echo "   - Run the sample data from sample_data.sql"
echo "3. Start the development server: npx expo start"
echo ""
echo "📖 For detailed instructions, see SUPABASE_SETUP.md"

# Make the script executable
chmod +x setup.sh
