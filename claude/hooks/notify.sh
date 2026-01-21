#!/bin/bash

# Claude Code notification hook - plays sound + sends Slack message
#
# Setup:
# 1. Create a Slack bot and get an OAuth token with chat:write permission
# 2. Find your Slack user ID (click your profile > copy member ID)
# 3. Find your target channel ID (right-click channel > copy link, ID is at the end)
# 4. Set the variables below or use environment variables

SLACK_BOT_TOKEN="${SLACK_BOT_TOKEN:-your-bot-token-here}"
SLACK_CHANNEL="${SLACK_CHANNEL:-your-channel-id}"
SLACK_USER="${SLACK_USER:-your-user-id}"

# Read hook input from stdin
INPUT=$(cat)
NOTIFICATION_TYPE=$(echo "$INPUT" | jq -r '.notification_type // "unknown"')
MESSAGE=$(echo "$INPUT" | jq -r '.message // "Claude needs your attention"')

# Play sound (macOS) - comment out if not on macOS
afplay /System/Library/Sounds/Glass.aiff &

# Send Slack notification via bot
if [ "$SLACK_BOT_TOKEN" != "your-bot-token-here" ]; then
  curl -s -X POST "https://slack.com/api/chat.postMessage" \
    -H "Authorization: Bearer $SLACK_BOT_TOKEN" \
    -H "Content-Type: application/json" \
    -d "{\"channel\": \"$SLACK_CHANNEL\", \"text\": \"<@$SLACK_USER> $MESSAGE\"}" >/dev/null 2>&1 &
fi

exit 0
