/** Pure helpers: git metadata parsing and GitHub Actions formatting. No host calls here. */
import { parse } from 'yaml';

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

export type DispatchInput = {
  name: string;
  description: string;
  type: 'string' | 'choice' | 'boolean' | 'number' | 'environment';
  required: boolean;
  default: string;
  options: string[];
};

/**
 * The inputs of a workflow that can be started by hand, or null when its `on:`
 * has no `workflow_dispatch`. Accepts the string, list and map forms of `on:`.
 */
export function dispatchInputs(yaml: string): DispatchInput[] | null {
  let on: unknown;
  try {
    on = (parse(yaml) as { on?: unknown } | null)?.on;
  } catch {
    return null;
  }
  if (on === 'workflow_dispatch') return [];
  if (Array.isArray(on)) return on.includes('workflow_dispatch') ? [] : null;
  if (!on || typeof on !== 'object' || !('workflow_dispatch' in on)) return null;
  const inputs = ((on as Record<string, { inputs?: unknown } | null>).workflow_dispatch?.inputs ?? {}) as Record<string, Record<string, unknown> | null>;
  return Object.entries(inputs).map(([name, spec]) => {
    const type = String(spec?.type ?? 'string');
    return {
      name,
      description: String(spec?.description ?? ''),
      type: (['choice', 'boolean', 'number', 'environment'].includes(type) ? type : 'string') as DispatchInput['type'],
      required: spec?.required === true,
      default: spec?.default == null ? '' : String(spec.default),
      options: Array.isArray(spec?.options) ? spec.options.map(String) : [],
    };
  });
}

export type LogLine = { text: string; kind: 'plain' | 'error' | 'warning' | 'group' | 'command' };

/**
 * A job log as GitHub serves it: every line led by an ISO timestamp, ANSI colors,
 * and `##[error]` / `##[warning]` / `##[group]` workflow markers. Drops the
 * timestamp, colors and `##[endgroup]`, and tags each line by its marker.
 */
export function parseLog(raw: string): LogLine[] {
  const lines: LogLine[] = [];
  for (const rawLine of raw.replace(/^﻿/, '').split(/\r?\n/)) {
    let text = rawLine.replace(/^\d{4}-\d\d-\d\dT[\d:.]+Z ?/, '').replace(/\x1b\[[0-9;]*[A-Za-z]/g, '');
    let kind: LogLine['kind'] = 'plain';
    const marker = /^##\[(\w+)\]/.exec(text);
    if (marker) {
      const name = marker[1].toLowerCase();
      if (name === 'endgroup') continue;
      text = text.slice(marker[0].length);
      if (name === 'error' || name === 'warning' || name === 'group' || name === 'command') kind = name;
    } else if (text.startsWith('[command]')) {
      text = text.slice('[command]'.length);
      kind = 'command';
    }
    lines.push({ text, kind });
  }
  while (lines.length && !lines[lines.length - 1].text) lines.pop();
  return lines;
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
