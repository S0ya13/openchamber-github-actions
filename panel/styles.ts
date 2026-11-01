export const PANEL_CSS = `
html, body { margin: 0; background: var(--oc-bg); color: var(--oc-fg); font-family: var(--oc-font); font-size: 13px; }
.shell { display: flex; flex-direction: column; gap: 10px; padding: 12px; }
.muted { color: var(--oc-muted); font-size: 12px; }
.mono { font-family: var(--oc-mono); }
.center { display: flex; justify-content: center; padding: 12px; }

.header { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 8px; }
.header:empty { display: none; }
.freshness { flex-basis: 100%; }
.body { display: flex; flex-direction: column; gap: 10px; }
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

.drawer {
  position: fixed; inset: 0; z-index: 10; display: flex; flex-direction: column;
  background: var(--oc-bg); color: var(--oc-fg);
}
.drawer-head { display: flex; align-items: center; gap: 8px; padding: 8px 10px; border-bottom: 1px solid var(--oc-border); }
.drawer-title { flex: 1; min-width: 0; font-weight: 600; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.drawer-tools { display: flex; flex-wrap: wrap; gap: 2px; }
.drawer-find { display: flex; align-items: center; gap: 8px; padding: 6px 10px; border-bottom: 1px solid var(--oc-border); }
.find-input {
  flex: 1; min-width: 0; padding: 4px 8px; font: inherit; color: var(--oc-fg);
  background: var(--oc-muted-surface); border: 1px solid var(--oc-border); border-radius: var(--oc-radius);
}
.find-input:focus-visible { outline: 2px solid var(--oc-focus); outline-offset: -1px; }
.drawer-body { flex: 1; overflow: auto; }
.log-note { padding: 6px 10px; }
.log { font-family: var(--oc-mono); font-size: 12px; line-height: 1.5; padding: 4px 0; }
.line { display: flex; gap: 10px; padding: 0 10px; content-visibility: auto; contain-intrinsic-size: auto 18px; }
.ln { flex: none; width: 4ch; text-align: right; color: var(--oc-subtle); user-select: none; }
.lt { white-space: pre-wrap; word-break: break-word; min-width: 0; }
.kind-error { color: var(--oc-error-text); }
.kind-warning { color: var(--oc-warning-text); }
.kind-group { font-weight: 600; }
.kind-command { color: var(--oc-info-text); }
.line.hit { background: var(--oc-hover); }
.line.current { background: var(--oc-selection); color: var(--oc-selection-fg); }
`;

export const STATUS_CSS = `
html, body { margin: 0; background: transparent; color: var(--oc-fg); font-family: var(--oc-font); font-size: 12px; }
#root { display: flex; flex-direction: column; gap: 2px; padding: 4px 8px; }
.muted { color: var(--oc-muted); }
.status-error { color: var(--oc-error-text); }
.status-run {
  all: unset; box-sizing: border-box; display: flex; align-items: center; gap: 8px;
  padding: 3px 4px; border-radius: var(--oc-radius); cursor: pointer;
}
.status-run:hover { background: var(--oc-hover); }
.status-run:focus-visible { outline: 2px solid var(--oc-focus); outline-offset: -2px; }
.status-name { flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
`;
