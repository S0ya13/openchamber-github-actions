import { connectHost, HostRequestError, type GuestSettings } from '@openchamber/sdk';
import { applyHostReady, mountBadge, mountBanner, mountButton, mountEmpty, mountSpinner, mountTabs } from '@openchamber/sdk/ui';
import {
  branchFromHead,
  durationBetween,
  linkedGitDirs,
  parseRepoSetting,
  repoFromGitConfig,
  statusOf,
  timeAgo,
  type Repo,
} from './github';
import { PANEL_CSS } from './styles';

type Run = {
  id: number;
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

type Step = { name: string; number: number; status: string; conclusion: string | null };

type Job = {
  id: number;
  name: string;
  status: string;
  conclusion: string | null;
  started_at: string | null;
  completed_at: string | null;
  html_url: string;
  steps?: Step[];
};

type Annotation = { path: string; start_line: number; annotation_level: string; message: string };

const PROVIDER_ID = 'github-actions';
const PAGE = 20;
const ACTIVE_POLL_MS = 10_000;
const IDLE_POLL_MS = 60_000;

class ApiError extends Error {
  constructor(readonly status: number, message: string) {
    super(message);
  }
}

const host = connectHost();
const root = document.getElementById('root')!;
const style = document.createElement('style');
style.textContent = PANEL_CSS;
document.head.append(style);

const state = {
  directory: null as string | null,
  connected: false,
  account: '',
  settings: {} as GuestSettings,
  repo: null as Repo | null,
  branch: null as string | null,
  scope: 'branch' as 'branch' | 'all',
  limit: PAGE,
  runs: null as Run[] | null,
  total: 0,
  error: null as string | null,
  notice: null as string | null,
  loading: false,
  expanded: new Set<number>(),
  jobs: new Map<number, Job[]>(),
  annotations: new Map<number, Annotation[]>(),
  busy: new Set<string>(),
};

let pollTimer: ReturnType<typeof setTimeout> | undefined;
let generation = 0;

async function api<T>(method: 'GET' | 'POST', path: string, query?: Record<string, string>): Promise<T> {
  const result = await host.request({ method, path, query });
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
}

function describeError(error: unknown): string {
  if (error instanceof HostRequestError && error.code === 'DISCONNECTED') {
    state.connected = false;
    return 'GitHub refused the token. Add a new one in Settings → Integrations → GitHub Actions.';
  }
  if (error instanceof ApiError) {
    if (error.status === 404 && state.repo) {
      return `${state.repo.owner}/${state.repo.name} is not visible to this token. Give the token access to this repository (fine-grained tokens: Repository access + Actions read).`;
    }
    return error.message;
  }
  return error instanceof Error ? error.message : String(error);
}

async function readText(path: string): Promise<string | null> {
  try {
    return (await host.readFile(path)).content;
  } catch {
    return null;
  }
}

/** Repo and branch of the open project; the Repository setting overrides the remote. */
async function resolveRepo(): Promise<void> {
  let config = await readText('.git/config');
  let head = await readText('.git/HEAD');
  if (config === null) {
    const dirs = linkedGitDirs((await readText('.git')) ?? '');
    if (dirs) {
      config = await readText(`${dirs.commonDir}/config`);
      head = await readText(`${dirs.gitDir}/HEAD`);
    }
  }
  state.repo = parseRepoSetting(state.settings.repository) ?? (config ? repoFromGitConfig(config) : null);
  state.branch = head ? branchFromHead(head) : null;
}

const runPath = (suffix = '') => `/repos/${state.repo!.owner}/${state.repo!.name}/actions${suffix}`;

async function loadJobs(run: Run): Promise<void> {
  const { jobs } = await api<{ jobs: Job[] }>('GET', runPath(`/runs/${run.id}/jobs`), { per_page: '100' });
  state.jobs.set(run.id, jobs);
  for (const job of jobs) {
    if (statusOf(job.status, job.conclusion).tone !== 'error' || state.annotations.has(job.id)) continue;
    // A job id is also its check run id; annotations carry the error lines GitHub extracted.
    state.annotations.set(
      job.id,
      await api<Annotation[]>('GET', `/repos/${state.repo!.owner}/${state.repo!.name}/check-runs/${job.id}/annotations`).catch(
        () => [],
      ),
    );
  }
}

async function refresh(): Promise<void> {
  clearTimeout(pollTimer);
  const mine = ++generation;
  if (!state.connected || !state.repo) {
    render();
    return;
  }
  state.loading = true;
  render();
  try {
    const query: Record<string, string> = { per_page: String(state.limit), exclude_pull_requests: 'true' };
    if (state.scope === 'branch' && state.branch) query.branch = state.branch;
    const data = await api<{ total_count: number; workflow_runs: Run[] }>('GET', runPath('/runs'), query);
    if (mine !== generation) return;
    state.runs = data.workflow_runs;
    state.total = data.total_count;
    state.error = null;
    // Jobs of an expanded run are refetched only while it can still change.
    await Promise.all(
      state.runs
        .filter((run) => state.expanded.has(run.id) && (!state.jobs.has(run.id) || statusOf(run.status, run.conclusion).active))
        .map(loadJobs),
    );
  } catch (error) {
    if (mine !== generation) return;
    state.error = describeError(error);
  }
  state.loading = false;
  render();
  const active = state.runs?.some((run) => statusOf(run.status, run.conclusion).active);
  pollTimer = setTimeout(() => {
    if (!document.hidden) void refresh();
  }, active ? ACTIVE_POLL_MS : IDLE_POLL_MS);
}

async function reload(): Promise<void> {
  await resolveRepo();
  state.runs = null;
  state.expanded.clear();
  state.jobs.clear();
  state.annotations.clear();
  await refresh();
}

async function act(key: string, label: string, path: string): Promise<void> {
  state.busy.add(key);
  render();
  try {
    await api('POST', runPath(path));
    void host.toast({ kind: 'success', message: label });
  } catch (error) {
    void host.toast({ kind: 'error', message: describeError(error) });
  }
  state.busy.delete(key);
  await refresh();
}

async function debugInSession(run: Run): Promise<void> {
  const repo = `${state.repo!.owner}/${state.repo!.name}`;
  const failed = (state.jobs.get(run.id) ?? []).filter((job) => statusOf(job.status, job.conclusion).tone === 'error');
  const lines = [
    `The GitHub Actions run "${run.name}" #${run.run_number} failed in ${repo}.`,
    `Branch: ${run.head_branch ?? 'unknown'}, commit ${run.head_sha}. Run: ${run.html_url}`,
    ...failed.map((job) => {
      const notes = (state.annotations.get(job.id) ?? [])
        .filter((note) => note.annotation_level === 'failure')
        .map((note) => `  - ${note.path}:${note.start_line} ${note.message}`);
      return [`Failed job: ${job.name}`, ...notes].join('\n');
    }),
    '',
    `Read the failed logs with \`gh run view ${run.id} --repo ${repo} --log-failed\`, find the root cause in this checkout, and propose a fix.`,
  ];
  try {
    await host.startSession({
      providerId: PROVIDER_ID,
      id: String(run.id),
      title: `CI: ${run.name} #${run.run_number} failed`,
      url: run.html_url,
      text: lines.join('\n'),
      navigation: 'open',
    });
  } catch (error) {
    void host.toast({ kind: 'error', message: describeError(error) });
  }
}

function toggle(run: Run): void {
  if (state.expanded.delete(run.id)) {
    render();
    return;
  }
  state.expanded.add(run.id);
  render();
  if (!state.jobs.has(run.id)) {
    loadJobs(run)
      .catch((error) => {
        state.error = describeError(error);
      })
      .finally(render);
  }
}

function append<K extends keyof HTMLElementTagNameMap>(parent: Element, tag: K, className = '', text?: string) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  parent.append(node);
  return node;
}

function renderJob(parent: Element, job: Job): void {
  const status = statusOf(job.status, job.conclusion);
  const row = append(parent, 'div', 'job');
  const head = append(row, 'div', 'job-head');
  mountBadge(append(head, 'span'), { label: status.label, tone: status.tone });
  append(head, 'span', 'job-name', job.name);
  append(head, 'span', 'muted', durationBetween(job.started_at, job.completed_at));
  const tools = append(head, 'span', 'job-tools');
  mountButton(append(tools, 'span'), { label: 'Log', size: 'xs', variant: 'ghost', onClick: () => void host.openUrl(job.html_url) });
  if (!status.active) {
    const key = `job-${job.id}`;
    mountButton(append(tools, 'span'), {
      label: 'Re-run',
      size: 'xs',
      variant: 'ghost',
      loading: state.busy.has(key),
      onClick: () => void act(key, `Re-running ${job.name}`, `/jobs/${job.id}/rerun`),
    });
  }
  // Steps only where they say something: the failing or the running one.
  if (status.tone === 'error' || status.active) {
    const steps = append(row, 'ul', 'steps');
    for (const step of job.steps ?? []) {
      const stepStatus = statusOf(step.status, step.conclusion);
      if (stepStatus.tone !== 'error' && !(stepStatus.active && step.status === 'in_progress')) continue;
      append(steps, 'li', `step tone-${stepStatus.tone}`, `${step.number}. ${step.name} — ${stepStatus.label}`);
    }
  }
  const notes = (state.annotations.get(job.id) ?? []).filter((note) => note.annotation_level !== 'notice');
  if (notes.length) {
    const list = append(row, 'ul', 'notes');
    for (const note of notes.slice(0, 10)) {
      append(list, 'li', `note level-${note.annotation_level}`, `${note.path === '.github' ? '' : `${note.path}:${note.start_line} `}${note.message}`);
    }
  }
}

function renderRun(parent: Element, run: Run): void {
  const status = statusOf(run.status, run.conclusion);
  const open = state.expanded.has(run.id);
  const card = append(parent, 'div', `run${open ? ' open' : ''}`);
  const summary = append(card, 'button', 'run-summary');
  summary.type = 'button';
  summary.setAttribute('aria-expanded', String(open));
  summary.addEventListener('click', () => toggle(run));
  const top = append(summary, 'div', 'run-top');
  mountBadge(append(top, 'span'), { label: status.label, tone: status.tone });
  append(top, 'span', 'run-name', `${run.name} #${run.run_number}`);
  append(top, 'span', 'muted', timeAgo(run.created_at));
  append(summary, 'div', 'run-title', run.display_title);
  const meta = [run.head_branch, run.head_sha.slice(0, 7), run.event, durationBetween(run.run_started_at ?? run.created_at, status.active ? null : run.updated_at)];
  if (run.run_attempt > 1) meta.push(`attempt ${run.run_attempt}`);
  append(summary, 'div', 'muted mono', meta.filter(Boolean).join(' · '));
  if (!open) return;

  const tools = append(card, 'div', 'run-tools');
  const button = (label: string, onClick: () => void, variant: 'outline' | 'destructive' = 'outline', key?: string) =>
    mountButton(append(tools, 'span'), { label, size: 'sm', variant, loading: key ? state.busy.has(key) : false, onClick });
  button('Open on GitHub', () => void host.openUrl(run.html_url));
  if (status.active) {
    button('Cancel', () => void act(`cancel-${run.id}`, 'Cancel requested', `/runs/${run.id}/cancel`), 'destructive', `cancel-${run.id}`);
  } else {
    if (status.tone === 'error') {
      button('Re-run failed', () => void act(`failed-${run.id}`, 'Re-running failed jobs', `/runs/${run.id}/rerun-failed-jobs`), 'outline', `failed-${run.id}`);
      button('Debug in session', () => void debugInSession(run));
    }
    button('Re-run all', () => void act(`rerun-${run.id}`, 'Re-running all jobs', `/runs/${run.id}/rerun`), 'outline', `rerun-${run.id}`);
  }

  const jobs = state.jobs.get(run.id);
  const list = append(card, 'div', 'jobs');
  if (!jobs) mountSpinner(list, {});
  else if (!jobs.length) append(list, 'div', 'muted', 'No jobs yet.');
  else for (const job of jobs) renderJob(list, job);
}

function render(): void {
  root.replaceChildren();
  const shell = append(root, 'div', 'shell');

  if (!state.connected) {
    mountEmpty(shell, {
      title: 'Connect GitHub',
      body: 'Open Settings → Integrations → GitHub Actions and paste a GitHub token. Classic with the repo scope, or fine-grained with Actions (read and write) and Metadata (read).',
    });
    return;
  }
  if (!state.directory && !parseRepoSetting(state.settings.repository)) {
    mountEmpty(shell, { title: 'No project open', body: 'Open a project whose git remote is on github.com.' });
    return;
  }
  if (!state.repo) {
    mountEmpty(shell, {
      title: 'No GitHub remote',
      body: 'This project has no github.com remote. Set "Repository" (owner/name) in Settings → Integrations → GitHub Actions.',
      action: { label: 'Retry', onClick: () => void reload() },
    });
    return;
  }

  const header = append(shell, 'div', 'header');
  const title = append(header, 'div', 'header-title');
  append(title, 'span', 'repo', `${state.repo.owner}/${state.repo.name}`);
  append(title, 'span', 'muted', [state.branch, state.account && `@${state.account}`].filter(Boolean).join(' · '));
  const controls = append(header, 'div', 'header-controls');
  if (state.branch) {
    mountTabs(append(controls, 'div'), {
      items: [
        { id: 'branch', label: 'Branch' },
        { id: 'all', label: 'All' },
      ],
      activeId: state.scope,
      onChange: (id) => {
        state.scope = id as 'branch' | 'all';
        state.limit = PAGE;
        state.runs = null;
        void refresh();
      },
    });
  }
  mountButton(append(controls, 'span'), { label: 'Refresh', size: 'sm', variant: 'ghost', loading: state.loading, onClick: () => void reload() });

  if (state.error) mountBanner(append(shell, 'div'), { tone: 'error', title: 'GitHub request failed', body: state.error });

  const runs = state.runs;
  if (!runs) {
    if (!state.error) mountSpinner(append(shell, 'div', 'center'), {});
    return;
  }
  if (!runs.length) {
    mountEmpty(append(shell, 'div'), {
      title: 'No workflow runs',
      body: state.scope === 'branch' ? `Nothing has run on ${state.branch} yet.` : 'This repository has no workflow runs.',
      ...(state.scope === 'branch'
        ? { action: { label: 'Show all branches', onClick: () => ((state.scope = 'all'), (state.runs = null), void refresh()) } }
        : {}),
    });
    return;
  }
  const list = append(shell, 'div', 'runs');
  for (const run of runs) renderRun(list, run);
  if (runs.length < state.total && state.limit < 100) {
    mountButton(append(shell, 'div', 'center'), {
      label: 'Load more',
      variant: 'ghost',
      onClick: () => {
        state.limit = Math.min(100, state.limit + PAGE);
        void refresh();
      },
    });
  }
}

host.onReady((ctx) => {
  applyHostReady(ctx, document.documentElement);
  const changed =
    ctx.directory !== state.directory ||
    ctx.connection.connected !== state.connected ||
    JSON.stringify(ctx.settings) !== JSON.stringify(state.settings);
  state.directory = ctx.directory;
  state.connected = ctx.connection.connected;
  state.account = ctx.connection.account;
  state.settings = ctx.settings;
  if (changed) void reload();
  else render();
});
host.onDirectory((directory) => {
  if (directory === state.directory) return;
  state.directory = directory;
  void reload();
});
host.onConnection((connection) => {
  state.account = connection.account;
  if (connection.connected === state.connected) return render();
  state.connected = connection.connected;
  void reload();
});
host.onSettings((settings) => {
  if (JSON.stringify(settings) === JSON.stringify(state.settings)) return;
  state.settings = settings;
  void reload();
});
document.addEventListener('visibilitychange', () => {
  if (!document.hidden) void refresh();
});
window.addEventListener('beforeunload', () => {
  clearTimeout(pollTimer);
  host.dispose();
});
