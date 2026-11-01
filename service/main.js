// service/main.ts
import { spawn } from "node:child_process";
import { createServer } from "node:http";
import { delimiter } from "node:path";
var LOG_TAIL_MAX = 3000000;
var GH_TIMEOUT_MS = 60000;
var PATH = [process.env.PATH, "/opt/homebrew/bin", "/usr/local/bin", "/usr/bin"].filter(Boolean).join(delimiter);
var runGh = (args) => new Promise((resolve) => {
  const child = spawn("gh", args, { env: { ...process.env, PATH, GH_PROMPT_DISABLED: "1" }, windowsHide: true });
  const chunks = [];
  let size = 0;
  let truncated = false;
  let stderr = "";
  child.stdout.on("data", (chunk) => {
    chunks.push(chunk);
    size += chunk.length;
    while (chunks.length > 1 && size - chunks[0].length > LOG_TAIL_MAX) {
      size -= chunks.shift().length;
      truncated = true;
    }
  });
  child.stderr.on("data", (chunk) => {
    stderr = (stderr + chunk.toString("utf8")).slice(-4000);
  });
  const timer = setTimeout(() => child.kill(), GH_TIMEOUT_MS);
  child.on("error", (error) => {
    clearTimeout(timer);
    resolve({ code: null, stdout: "", stderr: error.message, missing: error.code === "ENOENT", truncated: false });
  });
  child.on("close", (code) => {
    clearTimeout(timer);
    resolve({ code, stdout: Buffer.concat(chunks).toString("utf8"), stderr, missing: false, truncated });
  });
});
var json = (status, value) => ({ status, body: JSON.stringify(value) });
async function handleLog(query, gh = runGh) {
  const repo = query.get("repo") ?? "";
  const job = query.get("job") ?? "";
  if (!/^[\w.-]+\/[\w.-]+$/.test(repo) || !/^\d+$/.test(job))
    return json(400, { error: "repo (owner/name) and job (id) are required." });
  const path = `repos/${repo}/actions/jobs/${job}/logs`;
  let result = await gh(["api", "--allow-escape-sequences", path]);
  if (result.code !== 0 && /unknown flag/.test(result.stderr))
    result = await gh(["api", path]);
  if (result.missing) {
    return json(424, { code: "NO_GH", error: "Logs need the GitHub CLI. Install gh and run `gh auth login`, then reopen the log." });
  }
  if (result.code !== 0) {
    if (/BlobNotFound|HTTP 404/.test(result.stdout + result.stderr)) {
      return json(404, { error: "GitHub has no log for this job. It never started, or the log expired." });
    }
    if (/auth login|not logged/i.test(result.stderr)) {
      return json(401, { code: "NO_GH_AUTH", error: "The GitHub CLI is not logged in. Run `gh auth login`, then reopen the log." });
    }
    return json(502, { error: result.stderr.trim() || `gh exited with code ${result.code}.` });
  }
  let text = result.stdout;
  if (result.truncated)
    text = text.slice(text.indexOf(`
`) + 1);
  return json(200, { text, truncated: result.truncated });
}
var port = Number(process.env.OPENCHAMBER_SERVICE_PORT);
var token = process.env.OPENCHAMBER_SERVICE_TOKEN ?? "";
if (port) {
  createServer(async (request, response) => {
    const url = new URL(request.url ?? "/", "http://127.0.0.1");
    let answer;
    if (!token || request.headers.authorization !== `Bearer ${token}`)
      answer = json(401, { error: "unauthorized" });
    else if (request.method === "GET" && url.pathname === "/health")
      answer = json(200, { ok: true });
    else if (request.method === "GET" && url.pathname === "/log")
      answer = await handleLog(url.searchParams);
    else
      answer = json(404, { error: "not found" });
    response.writeHead(answer.status, { "content-type": "application/json" });
    response.end(answer.body);
  }).listen(port, "127.0.0.1");
}
export {
  LOG_TAIL_MAX,
  handleLog,
  runGh
};
