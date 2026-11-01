/** What the panel and the Work Status section share: GitHub types, the API call and repo resolution. */
import { HostRequestError, type GuestSettings, type HostClient } from '@openchamber/sdk';
import { branchFromHead, linkedGitDirs, parseRepoSetting, repoFromGitConfig, type Repo } from './github';

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
