---
allowed-tools: mcp__linear-server__get_issue, Bash
description: Read the Linear ticket from the current directory name and summarize it
---

# Read Current Ticket

When the user invokes this command, do the following:

1. **Get the directory name**: Run `basename "$(pwd)"` to get the current directory name.

2. **Parse the ticket identifier**: The directory name should be a Linear ticket ID in lowercase (e.g., `eng-2031`). Convert it to uppercase for the Linear API (e.g., `ENG-2031`).

3. **Fetch the ticket**: Use `mcp__linear-server__get_issue` with the uppercase identifier to retrieve the ticket details.

4. **Summarize the ticket**: Present a concise summary including:
   - **Title**: The ticket title
   - **Status**: Current state
   - **Description**: A brief summary of what needs to be done
   - **Key details**: Any important acceptance criteria, links, or context

5. **Confirm readiness**: End with a brief statement confirming you have context and are ready to help with the ticket.

## Notes
- If the directory name doesn't look like a ticket ID, inform the user
- If the ticket is not found in Linear, report the error clearly
- Keep the summary concise - the goal is to show you have context, not to repeat the entire ticket
