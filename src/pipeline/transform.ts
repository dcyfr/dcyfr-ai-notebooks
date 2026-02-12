/**
 * Data Transform - Data transformation utilities
 */

import type { DataRow, Dataset } from '../types/index.js';
import { createDataset, getNumericColumn } from './dataset.js';

/**
 * Apply a transformation to each row
 */
export function mapRows(
  dataset: Dataset,
  transform: (row: DataRow, index: number) => DataRow
): Dataset {
  return createDataset(
    dataset.rows.map((row, i) => transform(row, i)),
    dataset.metadata.name
  );
}

/**
 * Aggregate dataset by groups
 */
export function aggregate(
  dataset: Dataset,
  groupColumn: string,
  aggregations: Record<string, { column: string; fn: 'sum' | 'avg' | 'count' | 'min' | 'max' }>
): Dataset {
  const groups = new Map<unknown, DataRow[]>();
  for (const row of dataset.rows) {
    const key = row[groupColumn];
    const group = groups.get(key) ?? [];
    group.push(row);
    groups.set(key, group);
  }

  const result: DataRow[] = [];
  for (const [key, rows] of groups) {
    const aggregated: DataRow = { [groupColumn]: key };

    for (const [alias, spec] of Object.entries(aggregations)) {
      const values = rows
        .map((r) => r[spec.column])
        .filter((v): v is number => typeof v === 'number');

      switch (spec.fn) {
        case 'sum':
          aggregated[alias] = values.reduce((a, b) => a + b, 0);
          break;
        case 'avg':
          aggregated[alias] = values.length > 0
            ? values.reduce((a, b) => a + b, 0) / values.length
            : 0;
          break;
        case 'count':
          aggregated[alias] = rows.length;
          break;
        case 'min':
          aggregated[alias] = values.length > 0 ? Math.min(...values) : null;
          break;
        case 'max':
          aggregated[alias] = values.length > 0 ? Math.max(...values) : null;
          break;
      }
    }

    result.push(aggregated);
  }

  return createDataset(result, dataset.metadata.name);
}

/**
 * Join two datasets on a key column
 */
export function innerJoin(
  left: Dataset,
  right: Dataset,
  leftKey: string,
  rightKey: string
): Dataset {
  const rightIndex = new Map<unknown, DataRow[]>();
  for (const row of right.rows) {
    const key = row[rightKey];
    const existing = rightIndex.get(key) ?? [];
    existing.push(row);
    rightIndex.set(key, existing);
  }

  const result: DataRow[] = [];
  for (const leftRow of left.rows) {
    const key = leftRow[leftKey];
    const matches = rightIndex.get(key);
    if (matches) {
      for (const rightRow of matches) {
        result.push({ ...leftRow, ...rightRow });
      }
    }
  }

  return createDataset(result, `${left.metadata.name}_joined`);
}

/**
 * Pivot dataset: transform unique values into columns
 */
export function pivot(
  dataset: Dataset,
  indexColumn: string,
  pivotColumn: string,
  valueColumn: string
): Dataset {
  const pivotValues = new Set<string>();
  for (const row of dataset.rows) {
    pivotValues.add(String(row[pivotColumn]));
  }

  const indexed = new Map<unknown, DataRow>();
  for (const row of dataset.rows) {
    const key = row[indexColumn];
    if (!indexed.has(key)) {
      indexed.set(key, { [indexColumn]: key });
    }
    const pivoted = indexed.get(key)!;
    pivoted[String(row[pivotColumn])] = row[valueColumn];
  }

  return createDataset(Array.from(indexed.values()), dataset.metadata.name);
}

/**
 * Normalize numeric column values to 0-1 range
 */
export function normalize(dataset: Dataset, column: string): Dataset {
  const values = getNumericColumn(dataset, column);
  if (values.length === 0) return dataset;

  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min;

  if (range === 0) {
    return createDataset(
      dataset.rows.map((r) => ({
        ...r,
        [column]: typeof r[column] === 'number' ? 0 : r[column],
      })),
      dataset.metadata.name
    );
  }

  return createDataset(
    dataset.rows.map((r) => ({
      ...r,
      [column]: typeof r[column] === 'number'
        ? ((r[column]) - min) / range
        : r[column],
    })),
    dataset.metadata.name
  );
}

/**
 * Fill null/undefined values
 */
export function fillNulls(
  dataset: Dataset,
  column: string,
  value: unknown
): Dataset {
  return createDataset(
    dataset.rows.map((r) => ({
      ...r,
      [column]: r[column] === null || r[column] === undefined ? value : r[column],
    })),
    dataset.metadata.name
  );
}

/**
 * Concatenate datasets vertically (stack rows)
 */
export function concat(...datasets: Dataset[]): Dataset {
  const allRows = datasets.flatMap((d) => d.rows);
  const name = datasets[0]?.metadata.name ?? 'concatenated';
  return createDataset(allRows, name);
}
