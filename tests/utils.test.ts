/**
 * Tests for utils module (csv, format, validation)
 */

import { describe, it, expect } from 'vitest';
import {
  parseCSV,
  toCSV,
  formatBytes,
  formatDuration,
  formatWithCommas,
  formatPercent,
  truncate,
  padTo,
  formatTimestamp,
  progressBar,
  validateDataset,
  required,
  isNumber,
  isString,
  inRange,
  matchesPattern,
  oneOf,
  stringLength,
  createDataset,
} from '../src/index.js';

describe('CSV Parsing', () => {
  it('parses basic CSV', () => {
    const csv = 'name,age\nAlice,25\nBob,30';
    const ds = parseCSV(csv);
    expect(ds.rows).toHaveLength(2);
    expect(ds.rows[0].name).toBe('Alice');
    expect(ds.rows[0].age).toBe(25); // auto-detected as number
  });

  it('parses CSV without header', () => {
    const csv = 'Alice,25\nBob,30';
    const ds = parseCSV(csv, { hasHeader: false });
    expect(ds.rows[0].col_0).toBe('Alice');
    expect(ds.rows[0].col_1).toBe(25);
  });

  it('handles quoted fields', () => {
    const csv = 'name,city\n"Smith, John","New York"';
    const ds = parseCSV(csv);
    expect(ds.rows[0].name).toBe('Smith, John');
    expect(ds.rows[0].city).toBe('New York');
  });

  it('handles escaped quotes', () => {
    const csv = 'val\n"He said ""hello"""';
    const ds = parseCSV(csv);
    expect(ds.rows[0].val).toBe('He said "hello"');
  });

  it('auto-detects booleans', () => {
    const csv = 'active\ntrue\nfalse';
    const ds = parseCSV(csv);
    expect(ds.rows[0].active).toBe(true);
    expect(ds.rows[1].active).toBe(false);
  });

  it('handles empty values as null', () => {
    const csv = 'a,b\n1,\n,2';
    const ds = parseCSV(csv);
    expect(ds.rows[0].b).toBeNull();
    expect(ds.rows[1].a).toBeNull();
  });

  it('handles custom delimiter', () => {
    const tsv = 'name\tage\nAlice\t25';
    const ds = parseCSV(tsv, { delimiter: '\t' });
    expect(ds.rows[0].name).toBe('Alice');
  });

  it('handles empty input', () => {
    const ds = parseCSV('');
    expect(ds.rows).toHaveLength(0);
  });

  it('assigns custom name', () => {
    const ds = parseCSV('x\n1', { name: 'my_data' });
    expect(ds.metadata.name).toBe('my_data');
  });
});

describe('CSV Generation', () => {
  it('converts dataset to CSV', () => {
    const ds = createDataset([
      { name: 'Alice', age: 25 },
      { name: 'Bob', age: 30 },
    ]);
    const csv = toCSV(ds);
    expect(csv).toContain('name,age');
    expect(csv).toContain('Alice,25');
    expect(csv).toContain('Bob,30');
  });

  it('escapes special characters', () => {
    const ds = createDataset([{ val: 'hello, world' }]);
    const csv = toCSV(ds);
    expect(csv).toContain('"hello, world"');
  });

  it('handles null values', () => {
    const ds = createDataset([{ a: 1, b: null }]);
    const csv = toCSV(ds);
    expect(csv).toContain('1,');
  });

  it('roundtrips CSV', () => {
    const original = createDataset([
      { name: 'Alice', score: 90 },
      { name: 'Bob', score: 85 },
    ]);
    const csv = toCSV(original);
    const parsed = parseCSV(csv);
    expect(parsed.rows).toHaveLength(2);
    expect(parsed.rows[0].name).toBe('Alice');
    expect(parsed.rows[0].score).toBe(90);
  });
});

describe('Format Utilities', () => {
  it('formats bytes', () => {
    expect(formatBytes(0)).toBe('0 B');
    expect(formatBytes(1024)).toBe('1.00 KB');
    expect(formatBytes(1048576)).toBe('1.00 MB');
    expect(formatBytes(1073741824)).toBe('1.00 GB');
  });

  it('formats duration', () => {
    expect(formatDuration(500)).toBe('500ms');
    expect(formatDuration(1500)).toBe('1.5s');
    expect(formatDuration(90000)).toBe('1m 30s');
  });

  it('formats with commas', () => {
    expect(formatWithCommas(1000000)).toContain('1');
  });

  it('formats percent', () => {
    expect(formatPercent(0.856)).toBe('85.6%');
    expect(formatPercent(1.0, 0)).toBe('100%');
  });

  it('truncates strings', () => {
    expect(truncate('hello world', 8)).toBe('hello...');
    expect(truncate('short', 10)).toBe('short');
  });

  it('pads strings', () => {
    expect(padTo('hi', 5, 'left')).toBe('hi   ');
    expect(padTo('hi', 5, 'right')).toBe('   hi');
    expect(padTo('hi', 6, 'center')).toBe('  hi  ');
  });

  it('formats timestamp', () => {
    const ts = formatTimestamp(0);
    expect(ts).toContain('1970');
  });

  it('renders progress bar', () => {
    const bar = progressBar(5, 10, 20);
    expect(bar).toContain('50%');
    expect(bar).toContain('5/10');
    expect(bar).toContain('█');
    expect(bar).toContain('░');
  });
});

describe('Data Validation', () => {
  it('validates required fields', () => {
    const ds = createDataset([{ name: 'Alice' }, { name: null }]);
    const result = validateDataset(ds, { name: [required()] });
    expect(result.valid).toBe(false);
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0].message).toContain('required');
  });

  it('validates number type', () => {
    const ds = createDataset([{ age: 25 }, { age: 'thirty' }]);
    const result = validateDataset(ds, { age: [isNumber()] });
    expect(result.valid).toBe(false);
    expect(result.errors[0].message).toContain('number');
  });

  it('validates string type', () => {
    const ds = createDataset([{ name: 'Alice' }, { name: 42 }]);
    const result = validateDataset(ds, { name: [isString()] });
    expect(result.valid).toBe(false);
  });

  it('validates range', () => {
    const ds = createDataset([{ score: 85 }, { score: 150 }]);
    const result = validateDataset(ds, { score: [inRange(0, 100)] });
    expect(result.valid).toBe(false);
    expect(result.errors[0].message).toContain('range');
  });

  it('validates pattern', () => {
    const ds = createDataset([{ email: 'a@b.com' }, { email: 'invalid' }]);
    const result = validateDataset(ds, { email: [matchesPattern(/@/)] });
    expect(result.valid).toBe(false);
  });

  it('validates oneOf', () => {
    const ds = createDataset([{ status: 'active' }, { status: 'unknown' }]);
    const result = validateDataset(ds, {
      status: [oneOf(['active', 'inactive'])],
    });
    expect(result.valid).toBe(false);
    expect(result.errors[0].message).toContain('allowed');
  });

  it('validates string length', () => {
    const ds = createDataset([{ code: 'AB' }, { code: 'ABCDEFGH' }]);
    const result = validateDataset(ds, {
      code: [stringLength(2, 5)],
    });
    expect(result.valid).toBe(false);
  });

  it('passes valid data', () => {
    const ds = createDataset([
      { name: 'Alice', age: 25 },
      { name: 'Bob', age: 30 },
    ]);
    const result = validateDataset(ds, {
      name: [required(), isString()],
      age: [required(), isNumber(), inRange(0, 150)],
    });
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('detects high null warnings', () => {
    const ds = createDataset([
      { x: null },
      { x: null },
      { x: null },
      { x: 1 },
    ]);
    const result = validateDataset(ds, {});
    expect(result.warnings.length).toBeGreaterThan(0);
    expect(result.warnings[0].message).toContain('null rate');
  });

  it('combines multiple validators', () => {
    const ds = createDataset([{ score: 'abc' }]);
    const result = validateDataset(ds, {
      score: [required(), isNumber(), inRange(0, 100)],
    });
    expect(result.errors.length).toBeGreaterThanOrEqual(1);
  });
});
