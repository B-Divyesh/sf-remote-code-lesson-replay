export const REPLAY_SCHEMA = 'code-lesson-replay/v1' as const;
export const MAX_BUNDLE_BYTES = 5_000_000;

export type StepKind = 'command' | 'file' | 'note' | 'excluded';
export type RunResult = 'passed' | 'failed' | 'unknown';

interface BaseStep {
  id: string;
  at: string;
  kind: StepKind;
  annotation: string;
  hypothesis: string;
  maskedCount: number;
}

export interface CommandStep extends BaseStep {
  kind: 'command';
  command: string;
  output: string;
  result: RunResult;
  exitCode: number | null;
}

export interface FileStep extends BaseStep {
  kind: 'file';
  fileName: string;
  before: string;
  after: string;
  diff: DiffLine[];
}

export interface NoteStep extends BaseStep {
  kind: 'note';
  note: string;
}

export interface ExcludedStep extends BaseStep {
  kind: 'excluded';
  reason: string;
}

export type ReplayStep = CommandStep | FileStep | NoteStep | ExcludedStep;

export interface ReplaySession {
  id: string;
  title: string;
  student: string;
  goal: string;
  createdAt: string;
  updatedAt: string;
  source: 'manual-opt-in';
  steps: ReplayStep[];
}

export interface ReplayBundle {
  schema: typeof REPLAY_SCHEMA;
  exportedAt: string;
  generator: 'Code Lesson Replay';
  session: ReplaySession;
}

export interface DiffLine {
  type: 'same' | 'add' | 'remove';
  text: string;
}

export interface MaskResult {
  value: string;
  count: number;
}

const builtInMasks: Array<{ name: string; pattern: RegExp }> = [
  { name: 'private-key', pattern: /-----BEGIN(?: RSA| EC| OPENSSH)? PRIVATE KEY-----[\s\S]*?-----END(?: RSA| EC| OPENSSH)? PRIVATE KEY-----/gi },
  { name: 'bearer-token', pattern: /\bBearer\s+[A-Za-z0-9._~+\/-]{12,}={0,2}/gi },
  { name: 'api-key', pattern: /\b(?:sk|pk|ghp|github_pat|xox[baprs])-?[A-Za-z0-9_-]{12,}\b/g },
  { name: 'aws-key', pattern: /\b(?:AKIA|ASIA)[A-Z0-9]{16}\b/g },
  { name: 'assignment', pattern: /\b([A-Z][A-Z0-9_]*(?:TOKEN|SECRET|PASSWORD|PASSWD|API_KEY|PRIVATE_KEY)[A-Z0-9_]*)\s*=\s*([^\s'\"]+|'[^']*'|\"[^\"]*\")/gi },
  { name: 'url-credential', pattern: /\b(https?:\/\/)[^\s/:]+:[^\s/@]+@/gi }
];

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export function maskSecrets(input: string, customTerms: string[] = []): MaskResult {
  let value = input;
  let count = 0;
  for (const mask of builtInMasks) {
    value = value.replace(mask.pattern, (match, assignmentName: string | undefined) => {
      count += 1;
      if (mask.name === 'assignment' && assignmentName) return `${assignmentName}=[MASKED:secret]`;
      if (mask.name === 'url-credential') return `${match.startsWith('https://') ? 'https://' : 'http://'}[MASKED:credentials]@`;
      return `[MASKED:${mask.name}]`;
    });
  }
  for (const term of customTerms.map((item) => item.trim()).filter((item) => item.length >= 3)) {
    value = value.replace(new RegExp(escapeRegExp(term), 'gi'), () => {
      count += 1;
      return '[MASKED:custom]';
    });
  }
  return { value, count };
}

export function createLineDiff(before: string, after: string): DiffLine[] {
  const left = before.replace(/\r\n/g, '\n').split('\n');
  const right = after.replace(/\r\n/g, '\n').split('\n');

  if (left.length * right.length > 360_000) {
    return [
      { type: 'remove', text: `[Previous snapshot: ${left.length} lines]` },
      { type: 'add', text: `[Current snapshot: ${right.length} lines — full snapshots are preserved in the bundle]` }
    ];
  }

  const table = Array.from({ length: left.length + 1 }, () => new Uint16Array(right.length + 1));
  for (let i = left.length - 1; i >= 0; i -= 1) {
    for (let j = right.length - 1; j >= 0; j -= 1) {
      table[i]![j] = left[i] === right[j]
        ? table[i + 1]![j + 1]! + 1
        : Math.max(table[i + 1]![j]!, table[i]![j + 1]!);
    }
  }

  const output: DiffLine[] = [];
  let i = 0;
  let j = 0;
  while (i < left.length && j < right.length) {
    if (left[i] === right[j]) {
      output.push({ type: 'same', text: left[i]! });
      i += 1;
      j += 1;
    } else if (table[i + 1]![j]! >= table[i]![j + 1]!) {
      output.push({ type: 'remove', text: left[i]! });
      i += 1;
    } else {
      output.push({ type: 'add', text: right[j]! });
      j += 1;
    }
  }
  while (i < left.length) output.push({ type: 'remove', text: left[i++]! });
  while (j < right.length) output.push({ type: 'add', text: right[j++]! });
  return output;
}

export function newSession(title: string, student = '', goal = ''): ReplaySession {
  const now = new Date().toISOString();
  return {
    id: crypto.randomUUID(),
    title: title.trim(),
    student: student.trim(),
    goal: goal.trim(),
    createdAt: now,
    updatedAt: now,
    source: 'manual-opt-in',
    steps: []
  };
}

export function toBundle(session: ReplaySession): ReplayBundle {
  return {
    schema: REPLAY_SCHEMA,
    exportedAt: new Date().toISOString(),
    generator: 'Code Lesson Replay',
    session
  };
}

function isString(value: unknown): value is string {
  return typeof value === 'string';
}

export function parseBundle(raw: string): ReplayBundle {
  if (new TextEncoder().encode(raw).byteLength > MAX_BUNDLE_BYTES) {
    throw new Error('That file is over 5 MB. Ask the student to split the replay into shorter sessions.');
  }
  let value: unknown;
  try {
    value = JSON.parse(raw);
  } catch {
    throw new Error('This is not valid JSON. Choose a .lesson-replay.json bundle.');
  }
  const bundle = value as Partial<ReplayBundle>;
  const session = bundle.session as Partial<ReplaySession> | undefined;
  if (bundle.schema !== REPLAY_SCHEMA || bundle.generator !== 'Code Lesson Replay' || !session) {
    throw new Error('This is not a Code Lesson Replay v1 bundle.');
  }
  if (!isString(session.id) || !isString(session.title) || !isString(session.createdAt) || !Array.isArray(session.steps)) {
    throw new Error('The replay bundle is missing required session details.');
  }
  if (session.steps.length > 500) throw new Error('This replay has more than 500 steps and cannot be opened safely.');
  const allowed = new Set<StepKind>(['command', 'file', 'note', 'excluded']);
  if (session.steps.some((step) => !step || typeof step !== 'object' || !allowed.has((step as ReplayStep).kind))) {
    throw new Error('The replay contains an unsupported step type.');
  }
  return bundle as ReplayBundle;
}

export function safeFilename(title: string): string {
  const stem = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 48);
  return `${stem || 'lesson'}.lesson-replay.json`;
}
