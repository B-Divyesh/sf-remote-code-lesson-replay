import { browser } from 'wxt/browser';
import '../styles.css';
import {
  createLineDiff,
  maskSecrets,
  newSession,
  parseBundle,
  safeFilename,
  toBundle,
  type FileStep,
  type ReplaySession,
  type ReplayStep,
  type RunResult
} from '../../src/replay';
import {
  acceptLicenseFromUrl,
  CHECKOUT_URL,
  getOptimisticLicenseState,
  PRICE_LABEL,
  storeLicense,
  verifyLicense,
  type LicenseState
} from '../../src/license';

const STORAGE_KEY = 'currentReplay';
const app = document.querySelector<HTMLDivElement>('#app')!;
let session: ReplaySession | null = null;
let selected = 0;
let captureKind: ReplayStep['kind'] = 'command';
let notice = '';
let noticeTone: 'info' | 'success' | 'error' = 'info';
let license: LicenseState = getOptimisticLicenseState();

function escapeHtml(value: string): string {
  return value.replace(/[&<>'"]/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' })[character]!);
}

function setNotice(message: string, tone: typeof noticeTone = 'info'): void {
  notice = message;
  noticeTone = tone;
}

function renderNotice(): string {
  if (!notice) return '';
  const role = noticeTone === 'error' ? 'alert' : 'status';
  return `<div class="notice notice-${noticeTone}" role="${role}">${escapeHtml(notice)}<button type="button" data-action="dismiss" aria-label="Dismiss notice">×</button></div>`;
}

function displayDate(iso: string): string {
  return new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(iso));
}

function parseExtraMasks(value: FormDataEntryValue | null): string[] {
  return String(value ?? '').split(/[\n,]/).map((term) => term.trim()).filter(Boolean);
}

function scrubFields(fields: string[], masks: string[]): { values: string[]; count: number } {
  let count = 0;
  const values = fields.map((field) => {
    const result = maskSecrets(field, masks);
    count += result.count;
    return result.value;
  });
  return { values, count };
}

async function loadSession(): Promise<void> {
  try {
    const stored = await browser.storage.local.get(STORAGE_KEY);
    session = (stored[STORAGE_KEY] as ReplaySession | undefined) ?? null;
  } catch {
    setNotice('Local storage could not be opened. Export any visible work before closing this tab.', 'error');
  }
}

async function saveSession(): Promise<void> {
  if (!session) return;
  session.updatedAt = new Date().toISOString();
  try {
    await browser.storage.local.set({ [STORAGE_KEY]: session });
  } catch {
    setNotice('The replay could not be saved locally. It may be too large; export it now and start a shorter session.', 'error');
  }
}

function stepLabel(step: ReplayStep): string {
  if (step.kind === 'command') return step.command.split('\n')[0]?.slice(0, 44) || 'Command';
  if (step.kind === 'file') return step.fileName;
  if (step.kind === 'note') return step.note.slice(0, 44) || 'Reasoning note';
  return 'Private command skipped';
}

function resultBadge(step: ReplayStep): string {
  if (step.kind === 'command') return `<span class="tag tag-${step.result}">${step.result}</span>`;
  if (step.kind === 'file') return '<span class="tag tag-file">file diff</span>';
  if (step.kind === 'excluded') return '<span class="tag tag-private">excluded</span>';
  return '<span class="tag">note</span>';
}

function renderDiff(step: FileStep): string {
  return `<div class="diff" role="list" aria-label="Changes in ${escapeHtml(step.fileName)}">${step.diff.map((line) => {
    const prefix = line.type === 'add' ? '+' : line.type === 'remove' ? '−' : ' ';
    return `<div class="diff-line diff-${line.type}" role="listitem"><span aria-hidden="true">${prefix}</span><code>${escapeHtml(line.text || ' ')}</code><span class="sr-only">${line.type}</span></div>`;
  }).join('')}</div>`;
}

function renderStep(step: ReplayStep, index: number): string {
  let evidence = '';
  if (step.kind === 'command') {
    evidence = `<dl class="facts"><div><dt>Command</dt><dd><code>${escapeHtml(step.command)}</code></dd></div><div><dt>Result</dt><dd>${escapeHtml(step.result)}${step.exitCode === null ? '' : ` · exit ${step.exitCode}`}</dd></div></dl>${step.output ? `<h3>Opt-in output</h3><pre>${escapeHtml(step.output)}</pre>` : '<p class="muted">No output was included.</p>'}`;
  } else if (step.kind === 'file') {
    evidence = `<p class="file-name"><code>${escapeHtml(step.fileName)}</code></p>${renderDiff(step)}<details><summary>Preserved snapshots</summary><div class="snapshot-grid"><div><h3>Before</h3><pre>${escapeHtml(step.before)}</pre></div><div><h3>After</h3><pre>${escapeHtml(step.after)}</pre></div></div></details>`;
  } else if (step.kind === 'note') {
    evidence = `<div class="note-paper"><p>${escapeHtml(step.note)}</p></div>`;
  } else {
    evidence = `<div class="privacy-gap"><strong>Not captured by choice</strong><p>${escapeHtml(step.reason)}</p><p>No command or output was stored.</p></div>`;
  }
  return `<article class="play-card" aria-labelledby="step-heading"><div class="step-kicker">Step ${index + 1} of ${session?.steps.length ?? 0} · ${displayDate(step.at)}</div><div class="play-title"><h2 id="step-heading">${escapeHtml(stepLabel(step))}</h2>${resultBadge(step)}</div>${step.hypothesis ? `<section class="hypothesis"><h3>Student hypothesis</h3><p>${escapeHtml(step.hypothesis)}</p></section>` : ''}${step.annotation ? `<section><h3>What changed / what I learned</h3><p>${escapeHtml(step.annotation)}</p></section>` : ''}${evidence}${step.maskedCount ? `<p class="scrub-report"><span aria-hidden="true">▨</span> ${step.maskedCount} sensitive ${step.maskedCount === 1 ? 'value was' : 'values were'} masked before saving.</p>` : ''}</article>`;
}

function renderCaptureForm(): string {
  const common = `<label>Hypothesis before this step<textarea name="hypothesis" rows="2" placeholder="I think the loop stops one item early because…"></textarea></label><label>What changed / what I learned<textarea name="annotation" rows="2" placeholder="The result showed me…"></textarea></label><label>Extra words to mask in this step <span class="optional">optional, discarded after saving</span><input name="masks" autocomplete="off" placeholder="project codename, private hostname" /></label>`;
  if (captureKind === 'file') {
    return `<form id="file-form" class="capture-form"><label>File name<input name="fileName" required placeholder="src/cart.ts" /></label><div class="snapshot-grid"><label>Before snapshot<textarea class="code-input" name="before" rows="9" spellcheck="false"></textarea></label><label>Current snapshot<textarea class="code-input" name="after" rows="9" spellcheck="false" required></textarea></label></div>${common}<button class="button primary" type="submit">Add file diff</button></form>`;
  }
  if (captureKind === 'note') {
    return `<form id="note-form" class="capture-form"><label>Reasoning note<textarea name="note" rows="5" required placeholder="I paused here because…"></textarea></label>${common}<button class="button primary" type="submit">Add reasoning note</button></form>`;
  }
  return `<form id="command-form" class="capture-form"><label>Command<input class="code-input" name="command" required autocomplete="off" spellcheck="false" placeholder="npm test -- cart" /></label><label>Output to include <span class="optional">paste only what helps the tutor</span><textarea class="code-input" name="output" rows="7" spellcheck="false"></textarea></label><div class="form-row"><label>Result<select name="result"><option value="failed">Failed</option><option value="passed">Passed</option><option value="unknown">Not sure</option></select></label><label>Exit code <span class="optional">optional</span><input name="exitCode" type="number" inputmode="numeric" /></label></div>${common}<label class="check"><input name="exclude" type="checkbox" /> <span><strong>Exclude this command entirely</strong><small>Stores a private gap, never the command or output.</small></span></label><button class="button primary" type="submit">Add command step</button></form>`;
}

function tutorLens(): string {
  if (!session) return '';
  if (!license.unlocked) {
    return `<section class="paid-callout" aria-labelledby="lens-title"><div><span class="eyebrow">Tutor Lens · Plus</span><h2 id="lens-title">Jump between hypotheses.</h2><p>Plus builds a compact review map and print debrief. Capture, playback, masking and export stay free.</p></div><div class="paid-actions"><a class="button dark" href="${CHECKOUT_URL}" target="_blank" rel="noreferrer">Buy Plus · ${PRICE_LABEL}</a><button class="button text-button" type="button" data-action="show-license">I have a license</button></div></section>`;
  }
  const insights = session.steps.map((step, index) => ({ step, index })).filter(({ step }) => step.hypothesis || (step.kind === 'command' && step.result === 'failed'));
  return `<section class="lens" aria-labelledby="lens-title"><div class="lens-head"><div><span class="eyebrow">Tutor Lens · unlocked</span><h2 id="lens-title">Reasoning map</h2></div><button class="button secondary" data-action="print">Print debrief</button></div>${insights.length ? `<ol class="lens-list">${insights.map(({ step, index }) => `<li><button type="button" data-select="${index}"><span>${index + 1}</span><strong>${escapeHtml(step.hypothesis || stepLabel(step))}</strong>${step.kind === 'command' ? resultBadge(step) : ''}</button></li>`).join('')}</ol>` : '<p>Add hypotheses or a failed run to populate this map.</p>'}</section>`;
}

function renderLicenseDialog(): string {
  return `<dialog id="license-dialog" aria-labelledby="license-title"><form method="dialog"><button class="icon-button dialog-close" value="cancel" aria-label="Close license dialog">×</button></form><span class="eyebrow">Plus unlock</span><h2 id="license-title">Restore your purchase</h2><p>Paste the license token from your Sociobot receipt. Verification needs a connection the first time, then works from the cached verdict for up to a day.</p><form id="license-form"><label>License token<input name="license" required autocomplete="off" /></label><div class="dialog-actions"><button class="button primary" type="submit">Verify license</button><a href="${CHECKOUT_URL}" target="_blank" rel="noreferrer">Buy for ${PRICE_LABEL}</a></div></form><p class="muted">Sociobot/Dodo is the merchant of record. A refunded or revoked license locks Plus again.</p></dialog>`;
}

function renderEmpty(): string {
  return `<header class="app-header"><a class="brand" href="https://remote-code-lesson-replay.sociobot.in" target="_blank"><img src="/icons/icon-48.png" width="40" height="40" alt="" />Code Lesson Replay</a><span class="local-pill">Local only</span></header><main id="main">${renderNotice()}<div class="empty-main"><section class="empty-copy"><span class="eyebrow">Student-controlled capture</span><h1>Record the reasoning.<br /><mark>Skip the surveillance.</mark></h1><p>Build a short trail of commands, chosen output, named file diffs and hypotheses for your tutor. Nothing is recorded automatically.</p><ul class="promise-list"><li><strong>Opt in</strong> to every step</li><li><strong>Mask secrets</strong> before storage</li><li><strong>Export one file</strong> for your tutor</li></ul></section><section class="start-sheet" aria-labelledby="start-title"><span class="sheet-number">01 / start</span><h2 id="start-title">New replay</h2><form id="new-session-form"><label>Replay title<input name="title" required autofocus placeholder="Debugging the cart total" /></label><label>Student name <span class="optional">optional</span><input name="student" autocomplete="off" /></label><label>Goal <span class="optional">optional</span><textarea name="goal" rows="3" placeholder="Find why the total doubles after removing an item"></textarea></label><button class="button primary" type="submit">Start private replay</button></form><div class="or"><span>or</span></div><label class="button secondary file-button">Open a tutor bundle<input class="visually-hidden" data-import type="file" accept=".json,.lesson-replay.json,application/json" /></label><p class="microcopy">Stored only in this browser extension. No account, audio, webcam or keystroke capture.</p></section></div></main>${renderLicenseDialog()}`;
}

function renderStudio(): string {
  if (!session) return renderEmpty();
  const step = session.steps[selected];
  const tabs = (['command', 'file', 'note'] as const).map((kind) => {
    const label = kind === 'file' ? 'File diff' : kind[0]!.toUpperCase() + kind.slice(1);
    return `<button id="tab-${kind}" role="tab" aria-controls="capture-panel-${kind}" aria-selected="${captureKind === kind}" tabindex="${captureKind === kind ? '0' : '-1'}" data-kind="${kind}">${label}</button>`;
  }).join('');
  return `<header class="app-header"><a class="brand" href="#main"><img src="/icons/icon-48.png" width="40" height="40" alt="" />Code Lesson Replay</a><div class="header-actions"><span class="local-pill">Saved locally</span><button class="button secondary compact" data-action="new">New</button><button class="button primary compact" data-action="export" ${session.steps.length ? '' : 'disabled'}>Export bundle</button></div></header><main id="main" class="studio"><section class="session-head"><div><span class="eyebrow">Current replay · ${escapeHtml(session.student || 'student')}</span><h1>${escapeHtml(session.title)}</h1><p>${escapeHtml(session.goal || 'Capture the decision trail, one chosen step at a time.')}</p></div><div class="session-stats"><strong>${session.steps.length}</strong><span>${session.steps.length === 1 ? 'step' : 'steps'}</span></div></section>${renderNotice()}<section class="work-grid"><div class="capture-panel"><div class="panel-heading"><div><span class="eyebrow">Student desk</span><h2>Add only what matters</h2></div><span class="privacy-mark">● opt-in</span></div><div class="tabs" role="tablist" aria-label="Step type">${tabs}</div><div id="capture-panel-${captureKind}" role="tabpanel" aria-labelledby="tab-${captureKind}">${renderCaptureForm()}</div></div><div class="play-panel"><div class="panel-heading"><div><span class="eyebrow">Tutor playback</span><h2>Decision trail</h2></div>${session.steps.length ? `<span class="step-counter">${selected + 1} / ${session.steps.length}</span>` : ''}</div>${session.steps.length ? `<div class="timeline" aria-label="Replay steps">${session.steps.map((item, index) => `<button type="button" data-select="${index}" aria-current="${index === selected ? 'step' : 'false'}" aria-label="Step ${index + 1}: ${escapeHtml(stepLabel(item))}"><span>${String(index + 1).padStart(2, '0')}</span>${resultBadge(item)}</button>`).join('')}</div>${step ? renderStep(step, selected) : ''}<div class="player-controls"><button class="button secondary" data-action="previous" ${selected === 0 ? 'disabled' : ''}>← Previous</button><button class="button secondary" data-action="delete-step">Delete step</button><button class="button primary" data-action="next" ${selected >= session.steps.length - 1 ? 'disabled' : ''}>Next →</button></div><p class="keyboard-hint">Use ← and → to move through the replay.</p>` : `<div class="empty-state"><span aria-hidden="true">↳</span><h3>Your trail starts here.</h3><p>Add a command, file diff or reasoning note. Your tutor will see this exact sequence.</p></div>`}</div></section>${tutorLens()}<section class="bundle-bar"><div><h2>Move the replay, not your workspace.</h2><p>The export is a readable JSON file with chosen snapshots. Review it here on another device; no cloud upload needed.</p></div><div><label class="button secondary file-button">Import bundle<input class="visually-hidden" data-import type="file" accept=".json,.lesson-replay.json,application/json" /></label><button class="button primary" data-action="export" ${session.steps.length ? '' : 'disabled'}>Export bundle</button></div></section></main><footer><p>Private by design · no analytics · no arbitrary keystrokes</p><div><a href="https://remote-code-lesson-replay.sociobot.in/privacy" target="_blank">Privacy</a><a href="https://remote-code-lesson-replay.sociobot.in/terms" target="_blank">Terms</a><button class="link-button" data-action="show-license">License</button></div></footer>${renderLicenseDialog()}`;
}

function render(): void {
  app.innerHTML = session ? renderStudio() : renderEmpty();
}

function createBase(kind: ReplayStep['kind'], hypothesis: string, annotation: string, maskedCount: number) {
  return { id: crypto.randomUUID(), at: new Date().toISOString(), kind, hypothesis, annotation, maskedCount };
}

async function addStep(step: ReplayStep): Promise<void> {
  if (!session) return;
  session.steps.push(step);
  selected = session.steps.length - 1;
  setNotice(step.maskedCount ? `${step.maskedCount} sensitive ${step.maskedCount === 1 ? 'value was' : 'values were'} masked before saving.` : 'Step saved locally.', 'success');
  await saveSession();
  render();
}

function downloadBundle(): void {
  if (!session || !session.steps.length) return;
  const blob = new Blob([JSON.stringify(toBundle(session), null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = safeFilename(session.title);
  anchor.click();
  URL.revokeObjectURL(url);
  setNotice('Bundle exported. Share that file directly with your tutor.', 'success');
  render();
}

async function importFile(file: File): Promise<void> {
  try {
    session = parseBundle(await file.text()).session;
    selected = 0;
    await saveSession();
    setNotice(`Opened “${session.title}”. The original snapshots are preserved.`, 'success');
    render();
  } catch (error) {
    setNotice(error instanceof Error ? error.message : 'The replay could not be opened.', 'error');
    render();
  }
}

app.addEventListener('submit', async (event) => {
  const form = event.target as HTMLFormElement;
  event.preventDefault();
  const data = new FormData(form);
  if (form.id === 'new-session-form') {
    const titleInput = form.elements.namedItem('title') as HTMLInputElement;
    if (!titleInput.value.trim()) {
      titleInput.setCustomValidity('Enter a replay title with at least one visible character.');
      titleInput.reportValidity();
      return;
    }
    titleInput.setCustomValidity('');
    session = newSession(titleInput.value, String(data.get('student')), String(data.get('goal')));
    selected = 0;
    await saveSession();
    setNotice('Private replay started. Nothing is captured until you add a step.', 'success');
    render();
  } else if (form.id === 'command-form') {
    const masks = parseExtraMasks(data.get('masks'));
    if (data.get('exclude')) {
      const [hypothesis, annotation] = scrubFields([String(data.get('hypothesis')), String(data.get('annotation'))], masks).values;
      await addStep({ ...createBase('excluded', hypothesis!, annotation!, 0), kind: 'excluded', reason: 'Student marked this command private.' });
      return;
    }
    const scrubbed = scrubFields([String(data.get('command')), String(data.get('output')), String(data.get('hypothesis')), String(data.get('annotation'))], masks);
    const exitText = String(data.get('exitCode') ?? '');
    await addStep({ ...createBase('command', scrubbed.values[2]!, scrubbed.values[3]!, scrubbed.count), kind: 'command', command: scrubbed.values[0]!, output: scrubbed.values[1]!, result: String(data.get('result')) as RunResult, exitCode: exitText === '' ? null : Number(exitText) });
  } else if (form.id === 'file-form') {
    const masks = parseExtraMasks(data.get('masks'));
    const scrubbed = scrubFields([String(data.get('fileName')), String(data.get('before')), String(data.get('after')), String(data.get('hypothesis')), String(data.get('annotation'))], masks);
    await addStep({ ...createBase('file', scrubbed.values[3]!, scrubbed.values[4]!, scrubbed.count), kind: 'file', fileName: scrubbed.values[0]!, before: scrubbed.values[1]!, after: scrubbed.values[2]!, diff: createLineDiff(scrubbed.values[1]!, scrubbed.values[2]!) });
  } else if (form.id === 'note-form') {
    const masks = parseExtraMasks(data.get('masks'));
    const scrubbed = scrubFields([String(data.get('note')), String(data.get('hypothesis')), String(data.get('annotation'))], masks);
    await addStep({ ...createBase('note', scrubbed.values[1]!, scrubbed.values[2]!, scrubbed.count), kind: 'note', note: scrubbed.values[0]! });
  } else if (form.id === 'license-form') {
    try {
      storeLicense(String(data.get('license')));
      license = await verifyLicense(true);
      if (!license.unlocked) throw new Error(license.reason === 'offline-unverified' ? 'Connect once to verify this license.' : 'That license is not active for Code Lesson Replay.');
      setNotice('Plus unlocked on this browser.', 'success');
      (document.querySelector('#license-dialog') as HTMLDialogElement | null)?.close();
      render();
    } catch (error) {
      const input = form.querySelector('input')!;
      input.setAttribute('aria-invalid', 'true');
      setNotice(error instanceof Error ? error.message : 'License verification failed.', 'error');
      render();
    }
  }
});

app.addEventListener('change', (event) => {
  const input = event.target as HTMLInputElement;
  if (input.matches('[data-import]') && input.files?.[0]) void importFile(input.files[0]);
});

app.addEventListener('input', (event) => {
  const input = event.target as HTMLInputElement;
  if (input.name === 'title') input.setCustomValidity('');
});

function activateCaptureKind(kind: ReplayStep['kind']): void {
  captureKind = kind;
  render();
  document.querySelector<HTMLElement>(`[data-kind="${kind}"]`)?.focus();
}

app.addEventListener('click', async (event) => {
  const target = (event.target as HTMLElement).closest<HTMLElement>('[data-action], [data-kind], [data-select]');
  if (!target) return;
  if (target.dataset.kind) {
    activateCaptureKind(target.dataset.kind as ReplayStep['kind']);
    return;
  }
  if (target.dataset.select) {
    selected = Number(target.dataset.select);
    render();
    document.querySelector('#step-heading')?.scrollIntoView({ block: 'nearest' });
    return;
  }
  switch (target.dataset.action) {
    case 'export': downloadBundle(); break;
    case 'dismiss': notice = ''; render(); break;
    case 'previous': selected = Math.max(0, selected - 1); render(); break;
    case 'next': selected = Math.min((session?.steps.length ?? 1) - 1, selected + 1); render(); break;
    case 'print': window.print(); break;
    case 'show-license': (document.querySelector('#license-dialog') as HTMLDialogElement)?.showModal(); break;
    case 'new':
      if (session?.steps.length && !window.confirm(`Start a new replay? Export “${session.title}” first if you want to keep it.`)) return;
      session = null;
      await browser.storage.local.remove(STORAGE_KEY);
      render();
      break;
    case 'delete-step':
      if (!session || !session.steps[selected]) return;
      if (!window.confirm(`Delete step ${selected + 1}, “${stepLabel(session.steps[selected]!)}”? This cannot be undone unless you exported a bundle.`)) return;
      session.steps.splice(selected, 1);
      selected = Math.max(0, Math.min(selected, session.steps.length - 1));
      await saveSession();
      setNotice('Step deleted.', 'info');
      render();
      break;
  }
});

window.addEventListener('keydown', (event) => {
  const target = event.target as HTMLElement;
  const tab = target.closest<HTMLElement>('[role="tab"]');
  if (tab && ['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) {
    const tabs = [...document.querySelectorAll<HTMLElement>('[role="tab"]')];
    const current = tabs.indexOf(tab);
    const next = event.key === 'Home' ? 0 : event.key === 'End' ? tabs.length - 1 : (current + (event.key === 'ArrowRight' ? 1 : -1) + tabs.length) % tabs.length;
    event.preventDefault();
    activateCaptureKind(tabs[next]!.dataset.kind as ReplayStep['kind']);
    return;
  }
  if (!session?.steps.length || (event.target as HTMLElement).matches('input, textarea, select')) return;
  if (event.key === 'ArrowLeft' && selected > 0) { selected -= 1; render(); }
  if (event.key === 'ArrowRight' && selected < session.steps.length - 1) { selected += 1; render(); }
});

async function start(): Promise<void> {
  acceptLicenseFromUrl();
  await loadSession();
  render();
  license = await verifyLicense();
  render();
}

void start();
