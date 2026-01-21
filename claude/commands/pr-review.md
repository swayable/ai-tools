---
allowed-tools: Bash, Read, Write, Glob, Grep
description: Review a GitHub PR and generate a detailed review markdown file
---

# PR Review

Review a GitHub Pull Request and generate a detailed review document.

## Input

The user may provide:
- A GitHub PR URL (e.g., `https://github.com/org/repo/pull/123`)
- A PR number with repo context (e.g., `#123` or `123` when in a repo directory)
- Nothing - in which case, prompt for the PR URL or number

If the information is insufficient, ask:
> Which PR would you like me to review? Please provide a GitHub PR URL or PR number.

## Steps

1. **Fetch PR information** using `gh pr view`:
   ```bash
   gh pr view <PR_URL_OR_NUMBER> --json title,body,headRefName,baseRefName,author,files,additions,deletions,url,number,repository
   ```

2. **Get the PR diff**:
   ```bash
   gh pr diff <PR_URL_OR_NUMBER>
   ```

3. **Extract repository and branch names**:
   - REPO: The repository name (without organization), e.g., `swaypi` from `swayable/swaypi`
   - BRANCH: The head branch name (the source branch of the PR)

4. **Review the changes**:
   - Analyze the diff for:
     - Code quality issues
     - Potential bugs or edge cases
     - Security concerns
     - Performance implications
     - Style/consistency issues
     - Missing tests
     - Documentation gaps
   - Consider the PR description and context

5. **Generate the review content**:

   ```markdown
   # PR Review: ${PR_TITLE}

   **PR:** ${PR_URL}
   **Author:** ${AUTHOR}
   **Branch:** ${HEAD_BRANCH} -> ${BASE_BRANCH}
   **Files changed:** ${FILE_COUNT} (+${ADDITIONS}/-${DELETIONS})

   ## Overall Assessment

   **Verdict:** [APPROVE | COMMENT | REQUEST_CHANGES]

   > ${COMPLIMENT_SANDWICH_SUMMARY}

   ## Feedback

   ### ${filename}:${line_number} (if applicable)
   ${feedback_text}

   ### ${filename}:${line_number}
   [nb] ${non_blocking_feedback_text}

   ...
   ```

6. **Write to file** at `~/reviews/${REPO}_${BRANCH}.md`:

   You MUST use the Write tool to save the review. Follow these exact steps:

   a. Set the file path: `~/reviews/${REPO}_${BRANCH}.md`

   b. Check if the file already exists using Read tool

   c. If file EXISTS:
      - Store the existing content
      - Use Write tool with content = NEW_REVIEW + SEPARATOR + EXISTING_CONTENT
      - The SEPARATOR is exactly: 10 blank lines, then `────────────────────────────────────────────────────────────────────────────────`

   d. If file does NOT exist:
      - Use Write tool to create it with just the new review content

   **YOU MUST CALL THE WRITE TOOL.** Do not skip this step. The review is useless if not written to disk.

## Feedback Guidelines

- Start feedback with `[nb]` if it's non-blocking (nice-to-have, style suggestion, minor improvement)
- Omit `[nb]` for blocking issues (bugs, security issues, breaking changes, required fixes)
- Include file and line number when the feedback relates to specific code
- Group feedback by file when multiple comments apply to the same file
- Be specific and actionable - explain what's wrong and suggest a fix

## Summary Guidelines (Compliment Sandwich)

The summary must be a single paragraph of 30 words or less, structured as a compliment sandwich:
1. Start with something genuinely positive about the PR
2. Mention any caveats or concerns (if applicable)
3. End with another positive note or encouragement

Examples:
- "Clean implementation with good test coverage. A few edge cases need handling. Overall solid work that improves the codebase."
- "Great refactor that simplifies the auth flow. Consider adding error logging. Nice attention to backwards compatibility."
- "Well-structured PR with clear commit messages. The API changes look good and documentation is thorough."

## Verdict Criteria

- **APPROVE**: Code is good to merge. May have non-blocking suggestions.
- **COMMENT**: Has questions or suggestions but no blocking issues. Needs author response.
- **REQUEST_CHANGES**: Has blocking issues that must be addressed before merge.

## Output

After writing the review file (you MUST have used the Write tool), report:
- The verdict and summary
- The full path to the generated review file
- Count of blocking vs non-blocking items

If you did not use the Write tool, GO BACK AND DO IT NOW.
