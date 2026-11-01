import { expect, test } from 'bun:test';
import { parseManifestJson } from '@openchamber/sdk/schemas';
import { readFileSync } from 'node:fs';
import {
  branchFromHead,
  durationBetween,
  linkedGitDirs,
  parseGitHubRemote,
  parseRepoSetting,
  repoFromGitConfig,
  statusOf,
} from '../panel/github';

test('manifest parses', () => {
  const result = parseManifestJson(readFileSync(new URL('../package.json', import.meta.url), 'utf8'));
  expect(result.ok ? null : result).toBeNull();
});

test('github remotes', () => {
  const repo = { owner: 'Xentavi', name: 'Website' };
  expect(parseGitHubRemote('https://github.com/Xentavi/Website.git')).toEqual(repo);
  expect(parseGitHubRemote('https://user@github.com/Xentavi/Website')).toEqual(repo);
  expect(parseGitHubRemote('git@github.com:Xentavi/Website.git')).toEqual(repo);
  expect(parseGitHubRemote('ssh://git@github.com/Xentavi/Website.git')).toEqual(repo);
  expect(parseGitHubRemote('https://github.com/o/my.repo')).toEqual({ owner: 'o', name: 'my.repo' });
  expect(parseGitHubRemote('https://gitlab.com/Xentavi/Website.git')).toBeNull();
  expect(parseRepoSetting(' a/b ')).toEqual({ owner: 'a', name: 'b' });
  expect(parseRepoSetting('')).toBeNull();
});

test('git config prefers origin, skips non-github remotes', () => {
  const config = `[core]
\tbare = false
[remote "upstream"]
\turl = git@github.com:up/stream.git
[remote "origin"]
\turl = https://gitlab.com/x/y.git
\tfetch = +refs/heads/*:refs/remotes/origin/*
[branch "main"]
\tremote = origin
`;
  expect(repoFromGitConfig(config)).toEqual({ owner: 'up', name: 'stream' });
  expect(repoFromGitConfig(config.replace('gitlab.com/x/y', 'github.com/me/app'))).toEqual({ owner: 'me', name: 'app' });
  expect(repoFromGitConfig('[core]\n')).toBeNull();
});

test('head and linked worktrees', () => {
  expect(branchFromHead('ref: refs/heads/feature/x\n')).toBe('feature/x');
  expect(branchFromHead('3f2a9c0d1e\n')).toBeNull();
  expect(linkedGitDirs('gitdir: /Users/me/app/.git/worktrees/fix-ci\n')).toEqual({
    gitDir: '/Users/me/app/.git/worktrees/fix-ci',
    commonDir: '/Users/me/app/.git',
  });
  expect(linkedGitDirs('nothing')).toBeNull();
});

test('status and duration', () => {
  expect(statusOf('completed', 'failure')).toEqual({ label: 'failure', tone: 'error', active: false });
  expect(statusOf('in_progress', null)).toEqual({ label: 'running', tone: 'info', active: true });
  expect(statusOf('completed', 'cancelled').tone).toBe('neutral');
  expect(durationBetween('2026-01-01T00:00:00Z', '2026-01-01T00:02:05Z')).toBe('2m 5s');
  expect(durationBetween(null, null)).toBe('');
});
