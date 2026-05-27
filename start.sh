#!/bin/bash
# JusBooks Startup Script
# Usage: ./start.sh

cd "$(dirname "$0")"

echo "Starting JusBooks Library Management System..."

# Rebuild sqlite3 with system headers if needed
npm_config_nodedir=/usr npm rebuild sqlite3 --silent 2>/dev/null

# Start the server
node server.js
