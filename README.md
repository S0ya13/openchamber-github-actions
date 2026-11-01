# GitHub Actions for OpenChamber

An [OpenChamber](https://openchamber.dev) extension that shows the GitHub Actions workflow runs of the project you have open, without leaving the workspace.

## Features

- **Runs.** The workflow runs of the current branch, or of all branches, newest first, with **Load more**. The branch or all choice is remembered per repository. A newest run that is running or failed opens by itself. The list refreshes every 10 s while a run is active and every 60 s otherwise, only while the panel is visible, follows a branch switch in the checkout, and pauses when GitHub rate-limits it.
- **Jobs.** Expand a run into its jobs, with the failing or running step and the error annotations GitHub extracted.
- **Log drawer.** Open any job's log beside the list: workflow markers rendered, errors highlighted, **Find in log** (`Ctrl/Cmd+F`, `Enter` for the next match), **Jump to error**, **Copy**.
- **Actions.** Re-run all jobs, re-run failed jobs, re-run one job, cancel and then force-cancel, and **Run workflow** for workflows with a `workflow_dispatch` trigger on the current branch, with a form for the workflow's inputs (text, number, choice, boolean).
- **Fix in chat.** Puts the failed run, its failed jobs and their errors into the chat box of the session you have open, so the agent that wrote the change fixes it.
- **Debug in session.** Starts a new OpenChamber session with the same failure report, and asks the agent to read the log with `gh run view --log-failed` and find the cause in your checkout.
- **Failure notifications.** When a run on the current branch fails while you are elsewhere, a toast names it and the rail icon gets a badge; opening the panel clears it. The panel (open in the rail) and the Work Status section watch on their own; failures that happened while neither was open are reported the next time one is. Switch it off per repository with **Notify**.
- **Work Status section.** The newest run of each workflow on the current branch, next to the chat. Click one to open the panel.

## Install

The extension needs OpenChamber **1.22 or newer**.

1. **Settings → Extensions** → **Folder, ZIP, or URL** → paste `https://github.com/S0ya13/openchamber-github-actions` → **Add**. Approve the permissions and allow the local service. Installed from the URL, the extension updates itself when the version changes.
2. **Settings → Integrations → GitHub Actions** → paste a GitHub token:
   - classic (full features): the `repo` scope.
   - fine-grained: resource owner = the account or org that owns the repositories, repository access to them, permissions **Actions: Read and write** and **Metadata: Read**. Actions read-only is enough without the re-run, cancel and run buttons. An org may need to approve fine-grained tokens first. GitHub does not let fine-grained tokens read check runs, so the error annotations under failed jobs stay empty.
3. For the log drawer, install the [GitHub CLI](https://cli.github.com) and run `gh auth login`.
4. Open the rail icon. The repository comes from the project's GitHub remote (`origin` first). Set **Repository override** (`owner/name`) on the Integrations card when the remote is not on github.com.

## How it works

- The panel never sees the token. It lives in OpenChamber's Integrations, and OpenChamber itself calls `https://api.github.com`, the only origin the extension may reach.
- Logs go through a small local service, because GitHub serves job logs through a redirect to blob storage and OpenChamber's extension requests do not follow redirects. The service binds loopback only, requires the host-issued bearer on every request, and runs one command: `gh api repos/<owner>/<repo>/actions/jobs/<id>/logs`, using your own `gh` login. Very long logs keep their last 3 MB.
- The extension reads only `.git/config` and `.git/HEAD` (also a linked worktree's), and the workflow files of the open project to find `workflow_dispatch` and its inputs.

## Develop

Development uses [Bun](https://bun.sh).

```sh
bun install
bun run check   # typecheck + build + tests
```

The built `panel/main.js`, `status/main.js` and `service/main.js` are committed, because OpenChamber never compiles an extension. Rebuild and commit them with every source change, and bump `version` in `package.json` (and the `?v=` in both `index.html` files) so OpenChamber reloads the extension.

## License

[MIT](LICENSE)
