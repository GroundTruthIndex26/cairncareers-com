---
name: cloud-session
description: Start or resume cloud-saved Claude Code work on cairncareers-com from any computer. Use when Brooke types /cloud-session, or asks to pick up a session from the cloud, continue work from her other computer, or make sure the current work is saved to the cloud.
---

# Cloud session

Brooke works on this repo from more than one computer. Conversations saved in the cloud live at claude.ai/code under drbrookehouck@gmail.com. Code only survives if it is committed and pushed to GitHub. This skill does both halves: it saves the work in progress and pulls in the newest cloud work.

## Steps

1. **Save first.** Run `git status`. If there are uncommitted changes, show Brooke the list and ask whether to commit and push them. Never discard them.
   - If she says yes, commit on the current branch (branch first if on `main`) and push with `git push -u origin <branch>`.

2. **Fetch the cloud work.** Run `git fetch origin --prune`, then list the most recent branches:
   `git for-each-ref --sort=-committerdate refs/remotes/origin --format='%(committerdate:relative)  %(refname:short)  %(subject)' --count=10`
   Cloud sessions push to branches named `origin/claude/...`.

3. **Let Brooke pick.** Show her the list and ask which branch to continue on. The top one is the most recent. Check it out with `git checkout <name without origin/>` (git creates a tracking branch), then `git pull`. If there is an open PR for that branch, give her the link.

4. **Tell her how to get the conversation back.** A skill cannot open another conversation by itself. Give her these options:
   - **Browser or Claude app:** open claude.ai/code (or the Code section of the app), signed in as drbrookehouck@gmail.com. Every cloud session is in the list on the left.
   - **Terminal:** exit this session and run `claude --teleport` from this repo folder. It lists her cloud sessions and brings the one she picks, with its conversation and branch, into her local terminal.
   - **Local session on this computer:** exit and run `claude --resume` (or `claude --continue` for the most recent one). Local sessions are saved only on the computer that ran them.

5. **Remind her before she stops.** Anything not pushed stays on this computer only, and a cloud container is deleted after it sits idle. Push before walking away.

## Rules

- Never force-push, reset, or delete branches as part of this skill.
- Follow the repo's CLAUDE.md hard rules (no em dashes).
