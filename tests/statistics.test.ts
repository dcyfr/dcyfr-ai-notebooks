/**
 * Tests for pipeline/statistics.ts
 */

import { describe, it, expect } from 'vitest';
import {
  sum,
  mean,
  median,
  variance,
  stddev,
  quantile,
  pearsonCorrelation,
  describeColumn,
  describe as describeDataset,
  correlationMatrix,
  valueCounts,
  missingValues,
  createDataset,
} from '../src/pipeline/index.js';

describe('Basic Statistics', () => {
  it('computes sum', () => {
    expect(sum([1, 2, 3, 4, 5])).toBe(15);
  });

  it('computes sum of empty array', () => {
    expect(sum([])).toBe(0);
  });

  it('computes mean', () => {
    expect(mean([2, 4, 6])).toBe(4);
  });

  it('computes mean of empty array', () => {
    expect(mean([])).toBe(0);
  });

  it('computes median of odd-length array', () => {
    expect(median([3, 1, 2])).toBe(2);
  });

  it('computes median of even-length array', () => {
    expect(median([1, 2, 3, 4])).toBe(2.5);
  });

  it('computes variance', () => {
    const v = variance([2, 4, 4, 4, 5, 5, 7, 9]);
    expect(v).toBeCloseTo(4.571, 2);
  });

  it('computes variance of single element', () => {
    expect(variance([5])).toBe(0);
  });

  it('computes stddev', () => {
    const sd = stddev([2, 4, 4, 4, 5, 5, 7, 9]);
    expect(sd).toBeCloseTo(2.138, 2);
  });
});

describe('Quantiles', () => {
  it('computes 25th percentile', () => {
    const q = quantile([1, 2, 3, 4, 5, 6, 7, 8, 9, 10], 0.25);
    expect(q).toBeCloseTo(3.25, 1);
  });

  it('computes 50th percentile (median)', () => {
    const q = quantile([1, 2, 3, 4, 5], 0.5);
    expect(q).toBe(3);
  });

  it('computes 75th percentile', () => {
    const q = quantile([1, 2, 3, 4, 5, 6, 7, 8, 9, 10], 0.75);
    expect(q).toBeCloseTo(7.75, 1);
  });
});

describe('Correlation', () => {
  it('computes perfect positive correlation', () => {
    const r = pearsonCorrelation([1, 2, 3, 4, 5], [2, 4, 6, 8, 10]);
    expect(r).toBeCloseTo(1.0, 5);
  });

  it('computes perfect negative correlation', () => {
    const r = pearsonCorrelation([1, 2, 3, 4, 5], [10, 8, 6, 4, 2]);
    expect(r).toBeCloseTo(-1.0, 5);
  });

  it('computes weak correlation for loosely related data', () => {
    const r = pearsonCorrelation([1, 2, 3, 4, 5], [5, 3, 1, 4, 2]);
    expect(Math.abs(r)).toBeLessThanOrEqual(0.5);
  });

  it('handles single element', () => {
    expect(pearsonCorrelation([1], [2])).toBe(0);
  });
});

describe('Dataset Statistics', () => {
  const data = createDataset([
    { name: 'A', value: 10, score: 80 },
    { name: 'B', value: 20, score: 90 },
    { name: 'C', value: 30, score: 85 },
    { name: 'D', value: null, score: 95 },
  ]);

  it('describes a column', () => {
    const stats = describeColumn(data, 'value');
    expect(stats.count).toBe(3); // null excluded
    expect(stats.mean).toBe(20);
    expect(stats.min).toBe(10);
    expect(stats.max).toBe(30);
    expect(stats.nullCount).toBe(1);
  });

  it('describes all numeric columns', () => {
    const allStats = describeDataset(data);
    const numericCols = allStats.map((s) => s.column);
    expect(numericCols).toContain('value');
    expect(numericCols).toContain('score');
    expect(numericCols).not.toContain('name');
  });

  it('computes correlation matrix', () => {
    const corr = correlationMatrix(data);
    expect(corr.length).toBeGreaterThan(0);
    // Self-correlation should be 1
    const self = corr.find((e) => e.columnA === 'score' && e.columnB === 'score');
    expect(self?.coefficient).toBe(1);
  });
});

describe('Value Counts', () => {
  it('counts values', () => {
    const data = createDataset([
      { color: 'red' },
      { color: 'blue' },
      { color: 'red' },
      { color: 'green' },
      { color: 'red' },
    ]);
    const counts = valueCounts(data, 'color');
    expect(counts.get('red')).toBe(3);
    expect(counts.get('blue')).toBe(1);
    expect(counts.get('green')).toBe(1);
  });
});

describe('Missing Values', () => {
  it('counts missing values per column', () => {
    const data = createDataset([
      { a: 1, b: 'x' },
      { a: null, b: 'y' },
      { a: 3, b: null },
      { a: null, b: null },
    ]);
    const missing = missingValues(data);
    expect(missing.a).toBe(2);
    expect(missing.b).toBe(2);
  });
});
