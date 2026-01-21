#!/bin/bash
set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
BACKUP_SCRIPT="$SCRIPT_DIR/backup.js"
SYMLINK_PATH="$HOME/bin/env-backup"
PLIST_NAME="com.env-backup.daily"
PLIST_PATH="$HOME/Library/LaunchAgents/$PLIST_NAME.plist"

echo "env-backup installer (macOS)"
echo "============================"
echo ""

# Check for node
if ! command -v node &> /dev/null; then
    echo "Error: node is not installed or not in PATH"
    exit 1
fi

# Copy example config if config.json doesn't exist
CONFIG_FILE="$SCRIPT_DIR/config.json"
EXAMPLE_CONFIG="$SCRIPT_DIR/config.example.json"
if [ ! -f "$CONFIG_FILE" ]; then
    if [ -f "$EXAMPLE_CONFIG" ]; then
        cp "$EXAMPLE_CONFIG" "$CONFIG_FILE"
        echo "✓ Created config.json from config.example.json"
        echo "  ⚠ Edit config.json to add your backup paths before running"
    else
        echo "⚠ No config.example.json found - you'll need to create config.json manually"
    fi
else
    echo "✓ config.json already exists"
fi

# Make script executable
chmod +x "$BACKUP_SCRIPT"
echo "✓ Made backup.js executable"

# Create ~/bin and symlink
mkdir -p "$HOME/bin"
ln -sf "$BACKUP_SCRIPT" "$SYMLINK_PATH"
echo "✓ Created symlink: $SYMLINK_PATH"

# Check if ~/bin is in PATH
if [[ ":$PATH:" != *":$HOME/bin:"* ]]; then
    echo ""
    echo "⚠ ~/bin is not in your PATH. Add this to your ~/.zshrc or ~/.bashrc:"
    echo ""
    echo '  export PATH="$HOME/bin:$PATH"'
    echo ""
fi

# Create launchd plist
cat > "$PLIST_PATH" << EOF
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>$PLIST_NAME</string>
    <key>ProgramArguments</key>
    <array>
        <string>/bin/bash</string>
        <string>-l</string>
        <string>-c</string>
        <string>$BACKUP_SCRIPT</string>
    </array>
    <key>StartCalendarInterval</key>
    <dict>
        <key>Hour</key>
        <integer>9</integer>
        <key>Minute</key>
        <integer>0</integer>
    </dict>
    <key>StandardOutPath</key>
    <string>$SCRIPT_DIR/backup.log</string>
    <key>StandardErrorPath</key>
    <string>$SCRIPT_DIR/backup.log</string>
    <key>WorkingDirectory</key>
    <string>$SCRIPT_DIR</string>
</dict>
</plist>
EOF
echo "✓ Created launchd plist: $PLIST_PATH"

# Load the launchd job (unload first if exists)
launchctl unload "$PLIST_PATH" 2>/dev/null || true
launchctl load "$PLIST_PATH"
echo "✓ Loaded launchd job (runs daily at 9:00 AM)"

echo ""
echo "Installation complete!"
echo ""
echo "Commands:"
echo "  env-backup                    Run backup manually"
echo "  launchctl start $PLIST_NAME   Trigger backup now"
echo "  launchctl list | grep env     Check if job is loaded"
echo ""
echo "To uninstall, run: ./uninstall.sh"
