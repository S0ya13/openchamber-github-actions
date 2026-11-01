/**
 * The local service: fetches a job log through the GitHub CLI. The panel cannot
 * read logs itself, because GitHub answers the logs endpoint with a redirect to
 * blob storage and OpenChamber's extension requests do not follow redirects.
 * `gh api` follows it with the user's own `gh auth login`.
 */
import { spawn } from 'node:child_process';
import { createServer } from 'node:http';
import { delimiter } from 'node:path';

/** The tail kept from a long log; JSON escaping must still fit the host's 8 MB answer cap. */
export const LOG_TAIL_MAX = 3_000_000;
const GH_TIMEOUT_MS = 60_000;

export type GhResult = { code: number | null; stdout: string; stderr: string; missing: boolean; truncated: boolean };
export type GhRunner = (args: string[]) => Promise<GhResult>;

// The host hands the service a minimal PATH; an app started from the Dock often lacks Homebrew's bin.
const PATH = [process.env.PATH, '/opt/homebrew/bin', '/usr/local/bin', '/usr/bin'].filter(Boolean).join(delimiter);

export const runGh: GhRunner = (args) =>
  new Promise((resolve) => {
    const child = spawn('gh', args, { env: { ...process.env, PATH, GH_PROMPT_DISABLED: '1' }, windowsHide: true });
    const chunks: Buffer[] = [];
    let size = 0;
    let truncated = false;
    let stderr = '';
    child.stdout.on('data', (chunk: Buffer) => {
      chunks.push(chunk);
      size += chunk.length;
      while (chunks.length > 1 && size - chunks[0].length > LOG_TAIL_MAX) {
        size -= chunks.shift()!.length;
        truncated = true;
      }
    });
    child.stderr.on('data', (chunk: Buffer) => {
      stderr = (stderr + chunk.toString('utf8')).slice(-4000);
    });
    const timer = setTimeout(() => child.kill(), GH_TIMEOUT_MS);
    child.on('error', (error: NodeJS.ErrnoException) => {
      clearTimeout(timer);
      resolve({ code: null, stdout: '', stderr: error.message, missing: error.code === 'ENOENT', truncated: false });
    });
    child.on('close', (code) => {
      clearTimeout(timer);
      resolve({ code, stdout: Buffer.concat(chunks).toString('utf8'), stderr, missing: false, truncated });
    });
  });

type Answer = { status: number; body: string };
const json = (status: number, value: unknown): Answer => ({ status, body: JSON.stringify(value) });

export async function handleLog(query: URLSearchParams, gh: GhRunner = runGh): Promise<Answer> {
  const repo = query.get('repo') ?? '';
  const job = query.get('job') ?? '';
  if (!/^[\w.-]+\/[\w.-]+$/.test(repo) || !/^\d+$/.test(job)) return json(400, { error: 'repo (owner/name) and job (id) are required.' });

  const path = `repos/${repo}/actions/jobs/${job}/logs`;
  let result = await gh(['api', '--allow-escape-sequences', path]);
  // Older gh has no such flag and prints the log as is anyway.
  if (result.code !== 0 && /unknown flag/.test(result.stderr)) result = await gh(['api', path]);

  if (result.missing) {
    return json(424, { code: 'NO_GH', error: 'Logs need the GitHub CLI. Install gh and run `gh auth login`, then reopen the log.' });
  }
  if (result.code !== 0) {
    if (/BlobNotFound|HTTP 404/.test(result.stdout + result.stderr)) {
      return json(404, { error: 'GitHub has no log for this job. It never started, or the log expired.' });
    }
    if (/auth login|not logged/i.test(result.stderr)) {
      return json(401, { code: 'NO_GH_AUTH', error: 'The GitHub CLI is not logged in. Run `gh auth login`, then reopen the log.' });
    }
    return json(502, { error: result.stderr.trim() || `gh exited with code ${result.code}.` });
  }
  let text = result.stdout;
  // A cut log starts mid-line; drop the partial line.
  if (result.truncated) text = text.slice(text.indexOf('\n') + 1);
  return json(200, { text, truncated: result.truncated });
}

const port = Number(process.env.OPENCHAMBER_SERVICE_PORT);
const token = process.env.OPENCHAMBER_SERVICE_TOKEN ?? '';

if (port) {
  createServer(async (request, response) => {
    const url = new URL(request.url ?? '/', 'http://127.0.0.1');
    let answer: Answer;
    if (!token || request.headers.authorization !== `Bearer ${token}`) answer = json(401, { error: 'unauthorized' });
    else if (request.method === 'GET' && url.pathname === '/health') answer = json(200, { ok: true });
    else if (request.method === 'GET' && url.pathname === '/log') answer = await handleLog(url.searchParams);
    else answer = json(404, { error: 'not found' });
    response.writeHead(answer.status, { 'content-type': 'application/json' });
    response.end(answer.body);
  }).listen(port, '127.0.0.1');
}
