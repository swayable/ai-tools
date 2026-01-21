---
allowed-tools: Read, Edit
description: Add commands to the bash permissions allowlist
---

# Manage Bash Permissions Allowlist

When the user invokes `/allowlist`, parse their arguments and update `~/.claude/settings.json`.

## Usage

```
/allowlist add <command> <subcommand1>, <subcommand2>, ...
```

**Examples:**
- `/allowlist add gh list, compare, diff` → adds `Bash(gh list:*)`, `Bash(gh compare:*)`, `Bash(gh diff:*)`
- `/allowlist add docker ps, images, inspect` → adds `Bash(docker ps:*)`, `Bash(docker images:*)`, `Bash(docker inspect:*)`
- `/allowlist add python --version` → adds `Bash(python --version:*)`

## Instructions

1. **Parse the arguments**: Extract the base command and the comma-separated subcommands/flags from `$ARGUMENTS`.

2. **Read the current settings**: Read `~/.claude/settings.json` and parse the existing `permissions.allow` array.

3. **Generate new entries**: For each subcommand, create an entry in the format `Bash(<command> <subcommand>:*)`.

4. **Check for duplicates**: Skip any entries that already exist in the allowlist.

5. **Update the file**: Add the new entries to the `permissions.allow` array and write back to `~/.claude/settings.json`. Maintain the existing formatting (entries on separate lines).

6. **Report results**: Tell the user which entries were added and which were skipped (if duplicates).

## Notes
- If no arguments provided, show usage help
- Preserve all existing entries in the allowlist
- Handle edge cases like trailing commas or extra spaces in the input
