/**
 * Tests for pipeline/transform.ts
 */

import { describe, it, expect } from 'vitest';
import {
  createDataset,
  mapRows,
  aggregate,
  innerJoin,
  pivot,
  normalize,
  fillNulls,
  concat,
} from '../src/pipeline/index.js';

describe('mapRows', () => {
  it('transforms each row', () => {
    const ds = createDataset([{ x: 1 }, { x: 2 }, { x: 3 }]);
    const result = mapRows(ds, (row) => ({ ...row, x: (row.x as number) * 2 }));
    expect(result.rows.map((r) => r.x)).toEqual([2, 4, 6]);
  });

  it('provides index', () => {
    const ds = createDataset([{ v: 'a' }, { v: 'b' }]);
    const result = mapRows(ds, (row, i) => ({ ...row, idx: i }));
    expect(result.rows[0].idx).toBe(0);
    expect(result.rows[1].idx).toBe(1);
  });
});

describe('aggregate', () => {
  const data = createDataset([
    { dept: 'eng', salary: 100 },
    { dept: 'eng', salary: 120 },
    { dept: 'sales', salary: 80 },
    { dept: 'sales', salary: 90 },
    { dept: 'sales', salary: 70 },
  ]);

  it('computes sum aggregation', () => {
    const result = aggregate(data, 'dept', {
      total: { column: 'salary', fn: 'sum' },
    });
    const eng = result.rows.find((r) => r.dept === 'eng');
    expect(eng?.total).toBe(220);
  });

  it('computes avg aggregation', () => {
    const result = aggregate(data, 'dept', {
      avg: { column: 'salary', fn: 'avg' },
    });
    const sales = result.rows.find((r) => r.dept === 'sales');
    expect(sales?.avg).toBe(80);
  });

  it('computes count aggregation', () => {
    const result = aggregate(data, 'dept', {
      n: { column: 'salary', fn: 'count' },
    });
    const eng = result.rows.find((r) => r.dept === 'eng');
    expect(eng?.n).toBe(2);
  });

  it('computes min/max aggregation', () => {
    const result = aggregate(data, 'dept', {
      lo: { column: 'salary', fn: 'min' },
      hi: { column: 'salary', fn: 'max' },
    });
    const sales = result.rows.find((r) => r.dept === 'sales');
    expect(sales?.lo).toBe(70);
    expect(sales?.hi).toBe(90);
  });
});

describe('innerJoin', () => {
  it('joins datasets on matching keys', () => {
    const left = createDataset([
      { id: 1, name: 'Alice' },
      { id: 2, name: 'Bob' },
      { id: 3, name: 'Charlie' },
    ]);
    const right = createDataset([
      { id: 1, score: 90 },
      { id: 2, score: 85 },
      { id: 4, score: 70 },
    ]);
    const joined = innerJoin(left, right, 'id', 'id');
    expect(joined.rows).toHaveLength(2);
    expect(joined.rows[0].name).toBe('Alice');
    expect(joined.rows[0].score).toBe(90);
  });

  it('handles no matches', () => {
    const left = createDataset([{ id: 1 }]);
    const right = createDataset([{ id: 2 }]);
    const joined = innerJoin(left, right, 'id', 'id');
    expect(joined.rows).toHaveLength(0);
  });
});

describe('pivot', () => {
  it('pivots data', () => {
    const data = createDataset([
      { year: 2024, quarter: 'Q1', sales: 100 },
      { year: 2024, quarter: 'Q2', sales: 150 },
      { year: 2025, quarter: 'Q1', sales: 120 },
    ]);
    const pivoted = pivot(data, 'year', 'quarter', 'sales');
    expect(pivoted.rows).toHaveLength(2);
    const row2024 = pivoted.rows.find((r) => r.year === 2024);
    expect(row2024?.Q1).toBe(100);
    expect(row2024?.Q2).toBe(150);
  });
});

describe('normalize', () => {
  it('normalizes values to 0-1 range', () => {
    const data = createDataset([{ v: 0 }, { v: 50 }, { v: 100 }]);
    const normalized = normalize(data, 'v');
    expect(normalized.rows[0].v).toBe(0);
    expect(normalized.rows[1].v).toBe(0.5);
    expect(normalized.rows[2].v).toBe(1);
  });

  it('handles constant values', () => {
    const data = createDataset([{ v: 5 }, { v: 5 }]);
    const normalized = normalize(data, 'v');
    expect(normalized.rows[0].v).toBe(0);
  });
});

describe('fillNulls', () => {
  it('fills null values', () => {
    const data = createDataset([
      { x: 1 },
      { x: null },
      { x: 3 },
    ]);
    const filled = fillNulls(data, 'x', 0);
    expect(filled.rows[1].x).toBe(0);
  });

  it('fills undefined values', () => {
    const data = createDataset([{ x: 1 }, { x: undefined }]);
    const filled = fillNulls(data, 'x', -1);
    expect(filled.rows[1].x).toBe(-1);
  });
});

describe('concat', () => {
  it('concatenates datasets', () => {
    const a = createDataset([{ x: 1 }], 'a');
    const b = createDataset([{ x: 2 }, { x: 3 }], 'b');
    const combined = concat(a, b);
    expect(combined.rows).toHaveLength(3);
  });

  it('preserves first dataset name', () => {
    const a = createDataset([{ x: 1 }], 'first');
    const b = createDataset([{ x: 2 }], 'second');
    const combined = concat(a, b);
    expect(combined.metadata.name).toBe('first');
  });
});
