---
allowed-tools: Bash, Read, Write
description: Summarize this session and log it for standup
---

# Session Synopsis

When the user invokes `/synopsis`, summarize what was accomplished in this session and write it to a log file.

## Steps

1. **Reflect on the session**: Review what was discussed and accomplished. Consider:
   - What task(s) did the user request?
   - What was implemented, fixed, or changed?
   - What decisions were made?
   - What's the current state / what's left to do?

2. **Generate the synopsis**: Create a concise summary with:
   - **Date/time**: Current timestamp
   - **Working directory**: Where the session took place
   - **Summary**: 2-3 sentence overview
   - **Accomplishments**: Bullet points of what was done
   - **Decisions**: Any notable choices made
   - **Next steps**: What remains (if anything)

3. **Determine the log file path**:
   ```bash
   DATE=$(date +%Y-%m-%d)
   LOG_DIR="$HOME/synopsis"
   LOG_FILE="$LOG_DIR/$DATE.md"
   ```

4. **Ensure the directory exists**:
   ```bash
   mkdir -p $LOG_DIR
   ```

5. **Write to the log file**:
   - Check if the file already exists (multiple sessions per day)
   - If it exists, append a separator and the new synopsis
   - If not, create it with the new synopsis

   Format:
   ```markdown
   ## HH:MM - <brief title>

   **Directory:** /path/to/working/dir

   <summary paragraph>

   **Done:**
   - Bullet point 1
   - Bullet point 2

   **Decisions:**
   - Decision 1 (if any)

   **Next:**
   - Next step 1 (if any)

   ---
   ```

6. **Report back**: Confirm the synopsis was written and show the file path.

## Notes
- Keep it concise - this is for standup, not documentation
- Focus on outcomes, not process
- If the session was just exploration/questions with no concrete output, note that
- Multiple sessions per day are separated by `---`
