/** Pure helpers: git metadata parsing and GitHub Actions formatting. No host calls here. */

export type Repo = { owner: string; name: string };

export type Tone = 'neutral' | 'primary' | 'success' | 'warning' | 'error' | 'info';

/** `https://github.com/o/r(.git)`, `git@github.com:o/r.git`, `ssh://git@github.com/o/r`. */
export function parseGitHubRemote(url: string): Repo | null {
  const match = /^(?:https?:\/\/(?:[^@/\s]+@)?github\.com\/|(?:ssh:\/\/)?git@github\.com[:/])([\w.-]+)\/([\w.-]+?)(?:\.git)?\/?$/.exec(
    url.trim(),
  );
  return match ? { owner: match[1], name: match[2] } : null;
}

/** `owner/name` typed by the user in the Repository setting. */
export function parseRepoSetting(value: string | undefined): Repo | null {
  const match = /^\s*([\w.-]+)\/([\w.-]+)\s*$/.exec(value ?? '');
  return match ? { owner: match[1], name: match[2] } : null;
}

/** The GitHub repo of `.git/config`: `origin` first, then any other GitHub remote. */
export function repoFromGitConfig(config: string): Repo | null {
  const remotes: Array<{ name: string; url: string }> = [];
  let current: string | null = null;
  for (const line of config.split(/\r?\n/)) {
    const section = /^\s*\[remote\s+"([^"]+)"\]/.exec(line);
    if (section) {
      current = section[1];
      continue;
    }
    if (/^\s*\[/.test(line)) {
      current = null;
      continue;
    }
    const url = current ? /^\s*url\s*=\s*(.+?)\s*$/.exec(line) : null;
    if (current && url) remotes.push({ name: current, url: url[1] });
  }
  remotes.sort((a, b) => Number(b.name === 'origin') - Number(a.name === 'origin'));
  for (const remote of remotes) {
    const repo = parseGitHubRemote(remote.url);
    if (repo) return repo;
  }
  return null;
}

/** `ref: refs/heads/main` → `main`; a detached HEAD → null. */
export function branchFromHead(head: string): string | null {
  return /^\s*ref:\s*refs\/heads\/(.+?)\s*$/m.exec(head)?.[1] ?? null;
}

/**
 * A linked worktree's `.git` is a file `gitdir: <main>/.git/worktrees/<name>`.
 * Returns that gitdir and the shared `.git` holding the config.
 */
export function linkedGitDirs(dotGitFile: string): { gitDir: string; commonDir: string } | null {
  const gitDir = /^gitdir:\s*(.+?)\s*$/m.exec(dotGitFile)?.[1];
  if (!gitDir) return null;
  const at = gitDir.lastIndexOf('/worktrees/');
  return { gitDir, commonDir: at < 0 ? gitDir : gitDir.slice(0, at) };
}

/** A run's or job's `status` + `conclusion` as one label and tone. */
export function statusOf(status: string, conclusion: string | null): { label: string; tone: Tone; active: boolean } {
  if (status !== 'completed') {
    if (status === 'in_progress') return { label: 'running', tone: 'info', active: true };
    if (status === 'waiting') return { label: 'waiting', tone: 'warning', active: true };
    return { label: status.replace(/_/g, ' '), tone: 'neutral', active: true };
  }
  switch (conclusion) {
    case 'success':
      return { label: 'success', tone: 'success', active: false };
    case 'failure':
    case 'timed_out':
    case 'startup_failure':
      return { label: conclusion.replace(/_/g, ' '), tone: 'error', active: false };
    case 'action_required':
      return { label: 'action required', tone: 'warning', active: false };
    default:
      return { label: (conclusion ?? 'completed').replace(/_/g, ' '), tone: 'neutral', active: false };
  }
}

/** `1h 2m`, `3m 4s`, `5s`. */
export function formatDuration(ms: number): string {
  const total = Math.max(0, Math.round(ms / 1000));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  if (h) return `${h}h ${m}m`;
  if (m) return `${m}m ${s}s`;
  return `${s}s`;
}

/** Elapsed time between two ISO stamps; a missing end means still running. */
export function durationBetween(start: string | null | undefined, end: string | null | undefined, now = Date.now()): string {
  if (!start) return '';
  const from = Date.parse(start);
  const to = end ? Date.parse(end) : now;
  return Number.isFinite(from) && Number.isFinite(to) ? formatDuration(to - from) : '';
}

/** `just now`, `5m ago`, `3h ago`, `2d ago`. */
export function timeAgo(iso: string, now = Date.now()): string {
  const seconds = Math.round((now - Date.parse(iso)) / 1000);
  if (!Number.isFinite(seconds)) return '';
  if (seconds < 60) return 'just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}
