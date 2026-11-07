---
inclusion: always
---

# Repository visibility and pre-push safety check

This repo hosts the HoneyCake Bakery website on GitHub Pages (`honeycakebakeryaustin.com`). If the repo is public, anyone can read every pushed file and the full commit history.

## Before every push

Run these checks before `git push` or any other action that publishes commits (pushing a new branch, pushing tags, opening a pull request).

### 1. Check the repository's visibility

1. Get the remote: `git remote get-url origin`.
2. Look up visibility:
   - If the GitHub CLI is installed: `gh repo view <owner>/<repo> --json visibility`.
   - Otherwise: `curl -s https://api.github.com/repos/<owner>/<repo>` and read the `"visibility"` and `"private"` fields. An unauthenticated 404 usually means the repo is private.
3. If visibility can't be determined, treat the repo as public.
4. If the repo is private, skip step 2 and push normally.

### 2. If the repo is public, scan what will be pushed

Scan every commit the remote doesn't have yet, not only the working tree:

- Run `git fetch origin`, then `git log --stat origin/<branch>..HEAD` and `git diff origin/<branch>..HEAD`.
- For a new branch with no upstream, compare against the default branch.

Look for:

- **Secrets:** API keys, tokens, passwords, private keys, connection strings, `.env` files, credentials hard-coded in JS or HTML. Some keys are meant to be public (for example a form service's public site key). Flag them anyway and let the user decide.
- **Personal information:** home address, personal phone numbers or emails that aren't already on the public site, customer names, orders, or contact details.
- **Photo location data:** GPS coordinates in new or changed images. On macOS run `mdls -name kMDItemLatitude -name kMDItemLongitude <file>`, or `exiftool -gps:all <file>` if installed. Photos taken at home can reveal the home address.
- **Files that shouldn't be published:** `.DS_Store`, backups, drafts, exports, local-only Kiro files (`*.local.md`), and anything matching `.gitignore` that was force-added.

### 3. Act on the result

- **Something found:** don't push. List each finding with its file path and line or commit, and ask the user how to proceed.
- **A secret is already in pushed history:** tell the user to rotate or revoke it. Deleting it in a new commit doesn't remove it from history.
- **Nothing found:** tell the user in one or two sentences what was checked, then push.

## Never do without asking

- Don't change the repository's visibility. On GitHub Free, making the repo private takes the GitHub Pages site offline.
- Don't rewrite published history (force push, `git filter-repo`, BFG) to remove sensitive data unless the user explicitly asks.
