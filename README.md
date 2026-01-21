# AI Tools

A shared internal repository for AI-related tooling and patterns that are broadly useful across the team.

## Purpose

Several of us have been independently building AI-assisted tooling and workflows - config files, command prompts, scripts, hooks, integrations, and conventions that meaningfully improve day-to-day productivity. Most of this knowledge currently lives in personal setups, private notes, or one-off experiments.

This repository serves as a common home for these tools and patterns, making it easier to share what works and build on each other's discoveries.

## What's Here

### Claude Code Configuration

The `claude/` directory contains shareable configurations for [Claude Code](https://docs.anthropic.com/en/docs/build-with-claude/claude-code):

- **`commands/`** - Custom slash commands that can be installed to `~/.claude/commands/`
  - `/allowlist` - Easily add bash commands to your permissions allowlist
  - `/pr-review` - Review GitHub PRs and generate structured review documents
  - `/prep` - Read the current Linear ticket based on directory name
  - `/publish` - Commit, push, and create PRs following project conventions
  - `/standup` - Summarize today's work for standup
  - `/synopsis` - Log session summaries for later reference
  - `/ticket` - Create Linear tickets from conversation context

- **`hooks/`** - Hook scripts for Claude Code events
  - `notify.sh` - Send Slack notifications when Claude needs attention

- **`examples/`** - Example configuration files
  - `settings.json` - Recommended permissions allowlist
  - `mcp-servers.json` - MCP server configurations (Linear, CircleCI, MongoDB, etc.)
  - `hooks-config.json` - Hook configuration for settings.json

### Standalone Tools

The `tools/` directory contains self-contained utilities:

- **`env-backup/`** - Backup utility for `.env` files with hash-based change detection
  - Keeps rolling backups of `.env` files and directories
  - Detects changes using SHA-256 hashing (skips unchanged files)
  - Archives previous versions with timestamps
  - Includes macOS launchd installer for daily automated backups
  - See [tools/env-backup/README.md](tools/env-backup/README.md) for setup

## Installation

To use any of these tools, copy them to your Claude Code configuration directory:

```bash
# Copy commands
cp -r claude/commands/* ~/.claude/commands/

# Copy hooks (and make executable)
cp claude/hooks/* ~/.claude/hooks/
chmod +x ~/.claude/hooks/*.sh

# Merge example settings into your settings.json
# (Manual merge recommended - don't overwrite your existing settings)
```

For MCP servers, merge the configurations into your `~/.claude.json` file, replacing placeholder tokens with your actual credentials.

## Contributing

Found a useful workflow? Built a helpful command? Please contribute!

1. Add your tool to the appropriate directory
2. Include clear documentation (README or inline comments)
3. Remove any personal information or secrets
4. Submit a PR

## Resources

- [Claude Code Documentation](https://docs.anthropic.com/en/docs/build-with-claude/claude-code)
- [MCP (Model Context Protocol)](https://modelcontextprotocol.io/)
