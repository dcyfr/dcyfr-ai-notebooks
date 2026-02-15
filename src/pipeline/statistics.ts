/**
 * Statistics - Descriptive statistics and analysis
 */

import type { CorrelationEntry, Dataset, DescriptiveStats } from '../types/index.js';
import { getNumericColumn } from './dataset.js';

/**
 * Calculate sum
 */
export function sum(values: number[]): number {
  return values.reduce((a, b) => a + b, 0);
}

/**
 * Calculate mean
 */
export function mean(values: number[]): number {
  if (values.length === 0) return 0;
  return sum(values) / values.length;
}

/**
 * Calculate median
 */
export function median(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0
    ? (sorted[mid - 1] + sorted[mid]) / 2
    : sorted[mid];
}

/**
 * Calculate variance
 */
export function variance(values: number[]): number {
  if (values.length < 2) return 0;
  const avg = mean(values);
  return values.reduce((s, v) => s + (v - avg) ** 2, 0) / (values.length - 1);
}

/**
 * Calculate standard deviation
 */
export function stddev(values: number[]): number {
  return Math.sqrt(variance(values));
}

/**
 * Calculate quantile
 */
export function quantile(values: number[], q: number): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const pos = (sorted.length - 1) * q;
  const base = Math.floor(pos);
  const rest = pos - base;
  if (sorted[base + 1] !== undefined) {
    return sorted[base] + rest * (sorted[base + 1] - sorted[base]);
  }
  return sorted[base];
}

/**
 * Calculate Pearson correlation coefficient between two arrays
 */
export function pearsonCorrelation(a: number[], b: number[]): number {
  const n = Math.min(a.length, b.length);
  if (n < 2) return 0;

  const meanA = mean(a.slice(0, n));
  const meanB = mean(b.slice(0, n));

  let sumAB = 0;
  let sumA2 = 0;
  let sumB2 = 0;

  for (let i = 0; i < n; i++) {
    const da = a[i] - meanA;
    const db = b[i] - meanB;
    sumAB += da * db;
    sumA2 += da * da;
    sumB2 += db * db;
  }

  const denom = Math.sqrt(sumA2 * sumB2);
  return denom === 0 ? 0 : sumAB / denom;
}

/**
 * Calculate descriptive statistics for a numeric column
 */
export function describeColumn(dataset: Dataset, column: string): DescriptiveStats {
  const values = getNumericColumn(dataset, column);
  const allValues = dataset.rows.map((r) => r[column]);
  const nullCount = allValues.filter((v) => v === null || v === undefined).length;

  return {
    column,
    count: values.length,
    mean: mean(values),
    median: median(values),
    min: values.length > 0 ? Math.min(...values) : 0,
    max: values.length > 0 ? Math.max(...values) : 0,
    stddev: stddev(values),
    variance: variance(values),
    q25: quantile(values, 0.25),
    q75: quantile(values, 0.75),
    nullCount,
  };
}

/**
 * Describe all numeric columns in a dataset
 */
export function describe(dataset: Dataset): DescriptiveStats[] {
  return dataset.metadata.columns
    .filter((c) => c.type === 'number')
    .map((c) => describeColumn(dataset, c.name));
}

/**
 * Calculate correlation matrix for numeric columns
 */
export function correlationMatrix(dataset: Dataset): CorrelationEntry[] {
  const numericCols = dataset.metadata.columns
    .filter((c) => c.type === 'number')
    .map((c) => c.name);

  const entries: CorrelationEntry[] = [];

  for (let i = 0; i < numericCols.length; i++) {
    for (let j = i; j < numericCols.length; j++) {
      const a = getNumericColumn(dataset, numericCols[i]);
      const b = getNumericColumn(dataset, numericCols[j]);
      const coeff = i === j ? 1 : pearsonCorrelation(a, b);

      entries.push({
        columnA: numericCols[i],
        columnB: numericCols[j],
        coefficient: coeff,
      });

      if (i !== j) {
        entries.push({
          columnA: numericCols[j],
          columnB: numericCols[i],
          coefficient: coeff,
        });
      }
    }
  }

  return entries;
}

/**
 * Count value frequencies in a column
 */
export function valueCounts(dataset: Dataset, column: string): Map<unknown, number> {
  const counts = new Map<unknown, number>();
  for (const row of dataset.rows) {
    const val = row[column];
    counts.set(val, (counts.get(val) ?? 0) + 1);
  }
  return counts;
}

/**
 * Calculate the number of missing values per column
 */
export function missingValues(dataset: Dataset): Record<string, number> {
  const result: Record<string, number> = {};
  for (const col of dataset.metadata.columns) {
    result[col.name] = dataset.rows.filter(
      (r) => r[col.name] === null || r[col.name] === undefined
    ).length;
  }
  return result;
}
