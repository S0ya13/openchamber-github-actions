/** The log drawer: a job's log fetched through the local service, with find, jump to error and copy. */
import { HostRequestError, type HostClient } from '@openchamber/sdk';
import { mountBanner, mountButton, mountSpinner } from '@openchamber/sdk/ui';
import { parseLog, type LogLine } from './github';
import type { Job } from './shared';

const CLIPBOARD_MAX = 32_000;

function node<K extends keyof HTMLElementTagNameMap>(parent: Element, tag: K, className = '', text?: string) {
  const element = document.createElement(tag);
  if (className) element.className = className;
  if (text !== undefined) element.textContent = text;
  parent.append(element);
  return element;
}

function serviceProblem(error: unknown): string {
  if (error instanceof HostRequestError && (error.code === 'NO_SERVICE' || error.code === 'SERVICE_FAILED')) {
    return 'The log service is not running. Allow the local service for GitHub Actions in Settings → Extensions.';
  }
  return error instanceof Error ? error.message : String(error);
}

let close: (() => void) | null = null;

export function openLog(host: HostClient, repo: string, job: Job): void {
  close?.();
  const drawer = node(document.body, 'div', 'drawer');
  drawer.setAttribute('role', 'dialog');
  drawer.setAttribute('aria-label', `Log of ${job.name}`);
  const head = node(drawer, 'div', 'drawer-head');
  node(head, 'span', 'drawer-title', job.name);
  const tools = node(head, 'div', 'drawer-tools');
  const find = node(drawer, 'div', 'drawer-find');
  const input = node(find, 'input', 'find-input');
  input.type = 'search';
  input.placeholder = 'Find in log';
  const count = node(find, 'span', 'muted');
  const body = node(drawer, 'div', 'drawer-body');
  mountSpinner(node(body, 'div', 'center'), {});

  let lines: LogLine[] = [];
  let rows: HTMLElement[] = [];
  let hits: number[] = [];
  let hit = -1;

  const focusRow = (index: number) => {
    body.querySelector('.current')?.classList.remove('current');
    rows[index]?.classList.add('current');
    rows[index]?.scrollIntoView({ block: 'center' });
  };
  const jumpToError = () => {
    const errors = lines.flatMap((line, index) => (line.kind === 'error' ? [index] : []));
    if (!errors.length) return void host.toast({ kind: 'info', message: 'No ##[error] line in this log.' });
    const current = rows.findIndex((row) => row.classList.contains('current'));
    focusRow(errors.find((index) => index > current) ?? errors[0]);
  };
  const search = () => {
    const needle = input.value.trim().toLowerCase();
    for (const index of hits) rows[index]?.classList.remove('hit');
    hits = needle ? lines.flatMap((line, index) => (line.text.toLowerCase().includes(needle) ? [index] : [])) : [];
    for (const index of hits) rows[index]?.classList.add('hit');
    hit = hits.length ? 0 : -1;
    count.textContent = needle ? `${hits.length ? hit + 1 : 0}/${hits.length}` : '';
    if (hits.length) focusRow(hits[0]);
  };
  const step = (by: number) => {
    if (!hits.length) return;
    hit = (hit + by + hits.length) % hits.length;
    count.textContent = `${hit + 1}/${hits.length}`;
    focusRow(hits[hit]);
  };
  input.addEventListener('input', search);
  input.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') step(event.shiftKey ? -1 : 1);
  });
  const onKey = (event: KeyboardEvent) => {
    if (event.key === 'Escape') close?.();
    if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'f') {
      event.preventDefault();
      input.focus();
    }
  };
  document.addEventListener('keydown', onKey);

  mountButton(node(tools, 'span'), { label: 'Jump to error', size: 'xs', variant: 'ghost', onClick: jumpToError });
  mountButton(node(tools, 'span'), {
    label: 'Copy',
    size: 'xs',
    variant: 'ghost',
    onClick: () => {
      const text = lines.map((line) => line.text).join('\n');
      void host.writeClipboard(text.slice(-CLIPBOARD_MAX)).then(() =>
        host.toast({ kind: 'success', message: text.length > CLIPBOARD_MAX ? 'Copied the last 32 000 characters.' : 'Log copied.' }),
      );
    },
  });
  mountButton(node(tools, 'span'), { label: 'GitHub', size: 'xs', variant: 'ghost', onClick: () => void host.openUrl(job.html_url) });
  mountButton(node(tools, 'span'), { label: 'Close', size: 'xs', variant: 'ghost', onClick: () => close?.() });

  let disposed = false;
  close = () => {
    disposed = true;
    document.removeEventListener('keydown', onKey);
    drawer.remove();
    close = null;
  };

  host
    .serviceRequest({ method: 'GET', path: '/log', query: { repo, job: String(job.id) } })
    .then((result) => {
      const data = JSON.parse(result.body) as { text?: string; truncated?: boolean; error?: string };
      if (result.status !== 200 || data.text === undefined) throw new Error(data.error ?? `The log service answered ${result.status}.`);
      return data as { text: string; truncated: boolean };
    })
    .then(({ text, truncated }) => {
      if (disposed) return;
      body.replaceChildren();
      lines = parseLog(text);
      if (truncated) node(body, 'div', 'muted log-note', 'The log is long; only its end is shown. Open it on GitHub for the rest.');
      const log = node(body, 'div', 'log');
      rows = lines.map((line, index) => {
        const row = node(log, 'div', `line kind-${line.kind}`);
        node(row, 'span', 'ln', String(index + 1));
        node(row, 'span', 'lt', line.text);
        return row;
      });
      const firstError = lines.findIndex((line) => line.kind === 'error');
      if (firstError >= 0) focusRow(firstError);
      else rows[rows.length - 1]?.scrollIntoView({ block: 'end' });
    })
    .catch((error) => {
      if (disposed) return;
      body.replaceChildren();
      mountBanner(node(body, 'div'), { tone: 'error', title: 'Could not load the log', body: serviceProblem(error) });
    });
}
