---
allowed-tools: Bash, Read, Glob
description: Commit, push, and create a PR following project rules
---

# Publish Changes

When the user invokes `/publish`, commit all changes, push to remote, and create a PR.

## Steps

1. **Read project rules**: Look for `.claude/rules/` or `.claude/CLAUDE.md` in the current directory or parent directories. Read any rules related to:
   - Commit message format (e.g., conventional commits)
   - PR creation process
   - Branch naming conventions

2. **Check status**: Run `git status` to see what needs to be committed. If there are no changes, inform the user and stop.

3. **Commit**:
   - Stage all changes
   - Create a commit message following the project's commit rules
   - If no commit rules are found, use conventional commit format as a fallback

4. **Push**:
   - Check if the current branch has an upstream: `git rev-parse --abbrev-ref @{upstream}`
   - If no upstream, push with: `git push -u origin HEAD`
   - If upstream exists, push with: `git push`

5. **Create PR**:
   - Follow the project's PR creation rules
   - If no PR rules are found, use `gh pr create` with a sensible title and body based on the commits

## Notes
- If any step fails, stop and report the error
- Do not force push
- Ask for confirmation before creating the PR if the diff is large
