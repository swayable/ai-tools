---
allowed-tools: mcp__linear-server__create_issue, mcp__linear-server__list_teams, Bash
description: Create a Linear ticket and optionally set up a workspace
---

# Create Ticket

When the user invokes this command, create a Linear ticket from the conversation context.

## Steps

1. **Parse the request**: The user may provide a title, description, or just a general idea. Ask clarifying questions only if truly ambiguous.

2. **Create the Linear ticket**:
   - Use the `mcp__linear-server__create_issue` tool
   - Team: Use the appropriate team (ask if unclear)
   - Title: Concise, action-oriented
   - Description: Include relevant context from the conversation

3. **Extract the ticket identifier**: After creating the ticket, note the issue identifier (e.g., `ENG-2020`).

4. **Report back**: Tell the user:
   - The Linear ticket URL
   - The ticket identifier

## Optional: Workspace Setup

If you have a workspace setup script (e.g., `ticket-workspace`), you can optionally set up a working directory:
```bash
ticket-workspace <identifier>
```

This is project-specific - customize based on your team's conventions.

## Notes
- If unsure about the team, list available teams using `mcp__linear-server__list_teams`
- Keep ticket descriptions focused but include enough context for someone unfamiliar with the conversation
