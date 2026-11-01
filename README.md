# GitHub Actions for OpenChamber

An OpenChamber panel with the GitHub Actions workflow runs of the open project: runs for the current branch or all branches, jobs with their failing step and error annotations, re-run (all, failed, single job), cancel, open on GitHub, and **Debug in session**, which starts an OpenChamber session with the failure and tells the agent to read the log with `gh run view --log-failed`.

The panel has no service and stores no token. The token lives in OpenChamber's Integrations, and OpenChamber itself calls `https://api.github.com`.

## Install

1. OpenChamber → **Settings → Extensions** → **Folder, ZIP, or URL** → paste `https://github.com/S0ya13/openchamber-github-actions` → **Add**, and approve the permissions. The built `panel/main.js` is committed, so nothing needs building. Append a tag (`#v0.1.0`) to pin a version.
2. **Settings → Integrations → GitHub Actions** → paste a token:
   - classic (full features): the `repo` scope.
   - fine-grained: resource owner = the account or org that owns the repos, repository access to those repos, permissions **Actions: Read and write** and **Metadata: Read**. Actions read-only is enough without the re-run and cancel buttons. An org may need to approve fine-grained tokens first. GitHub does not let fine-grained tokens read check runs, so the error annotations under failed jobs stay empty; everything else works.
   - quick test: the output of `gh auth token`.
3. Open the rail icon. The repo comes from the project's GitHub remote (`origin` first); set **Repository override** on the Integrations card when the remote is not on github.com.

## Limits

- No log viewer: GitHub serves job logs through a redirect to blob storage, and OpenChamber's extension requests do not follow redirects. **Log** opens the job on GitHub; **Debug in session** hands the log to an agent.
- Polls every 10 s while a run is active and every 60 s otherwise, only while the panel is visible.
- No background watch or notifications.

## Develop

`bun run check` runs the typecheck, the build and the tests. Bump `version` in `package.json` (and the `?v=` in `panel/index.html`) so OpenChamber reloads the extension.
