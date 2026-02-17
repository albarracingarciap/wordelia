#!/bin/bash
# Update .env.local with new Supabase instance credentials

set -e

echo "🔄 Updating .env.local with new Supabase credentials..."

# Load migration env
source "$(dirname "$0")/.env.migration"

ENV_FILE="$(dirname "$0")/../../.env.local"
BACKUP_FILE="$(dirname "$0")/backups/.env.local.backup.$(date +%Y%m%d_%H%M%S)"

# Create backup
echo "💾 Creating backup: $BACKUP_FILE"
mkdir -p "$(dirname "$BACKUP_FILE")"
cp "$ENV_FILE" "$BACKUP_FILE"

# Update env file
echo "✏️  Updating environment variables..."

# Create temp file with new values
cat > "$ENV_FILE" << EOF
NEXT_PUBLIC_SUPABASE_URL=https://$NEW_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY=$NEW_SUPABASE_ANON_KEY
ISBNDB_API_KEY=$(grep ISBNDB_API_KEY "$BACKUP_FILE" | cut -d '=' -f2)
EOF

echo "✅ .env.local updated successfully!"
echo ""
echo "Previous configuration backed up to:"
echo "  $BACKUP_FILE"
echo ""
echo "New configuration:"
cat "$ENV_FILE"
echo ""
echo "🔄 Please restart your development server for changes to take effect"
