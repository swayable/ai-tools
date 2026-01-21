#!/bin/bash
set -e

SYMLINK_PATH="$HOME/bin/env-backup"
PLIST_NAME="com.env-backup.daily"
PLIST_PATH="$HOME/Library/LaunchAgents/$PLIST_NAME.plist"

echo "env-backup uninstaller (macOS)"
echo "=============================="
echo ""

# Unload and remove launchd job
if [ -f "$PLIST_PATH" ]; then
    launchctl unload "$PLIST_PATH" 2>/dev/null || true
    rm "$PLIST_PATH"
    echo "✓ Removed launchd job"
else
    echo "- No launchd job found"
fi

# Remove symlink
if [ -L "$SYMLINK_PATH" ]; then
    rm "$SYMLINK_PATH"
    echo "✓ Removed symlink: $SYMLINK_PATH"
else
    echo "- No symlink found at $SYMLINK_PATH"
fi

echo ""
echo "Uninstall complete!"
echo ""
echo "Note: Your config.json and backup data were not removed."
