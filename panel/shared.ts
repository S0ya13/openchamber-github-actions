/** What the panel and the Work Status section share: GitHub types, the API call and repo resolution. */
import { HostRequestError, type GuestSettings, type HostClient } from '@openchamber/sdk';
import { branchFromHead, linkedGitDirs, parseRepoSetting, repoFromGitConfig, statusOf, type DispatchInput, type Repo } from './github';

export const PANEL_ID = 'github-actions';

export type Run = {
  id: number;
  workflow_id: number;
  name: string;
  display_title: string;
  run_number: number;
  run_attempt: number;
  event: string;
  status: string;
  conclusion: string | null;
  head_branch: string | null;
  head_sha: string;
  html_url: string;
  created_at: string;
  updated_at: string;
  run_started_at?: string;
};

export type Step = { name: string; number: number; status: string; conclusion: string | null };

export type Job = {
  id: number;
  name: string;
  status: string;
  conclusion: string | null;
  started_at: string | null;
  completed_at: string | null;
  html_url: string;
  steps?: Step[];
};

export type Annotation = { path: string; start_line: number; annotation_level: string; message: string };

export type Workflow = { id: number; name: string; path: string; state: string };

export type DispatchableWorkflow = Workflow & { inputs: DispatchInput[] };

export class ApiError extends Error {
  constructor(readonly status: number, message: string) {
    super(message);
  }
}

export const isRateLimit = (error: unknown) =>
  error instanceof ApiError && (error.status === 429 || (error.status === 403 && /rate limit/i.test(error.message)));

export function createApi(host: HostClient) {
  return async function api<T>(method: 'GET' | 'POST', path: string, query?: Record<string, string>, body?: unknown): Promise<T> {
    const result = await host.request({ method, path, query, ...(body === undefined ? {} : { body: JSON.stringify(body) }) });
    if (result.status >= 300) {
      let message = `GitHub answered ${result.status}.`;
      try {
        message = (JSON.parse(result.body) as { message?: string }).message ?? message;
      } catch {
        // Non-JSON error body: keep the status line.
      }
      throw new ApiError(result.status, message);
    }
    return (result.body ? JSON.parse(result.body) : null) as T;
  };
}

export function describeError(error: unknown, repo: Repo | null): string {
  if (error instanceof HostRequestError && error.code === 'DISCONNECTED') {
    return 'GitHub refused the token. Add a new one in Settings → Integrations → GitHub Actions.';
  }
  if (isRateLimit(error)) return 'GitHub rate limit reached. Refreshing pauses for a few minutes.';
  if (error instanceof ApiError && error.status === 404 && repo) {
    return `${repo.owner}/${repo.name} is not visible to this token. Give the token access to this repository (fine-grained: Repository access + Actions read).`;
  }
  return error instanceof Error ? error.message : String(error);
}

export const notifyKey = (repo: string) => `notify:${repo}`;
const seenKey = (repo: string, branch: string) => `seen:${repo}:${branch}`;
const unseenKey = (repo: string) => `unseen:${repo}`;

/** Notifications are on unless the user switched them off for this repository. */
export async function notifyEnabled(host: HostClient, repo: string): Promise<boolean> {
  return (await host.storage.get(notifyKey(repo)).catch(() => undefined)) !== false;
}

/**
 * Toast and badge the runs of the watched branch that failed since the last
 * check. The watermark is the newest `updated_at` seen, kept in host storage so
 * the panel and the Work Status section share it and a failure toasts once.
 * The first check only sets the watermark: history never toasts. A `quiet`
 * caller (the visible panel) advances the watermark without telling anyone.
 */
export async function notifyFailures(host: HostClient, repo: string, branch: string, runs: Run[], quiet = false): Promise<void> {
  const seen = await host.storage.get(seenKey(repo, branch)).catch(() => undefined);
  const completed = runs.filter((run) => run.status === 'completed');
  const newest = completed.reduce((max, run) => (run.updated_at > max ? run.updated_at : max), typeof seen === 'string' ? seen : '');
  if (typeof seen !== 'string') {
    await host.storage.set(seenKey(repo, branch), newest || new Date().toISOString()).catch(() => undefined);
    return;
  }
  if (newest === seen) return;
  await host.storage.set(seenKey(repo, branch), newest).catch(() => undefined);
  const failed = completed.filter((run) => run.updated_at > seen && statusOf(run.status, run.conclusion).tone === 'error');
  if (quiet || !failed.length) return;
  const stored = await host.storage.get(unseenKey(repo)).catch(() => undefined);
  const unseen = (typeof stored === 'number' ? stored : 0) + failed.length;
  await host.storage.set(unseenKey(repo), unseen).catch(() => undefined);
  void host.setBadge(unseen).catch(() => undefined);
  const run = failed[0];
  void host.toast({
    kind: 'error',
    message: failed.length === 1 ? `${run.name} #${run.run_number} failed on ${branch} (${repo})` : `${failed.length} workflow runs failed on ${branch} (${repo})`,
  });
}

/** The panel is in front of the user: the failures they could have missed are seen now. */
export async function clearUnseen(host: HostClient, repo: string): Promise<void> {
  await host.storage.set(unseenKey(repo), 0).catch(() => undefined);
  void host.setBadge(null).catch(() => undefined);
}

async function readText(host: HostClient, path: string): Promise<string | null> {
  try {
    return (await host.readFile(path)).content;
  } catch {
    return null;
  }
}

/** Repo and branch of the open project; the Repository setting overrides the remote. */
export async function resolveRepo(host: HostClient, settings: GuestSettings): Promise<{ repo: Repo | null; branch: string | null }> {
  let config = await readText(host, '.git/config');
  let head = await readText(host, '.git/HEAD');
  if (config === null) {
    const dirs = linkedGitDirs((await readText(host, '.git')) ?? '');
    if (dirs) {
      config = await readText(host, `${dirs.commonDir}/config`);
      head = await readText(host, `${dirs.gitDir}/HEAD`);
    }
  }
  return {
    repo: parseRepoSetting(settings.repository) ?? (config ? repoFromGitConfig(config) : null),
    branch: head ? branchFromHead(head) : null,
  };
}
