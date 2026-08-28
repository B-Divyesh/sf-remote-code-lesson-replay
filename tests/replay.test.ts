import { describe, expect, it } from 'vitest';
import { createLineDiff, maskSecrets, newSession, parseBundle, safeFilename, toBundle } from '../src/replay';

describe('secret masking', () => {
  it('masks common credentials and custom terms', () => {
    const result = maskSecrets(
      'API_TOKEN=super-secret-value\nAuthorization: Bearer abcdefghijklmnop\nstudent-acme',
      ['student-acme']
    );
    expect(result.value).not.toContain('super-secret-value');
    expect(result.value).not.toContain('abcdefghijklmnop');
    expect(result.value).not.toContain('student-acme');
    expect(result.count).toBe(3);
  });

  it('does not alter ordinary code', () => {
    expect(maskSecrets('const answer = 42;').value).toBe('const answer = 42;');
  });
});

describe('line diff', () => {
  it('preserves unchanged, added and removed lines', () => {
    expect(createLineDiff('one\ntwo\nthree', 'one\n2\nthree')).toEqual([
      { type: 'same', text: 'one' },
      { type: 'remove', text: 'two' },
      { type: 'add', text: '2' },
      { type: 'same', text: 'three' }
    ]);
  });
});

describe('bundle format', () => {
  it('round-trips a replay bundle', () => {
    const session = newSession('Array lesson', 'Sam', 'Fix index error');
    expect(parseBundle(JSON.stringify(toBundle(session))).session.title).toBe('Array lesson');
    expect(safeFilename('Array lesson #1')).toBe('array-lesson-1.lesson-replay.json');
  });

  it('rejects unrelated JSON', () => {
    expect(() => parseBundle('{"hello":"world"}')).toThrow(/not a Code Lesson Replay/);
  });
});
