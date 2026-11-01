export const PANEL_CSS = `
html, body { margin: 0; background: var(--oc-bg); color: var(--oc-fg); font-family: var(--oc-font); font-size: 13px; }
.shell { display: flex; flex-direction: column; gap: 10px; padding: 12px; }
.muted { color: var(--oc-muted); font-size: 12px; }
.mono { font-family: var(--oc-mono); }
.center { display: flex; justify-content: center; padding: 12px; }

.header { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 8px; }
.header-title { display: flex; flex-direction: column; min-width: 0; }
.repo { font-weight: 600; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.header-controls { display: flex; align-items: center; gap: 6px; }

.runs { display: flex; flex-direction: column; gap: 6px; }
.run { border: 1px solid var(--oc-border); border-radius: var(--oc-radius); overflow: hidden; }
.run.open { background: var(--oc-muted-surface); }
.run-summary {
  all: unset; box-sizing: border-box; display: flex; flex-direction: column; gap: 3px;
  width: 100%; padding: 8px 10px; cursor: pointer;
}
.run-summary:hover { background: var(--oc-hover); }
.run-summary:focus-visible { outline: 2px solid var(--oc-focus); outline-offset: -2px; }
.run-top { display: flex; align-items: center; gap: 8px; }
.run-name { flex: 1; min-width: 0; font-weight: 600; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.run-title { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.run-tools { display: flex; flex-wrap: wrap; gap: 6px; padding: 0 10px 8px; }

.jobs { display: flex; flex-direction: column; border-top: 1px solid var(--oc-border); }
.job { display: flex; flex-direction: column; gap: 4px; padding: 6px 10px; }
.job + .job { border-top: 1px solid var(--oc-border); }
.job-head { display: flex; align-items: center; gap: 8px; }
.job-name { flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.job-tools { display: flex; gap: 2px; }

.steps, .notes { margin: 0; padding-left: 18px; display: flex; flex-direction: column; gap: 2px; font-size: 12px; }
.step.tone-error { color: var(--oc-error-text); }
.step.tone-info { color: var(--oc-info-text); }
.note { font-family: var(--oc-mono); white-space: pre-wrap; word-break: break-word; }
.note.level-failure { color: var(--oc-error-text); }
.note.level-warning { color: var(--oc-warning-text); }
`;
