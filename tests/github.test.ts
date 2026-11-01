import { expect, test } from 'bun:test';
import { parseManifestJson } from '@openchamber/sdk/schemas';
import { readFileSync } from 'node:fs';
import {
  branchFromHead,
  dispatchInputs,
  durationBetween,
  linkedGitDirs,
  parseGitHubRemote,
  parseLog,
  parseRepoSetting,
  repoFromGitConfig,
  statusOf,
} from '../panel/github';
import { handleLog, type GhResult, type GhRunner } from '../service/main';
import { clearUnseen, notifyFailures, type Run } from '../panel/shared';
import type { HostClient } from '@openchamber/sdk';

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

test('workflow_dispatch inputs', () => {
  expect(dispatchInputs('on: workflow_dispatch\n')).toEqual([]);
  expect(dispatchInputs('on: [push, workflow_dispatch]\n')).toEqual([]);
  expect(dispatchInputs('on: push\n# workflow_dispatch: later\n')).toBeNull();
  expect(dispatchInputs('on:\n  push:\n')).toBeNull();
  expect(dispatchInputs('on: [unclosed\n')).toBeNull();
  const yaml = `on:
  push:
  workflow_dispatch:
    inputs:
      environment:
        description: Where to deploy
        required: true
        type: choice
        options: [staging, production]
        default: staging
      dry_run:
        type: boolean
        default: false
      note:
`;
  expect(dispatchInputs(yaml)).toEqual([
    { name: 'environment', description: 'Where to deploy', type: 'choice', required: true, default: 'staging', options: ['staging', 'production'] },
    { name: 'dry_run', description: '', type: 'boolean', required: false, default: 'false', options: [] },
    { name: 'note', description: '', type: 'string', required: false, default: '', options: [] },
  ]);
});

test('log parsing', () => {
  const raw = [
    '﻿2026-11-01T12:27:18.6735427Z Current runner version',
    '2026-11-01T12:27:18.6746573Z ##[group]Run tests',
    '2026-11-01T12:27:19.0000000Z [command]/usr/bin/git version',
    '2026-11-01T12:27:19.1000000Z \x1b[31mred\x1b[0m text',
    '2026-11-01T12:27:19.2000000Z ##[endgroup]',
    '2026-11-01T12:27:19.3000000Z ##[error]Process completed with exit code 1.',
    '',
  ].join('\n');
  expect(parseLog(raw)).toEqual([
    { text: 'Current runner version', kind: 'plain' },
    { text: 'Run tests', kind: 'group' },
    { text: '/usr/bin/git version', kind: 'command' },
    { text: 'red text', kind: 'plain' },
    { text: 'Process completed with exit code 1.', kind: 'error' },
  ]);
});

const gh = (result: Partial<GhResult>, calls: string[][] = []): GhRunner => async (args) => {
  calls.push(args);
  return { code: 0, stdout: '', stderr: '', missing: false, truncated: false, ...result };
};
const query = (repo: string, job: string) => new URLSearchParams({ repo, job });

test('log service answers', async () => {
  expect((await handleLog(query('o/r', 'x'), gh({}))).status).toBe(400);
  expect((await handleLog(query('o/r;rm', '1'), gh({}))).status).toBe(400);
  const calls: string[][] = [];
  const ok = await handleLog(query('o/r', '42'), gh({ stdout: 'log' }, calls));
  expect(ok).toEqual({ status: 200, body: JSON.stringify({ text: 'log', truncated: false }) });
  expect(calls[0]).toEqual(['api', '--allow-escape-sequences', 'repos/o/r/actions/jobs/42/logs']);
  expect(JSON.parse((await handleLog(query('o/r', '42'), gh({ stdout: 'partial\nrest', truncated: true }))).body).text).toBe('rest');
  expect((await handleLog(query('o/r', '42'), gh({ code: null, missing: true }))).status).toBe(424);
  expect((await handleLog(query('o/r', '42'), gh({ code: 1, stdout: '<Code>BlobNotFound</Code>', stderr: 'gh: HTTP 404' }))).status).toBe(404);
  expect((await handleLog(query('o/r', '42'), gh({ code: 4, stderr: 'To get started with GitHub CLI, please run:  gh auth login' }))).status).toBe(401);
});

test('log service falls back on old gh', async () => {
  const calls: string[][] = [];
  let first = true;
  const runner: GhRunner = async (args) => {
    calls.push(args);
    if (first) return (first = false), { code: 1, stdout: '', stderr: 'unknown flag: --allow-escape-sequences', missing: false, truncated: false };
    return { code: 0, stdout: 'log', stderr: '', missing: false, truncated: false };
  };
  expect((await handleLog(query('o/r', '7'), runner)).status).toBe(200);
  expect(calls[1]).toEqual(['api', 'repos/o/r/actions/jobs/7/logs']);
});

test('failure notifications toast each new failure once', async () => {
  const store = new Map<string, unknown>();
  const toasts: string[] = [];
  const badges: Array<number | null> = [];
  const host = {
    storage: {
      get: async (key: string) => store.get(key),
      set: async (key: string, value: unknown) => void store.set(key, value),
    },
    toast: async ({ message }: { message: string }) => void toasts.push(message),
    setBadge: async (count: number | null) => void badges.push(count),
  } as unknown as HostClient;
  const run = (id: number, conclusion: string | null, updated: string): Run =>
    ({ id, name: 'CI', run_number: id, status: conclusion ? 'completed' : 'in_progress', conclusion, updated_at: updated }) as Run;

  // History never toasts: the first look only sets the watermark.
  await notifyFailures(host, 'o/r', 'main', [run(1, 'failure', '2026-11-01T10:00:00Z')]);
  expect(toasts).toEqual([]);

  const runs = [run(3, 'failure', '2026-11-01T11:00:00Z'), run(2, null, '2026-11-01T10:30:00Z'), run(1, 'failure', '2026-11-01T10:00:00Z')];
  await notifyFailures(host, 'o/r', 'main', runs);
  await notifyFailures(host, 'o/r', 'main', runs);
  expect(toasts).toEqual(['CI #3 failed on main (o/r)']);
  expect(badges).toEqual([1]);

  // The visible panel moves the watermark without a toast.
  await notifyFailures(host, 'o/r', 'main', [run(4, 'failure', '2026-11-01T12:00:00Z'), ...runs], true);
  expect(toasts).toHaveLength(1);
  await clearUnseen(host, 'o/r');
  expect(store.get('unseen:o/r')).toBe(0);
  expect(badges.at(-1)).toBeNull();
});
