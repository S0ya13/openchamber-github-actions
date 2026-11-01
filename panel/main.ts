import { connectHost, HostRequestError, type GuestSettings } from '@openchamber/sdk';
import { applyHostReady, mountBadge, mountBanner, mountButton, mountEmpty, mountMenu, mountSpinner, mountTabs, type ButtonHandle } from '@openchamber/sdk/ui';
import { durationBetween, hasWorkflowDispatch, statusOf, timeAgo, type Repo } from './github';
import { openLog } from './log';
import {
  createApi,
  describeError,
  isRateLimit,
  PANEL_ID,
  resolveRepo,
  type Annotation,
  type Job,
  type Run,
  type Workflow,
} from './shared';
import { PANEL_CSS } from './styles';

type Scope = 'branch' | 'all';

const PAGE = 20;
const ACTIVE_POLL_MS = 10_000;
const IDLE_POLL_MS = 60_000;
const RATE_LIMIT_PAUSE_MS = 5 * 60_000;

const host = connectHost();
const api = createApi(host);
const root = document.getElementById('root')!;
const style = document.createElement('style');
style.textContent = PANEL_CSS;
document.head.append(style);

const shell = append(root, 'div', 'shell');
const headerEl = append(shell, 'div', 'header');
const bodyEl = append(shell, 'div', 'body');

const state = {
  directory: null as string | null,
  connected: false,
  account: '',
  settings: {} as GuestSettings,
  repo: null as Repo | null,
  branch: null as string | null,
  scope: 'branch' as Scope,
  limit: PAGE,
  runs: null as Run[] | null,
  total: 0,
  error: null as string | null,
  loading: false,
  fetchedAt: 0,
  pausedUntil: 0,
  autoExpand: true,
  workflows: [] as Workflow[],
  expanded: new Set<number>(),
  jobs: new Map<number, Job[]>(),
  annotations: new Map<number, Annotation[]>(),
  busy: new Set<string>(),
  cancelSent: new Set<number>(),
};

let pollTimer: ReturnType<typeof setTimeout> | undefined;
let generation = 0;
let refreshButton: ButtonHandle | null = null;
let freshnessEl: HTMLElement | null = null;

function append<K extends keyof HTMLElementTagNameMap>(parent: Element, tag: K, className = '', text?: string) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  parent.append(node);
  return node;
}

const repoName = () => `${state.repo!.owner}/${state.repo!.name}`;
const runPath = (suffix = '') => `/repos/${repoName()}/actions${suffix}`;
const scopeKey = () => `scope:${repoName()}`;
const errorText = (error: unknown) => describeError(error, state.repo);

async function loadJobs(run: Run): Promise<void> {
  const { jobs } = await api<{ jobs: Job[] }>('GET', runPath(`/runs/${run.id}/jobs`), { per_page: '100' });
  state.jobs.set(run.id, jobs);
  for (const job of jobs) {
    if (statusOf(job.status, job.conclusion).tone !== 'error' || state.annotations.has(job.id)) continue;
    // A job id is also its check run id; annotations carry the error lines GitHub extracted.
    // Fine-grained tokens cannot read check runs, so a refusal just leaves them empty.
    state.annotations.set(job.id, await api<Annotation[]>('GET', `/repos/${repoName()}/check-runs/${job.id}/annotations`).catch(() => []));
  }
}

/** Workflows a user can start by hand: their file in the open checkout declares `workflow_dispatch`. */
async function loadWorkflows(): Promise<void> {
  try {
    const { workflows } = await api<{ workflows: Workflow[] }>('GET', runPath('/workflows'), { per_page: '100' });
    const checks = await Promise.all(
      workflows
        .filter((workflow) => workflow.state === 'active' && workflow.path.startsWith('.github/workflows/'))
        .map(async (workflow) => {
          const file = await host.readFile(workflow.path).catch(() => null);
          return file && hasWorkflowDispatch(file.content) ? workflow : null;
        }),
    );
    state.workflows = checks.filter((workflow): workflow is Workflow => workflow !== null);
  } catch {
    state.workflows = [];
  }
}

function schedule(): void {
  clearTimeout(pollTimer);
  const active = state.runs?.some((run) => statusOf(run.status, run.conclusion).active);
  const wait = Math.max(state.pausedUntil - Date.now(), active ? ACTIVE_POLL_MS : IDLE_POLL_MS);
  pollTimer = setTimeout(() => {
    if (!document.hidden) void refresh();
  }, wait);
}

async function refresh(): Promise<void> {
  clearTimeout(pollTimer);
  const mine = ++generation;
  if (gate()) return render();
  const current = await resolveRepo(host, state.settings);
  if (mine !== generation) return;
  // A checkout or a switched remote since the last poll: start over on the new target.
  if (current.branch !== state.branch || current.repo?.owner !== state.repo?.owner || current.repo?.name !== state.repo?.name) return reload();
  state.loading = true;
  refreshButton?.update({ loading: true });
  try {
    const query: Record<string, string> = { per_page: String(state.limit), exclude_pull_requests: 'true' };
    if (state.scope === 'branch' && state.branch) query.branch = state.branch;
    const data = await api<{ total_count: number; workflow_runs: Run[] }>('GET', runPath('/runs'), query);
    if (mine !== generation) return;
    state.runs = data.workflow_runs;
    state.total = data.total_count;
    state.error = null;
    state.fetchedAt = Date.now();
    // Open the newest run once if it is the one worth looking at: running or failed.
    const newest = state.runs[0];
    if (state.autoExpand && newest) {
      const status = statusOf(newest.status, newest.conclusion);
      if (status.active || status.tone === 'error') state.expanded.add(newest.id);
      state.autoExpand = false;
    }
    for (const id of state.cancelSent) if (!state.runs.some((run) => run.id === id && statusOf(run.status, run.conclusion).active)) state.cancelSent.delete(id);
    // Jobs of an expanded run are refetched only while it can still change.
    await Promise.all(
      state.runs
        .filter((run) => state.expanded.has(run.id) && (!state.jobs.has(run.id) || statusOf(run.status, run.conclusion).active))
        .map(loadJobs),
    );
  } catch (error) {
    if (mine !== generation) return;
    if (isRateLimit(error)) state.pausedUntil = Date.now() + RATE_LIMIT_PAUSE_MS;
    state.error = errorText(error);
    if (error instanceof HostRequestError && error.code === 'DISCONNECTED') {
      state.connected = false;
      renderHeader();
    }
  }
  state.loading = false;
  refreshButton?.update({ loading: false });
  renderBody();
  schedule();
}

async function reload(): Promise<void> {
  if (state.connected) Object.assign(state, await resolveRepo(host, state.settings));
  state.runs = null;
  state.error = null;
  state.autoExpand = true;
  state.workflows = [];
  state.expanded.clear();
  state.jobs.clear();
  state.annotations.clear();
  if (!gate()) {
    const saved = await host.storage.get(scopeKey()).catch(() => undefined);
    state.scope = saved === 'all' || !state.branch ? 'all' : 'branch';
    await loadWorkflows();
  }
  render();
  await refresh();
}

async function act(key: string, label: string, path: string, body?: unknown): Promise<void> {
  state.busy.add(key);
  renderBody();
  try {
    await api('POST', path, undefined, body);
    void host.toast({ kind: 'success', message: label });
  } catch (error) {
    void host.toast({ kind: 'error', message: errorText(error) });
  }
  state.busy.delete(key);
  await refresh();
}

function setScope(scope: Scope): void {
  state.scope = scope;
  state.limit = PAGE;
  state.runs = null;
  void host.storage.set(scopeKey(), scope).catch(() => undefined);
  render();
  void refresh();
}

async function debugInSession(run: Run): Promise<void> {
  const failed = (state.jobs.get(run.id) ?? []).filter((job) => statusOf(job.status, job.conclusion).tone === 'error');
  const lines = [
    `The GitHub Actions run "${run.name}" #${run.run_number} failed in ${repoName()}.`,
    `Branch: ${run.head_branch ?? 'unknown'}, commit ${run.head_sha}. Run: ${run.html_url}`,
    ...failed.map((job) => {
      const notes = (state.annotations.get(job.id) ?? [])
        .filter((note) => note.annotation_level === 'failure')
        .map((note) => `  - ${note.path}:${note.start_line} ${note.message}`);
      return [`Failed job: ${job.name}`, ...notes].join('\n');
    }),
    '',
    `Read the failed logs with \`gh run view ${run.id} --repo ${repoName()} --log-failed\`, find the root cause in this checkout, and propose a fix.`,
  ];
  try {
    await host.startSession({
      providerId: PANEL_ID,
      id: String(run.id),
      title: `CI: ${run.name} #${run.run_number} failed`,
      url: run.html_url,
      text: lines.join('\n'),
      navigation: 'open',
    });
  } catch (error) {
    void host.toast({ kind: 'error', message: errorText(error) });
  }
}

function toggle(run: Run): void {
  if (!state.expanded.delete(run.id)) {
    state.expanded.add(run.id);
    if (!state.jobs.has(run.id)) {
      loadJobs(run)
        .catch((error) => {
          state.error = errorText(error);
        })
        .finally(renderBody);
    }
  }
  renderBody();
}

/** Why the list cannot show yet, or null when it can. */
function gate(): { title: string; body: string; retry?: boolean } | null {
  if (!state.connected) {
    return {
      title: 'Connect GitHub',
      body: 'Open Settings → Integrations → GitHub Actions and paste a GitHub token. Classic with the repo scope, or fine-grained with Actions (read and write) and Metadata (read).',
    };
  }
  if (!state.directory && !state.repo) return { title: 'No project open', body: 'Open a project whose git remote is on github.com.' };
  if (!state.repo) {
    return {
      title: 'No GitHub remote',
      body: 'This project has no github.com remote. Set "Repository override" (owner/name) in Settings → Integrations → GitHub Actions.',
      retry: true,
    };
  }
  return null;
}

function renderFreshness(): void {
  if (!freshnessEl) return;
  const paused = state.pausedUntil > Date.now();
  freshnessEl.textContent = paused ? 'paused: rate limit' : state.fetchedAt ? `updated ${timeAgo(new Date(state.fetchedAt).toISOString())}` : '';
}

function renderHeader(): void {
  headerEl.replaceChildren();
  refreshButton = null;
  freshnessEl = null;
  if (gate()) return;
  const title = append(headerEl, 'div', 'header-title');
  append(title, 'span', 'repo', repoName());
  append(title, 'span', 'muted', [state.branch, state.account && `@${state.account}`].filter(Boolean).join(' · '));
  const controls = append(headerEl, 'div', 'header-controls');
  if (state.branch) {
    mountTabs(append(controls, 'div'), {
      items: [
        { id: 'branch', label: 'Branch' },
        { id: 'all', label: 'All' },
      ],
      activeId: state.scope,
      onChange: (id) => setScope(id as Scope),
    });
  }
  if (state.branch && state.workflows.length) {
    mountMenu(append(controls, 'span'), {
      label: 'Run workflow',
      size: 'sm',
      variant: 'outline',
      items: state.workflows.map((workflow) => ({ id: String(workflow.id), label: workflow.name })),
      onSelect: (id) => {
        const workflow = state.workflows.find((item) => String(item.id) === id)!;
        void act(`dispatch-${id}`, `Started ${workflow.name} on ${state.branch}`, runPath(`/workflows/${id}/dispatches`), { ref: state.branch }).then(
          // A dispatched run shows up in the list a few seconds later.
          () => setTimeout(() => void refresh(), 3000),
        );
      },
    });
  }
  refreshButton = mountButton(append(controls, 'span'), { label: 'Refresh', size: 'sm', variant: 'ghost', loading: state.loading, onClick: () => void reload() });
  freshnessEl = append(headerEl, 'span', 'muted freshness');
  renderFreshness();
}

function renderJob(parent: Element, job: Job): void {
  const status = statusOf(job.status, job.conclusion);
  const row = append(parent, 'div', 'job');
  const head = append(row, 'div', 'job-head');
  mountBadge(append(head, 'span'), { label: status.label, tone: status.tone });
  append(head, 'span', 'job-name', job.name);
  append(head, 'span', 'muted', durationBetween(job.started_at, job.completed_at));
  const tools = append(head, 'span', 'job-tools');
  mountButton(append(tools, 'span'), { label: 'Log', size: 'xs', variant: 'ghost', onClick: () => openLog(host, repoName(), job) });
  if (!status.active) {
    const key = `job-${job.id}`;
    mountButton(append(tools, 'span'), {
      label: 'Re-run',
      size: 'xs',
      variant: 'ghost',
      loading: state.busy.has(key),
      onClick: () => void act(key, `Re-running ${job.name}`, runPath(`/jobs/${job.id}/rerun`)),
    });
  }
  // Steps only where they say something: the failing or the running one.
  if (status.tone === 'error' || status.active) {
    const steps = append(row, 'ul', 'steps');
    for (const step of job.steps ?? []) {
      const stepStatus = statusOf(step.status, step.conclusion);
      if (stepStatus.tone !== 'error' && step.status !== 'in_progress') continue;
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
  const button = (label: string, key: string | null, onClick: () => void, variant: 'outline' | 'destructive' = 'outline') =>
    mountButton(append(tools, 'span'), { label, size: 'sm', variant, loading: key ? state.busy.has(key) : false, onClick });
  button('Open on GitHub', null, () => void host.openUrl(run.html_url));
  if (status.active) {
    if (state.cancelSent.has(run.id)) {
      // A plain cancel waits for `if: always()` steps; force-cancel stops the run outright.
      button('Force cancel', `force-${run.id}`, () => void act(`force-${run.id}`, 'Force cancel requested', runPath(`/runs/${run.id}/force-cancel`)), 'destructive');
    } else {
      button('Cancel', `cancel-${run.id}`, () => {
        state.cancelSent.add(run.id);
        void act(`cancel-${run.id}`, 'Cancel requested', runPath(`/runs/${run.id}/cancel`));
      }, 'destructive');
    }
  } else {
    if (status.tone === 'error') {
      button('Re-run failed', `failed-${run.id}`, () => void act(`failed-${run.id}`, 'Re-running failed jobs', runPath(`/runs/${run.id}/rerun-failed-jobs`)));
      button('Debug in session', null, () => void debugInSession(run));
    }
    button('Re-run all', `rerun-${run.id}`, () => void act(`rerun-${run.id}`, 'Re-running all jobs', runPath(`/runs/${run.id}/rerun`)));
  }

  const jobs = state.jobs.get(run.id);
  const list = append(card, 'div', 'jobs');
  if (!jobs) mountSpinner(list, {});
  else if (!jobs.length) append(list, 'div', 'muted', 'No jobs yet.');
  else for (const job of jobs) renderJob(list, job);
}

function renderBody(): void {
  bodyEl.replaceChildren();
  renderFreshness();
  const blocked = gate();
  if (blocked) {
    mountEmpty(bodyEl, { title: blocked.title, body: blocked.body, ...(blocked.retry ? { action: { label: 'Retry', onClick: () => void reload() } } : {}) });
    return;
  }
  if (state.error) mountBanner(append(bodyEl, 'div'), { tone: 'error', title: 'GitHub request failed', body: state.error });

  const runs = state.runs;
  if (!runs) {
    if (!state.error) mountSpinner(append(bodyEl, 'div', 'center'), {});
    return;
  }
  if (!runs.length) {
    mountEmpty(append(bodyEl, 'div'), {
      title: 'No workflow runs',
      body: state.scope === 'branch' ? `Nothing has run on ${state.branch} yet.` : 'This repository has no workflow runs.',
      ...(state.scope === 'branch' ? { action: { label: 'Show all branches', onClick: () => setScope('all') } } : {}),
    });
    return;
  }
  const list = append(bodyEl, 'div', 'runs');
  for (const run of runs) renderRun(list, run);
  if (runs.length < state.total && state.limit < 100) {
    mountButton(append(bodyEl, 'div', 'center'), {
      label: 'Load more',
      variant: 'ghost',
      onClick: () => {
        state.limit = Math.min(100, state.limit + PAGE);
        void refresh();
      },
    });
  }
}

function render(): void {
  renderHeader();
  renderBody();
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
});
host.onDirectory((directory) => {
  if (directory === state.directory) return;
  state.directory = directory;
  void reload();
});
host.onConnection((connection) => {
  state.account = connection.account;
  if (connection.connected === state.connected) return;
  state.connected = connection.connected;
  void reload();
});
host.onSettings((settings) => {
  if (JSON.stringify(settings) === JSON.stringify(state.settings)) return;
  state.settings = settings;
  void reload();
});
document.addEventListener('visibilitychange', () => {
  if (!document.hidden && Date.now() > state.pausedUntil) void refresh();
});
const freshnessTimer = setInterval(renderFreshness, 5000);
window.addEventListener('beforeunload', () => {
  clearTimeout(pollTimer);
  clearInterval(freshnessTimer);
  host.dispose();
});
