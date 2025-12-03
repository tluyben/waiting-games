#!/bin/bash
set -e

echo "🚀 Starting production Clean TypeScript application..."

# Check if /data is mounted (optional for this template)
if [ -d "/data" ]; then
  echo "✅ Data directory available at /data"
else
  echo "⚠️  No /data directory mounted (optional for this template)"
fi

# Set any environment-specific configurations
export NODE_ENV=production

echo "🎯 Starting application server..."

# Execute the main command
exec "$@"
