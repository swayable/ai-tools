---
allowed-tools: Bash, Read
description: Summarize today's work for standup preparation
---

# Standup Summary

Generate a summary of today's work for the daily standup.

## Steps

1. **Read today's session synopses** (if any):
   ```bash
   DATE=$(date +%Y-%m-%d)
   SYNOPSIS_DIR="$HOME/synopsis"
   SYNOPSIS_FILE="$SYNOPSIS_DIR/$DATE.md"
   if [ -f "$SYNOPSIS_FILE" ]; then
     cat "$SYNOPSIS_FILE"
   fi
   ```
   This gives you a log of Claude sessions from today - use this as primary input.

2. **Find today's git activity** across repositories:
   ```bash
   # Check repos in ~/src - adjust paths as needed for your setup
   for repo in ~/src/*; do
     if [ -d "$repo/.git" ] || [ -f "$repo/.git" ]; then
       echo "=== $repo ==="
       git -C "$repo" log --oneline --since="midnight" --author="$(git config user.email)" 2>/dev/null
     fi
   done
   ```

3. **Check Linear for recently updated issues**:
   - Use `mcp__linear-server__list_issues` with `assignee: "me"` and `updatedAt: "-P1D"` (last 24 hours)
   - Note status changes, new comments, completed items

4. **Check GitHub for merged/updated PRs**:
   ```bash
   # Get the org name from git remote if available
   gh search prs --author @me --state open --state merged --limit 20 --json number,title,state,updatedAt,repository
   ```

5. **Synthesize all sources**: The final summary must include ALL work from ALL sources:

   - **Synopsis logs** provide context and detail for Claude-assisted work
   - **Git commits** are ground truth - every commit today represents work done
   - **Linear issues** show the bigger picture
   - **GitHub PRs** PR updates are work; merged PRs are completed work

   Cross-reference carefully:
   - For each git commit, check if it's covered in a synopsis. If not, add it to the summary.
   - For each merged/updated PR today, ensure it appears in the summary.
   - Don't assume synopsis logs are complete - they only exist if `/synopsis` was run.

5. **Format the summary** for standup:

   **${TODAY:EEEE, MMM d}**

   Today I:
   - [Completed items - issues closed, PRs merged, sessions completed]
   - [In progress - what you worked on, current state]

   Next I will:
   - [Infer from open issues, "Next" items in synopses, and recent context]

   Blockers:
   - [Any issues noted, or "None"]

## Output Style
- Concise bullet points
- Reference issue numbers (e.g., #42) when applicable
- Focus on outcomes, not activity
- Keep it under 2 minutes of speaking time
