# Changelog

## 1.0.0 — 2026-11-01

First release.

### Added

- Workflow runs of the open project for the current branch or all branches, remembered per repository, with Load more, adaptive refresh, a freshness indicator and a rate-limit pause. Follows a branch switch in the checkout.
- Jobs of a run with the failing or running step and GitHub's error annotations.
- Log drawer through the local service and the GitHub CLI: errors highlighted, Find in log, Jump to error, Copy.
- Re-run all, re-run failed, re-run one job, cancel, force cancel.
- Run workflow for `workflow_dispatch` workflows, with a form for their inputs.
- Fix in chat and Debug in session for failed runs.
- Failure notifications: a toast and a rail badge when a run on the current branch fails, switchable per repository.
- Work Status section with the newest run of each workflow on the current branch.
