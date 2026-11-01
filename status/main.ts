/** The Work Status section: the latest runs of the current branch, next to the chat. */
import { connectHost, type GuestSettings } from '@openchamber/sdk';
import { applyHostReady, mountBadge } from '@openchamber/sdk/ui';
import { statusOf, timeAgo, type Repo } from '../panel/github';
import { createApi, describeError, notifyEnabled, notifyFailures, PANEL_ID, resolveRepo, type Run } from '../panel/shared';
import { STATUS_CSS } from '../panel/styles';

const SHOWN = 3;
const ACTIVE_POLL_MS = 15_000;
const IDLE_POLL_MS = 60_000;

const host = connectHost();
const api = createApi(host);
const root = document.getElementById('root')!;
const style = document.createElement('style');
style.textContent = STATUS_CSS;
document.head.append(style);

let connected = false;
let directory: string | null = null;
let settings: GuestSettings = {};
let target: { repo: Repo | null; branch: string | null } = { repo: null, branch: null };
let timer: ReturnType<typeof setTimeout> | undefined;
let generation = 0;

function line(text: string, className = 'muted'): HTMLElement {
  const node = document.createElement('div');
  node.className = className;
  node.textContent = text;
  return node;
}

function show(nodes: HTMLElement[]): void {
  root.replaceChildren(...nodes);
  void host.setHeight(Math.ceil(root.getBoundingClientRect().height) + 12).catch(() => undefined);
}

function runRow(run: Run): HTMLElement {
  const status = statusOf(run.status, run.conclusion);
  const row = document.createElement('button');
  row.type = 'button';
  row.className = 'status-run';
  row.title = run.display_title;
  row.addEventListener('click', () => void host.openSurface(`plugin:${PANEL_ID}`).catch(() => host.openUrl(run.html_url)));
  mountBadge(row.appendChild(document.createElement('span')), { label: status.label, tone: status.tone });
  row.append(line(`${run.name} #${run.run_number}`, 'status-name'), line(timeAgo(run.created_at)));
  return row;
}

async function refresh(): Promise<void> {
  clearTimeout(timer);
  const mine = ++generation;
  // Every state, the empty ones too, looks again later: a remote or a branch may appear.
  timer = setTimeout(() => void refresh(), IDLE_POLL_MS);
  if (!connected) return show([line('Connect GitHub in Settings → Integrations → GitHub Actions.')]);
  target = await resolveRepo(host, settings);
  if (mine !== generation) return;
  if (!target.repo) return show([line(directory ? 'No github.com remote in this project.' : 'No project open.')]);
  if (!target.branch) return show([line('Detached HEAD: no branch to follow.')]);
  const { owner, name } = target.repo;
  let active = false;
  try {
    const data = await api<{ workflow_runs: Run[] }>('GET', `/repos/${owner}/${name}/actions/runs`, {
      branch: target.branch,
      per_page: '10',
      exclude_pull_requests: 'true',
    });
    if (mine !== generation) return;
    const repoName = `${owner}/${name}`;
    if (await notifyEnabled(host, repoName)) await notifyFailures(host, repoName, target.branch, data.workflow_runs);
    // The newest run of each workflow says where the branch stands.
    const latest = data.workflow_runs.filter((run, index, runs) => runs.findIndex((other) => other.workflow_id === run.workflow_id) === index);
    active = latest.some((run) => statusOf(run.status, run.conclusion).active);
    show(latest.length ? latest.slice(0, SHOWN).map(runRow) : [line(`Nothing has run on ${target.branch} yet.`)]);
  } catch (error) {
    if (mine !== generation) return;
    show([line(describeError(error, target.repo), 'status-error')]);
  }
  if (active) {
    clearTimeout(timer);
    timer = setTimeout(() => void refresh(), ACTIVE_POLL_MS);
  }
}

host.onReady((ctx) => {
  applyHostReady(ctx, document.documentElement);
  const changed = ctx.directory !== directory || ctx.connection.connected !== connected || JSON.stringify(ctx.settings) !== JSON.stringify(settings);
  directory = ctx.directory;
  connected = ctx.connection.connected;
  settings = ctx.settings;
  if (changed) void refresh();
});
host.onConnection((connection) => {
  if (connection.connected === connected) return;
  connected = connection.connected;
  void refresh();
});
host.onSettings((next) => {
  if (JSON.stringify(next) === JSON.stringify(settings)) return;
  settings = next;
  void refresh();
});
window.addEventListener('beforeunload', () => {
  clearTimeout(timer);
  host.dispose();
});
