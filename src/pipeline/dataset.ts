/**
 * Dataset - In-memory tabular data management
 */

import type { ColumnSchema, ColumnType, DataRow, Dataset, DatasetMetadata } from '../types/index.js';

/**
 * Infer column type from a value
 */
export function inferColumnType(value: unknown): ColumnType {
  if (value === null || value === undefined) return 'null';
  if (typeof value === 'string') return 'string';
  if (typeof value === 'number') return 'number';
  if (typeof value === 'boolean') return 'boolean';
  if (value instanceof Date) return 'date';
  if (Array.isArray(value)) return 'array';
  return 'object';
}

/**
 * Infer schema from an array of data rows
 */
export function inferSchema(rows: DataRow[], name = 'dataset'): DatasetMetadata {
  if (rows.length === 0) {
    return { name, rows: 0, columns: [] };
  }

  // Collect all column names from all rows
  const columnNames = new Set<string>();
  for (const row of rows) {
    for (const key of Object.keys(row)) {
      columnNames.add(key);
    }
  }

  // Infer type from first non-null value in each column
  const columns: ColumnSchema[] = Array.from(columnNames).map((colName) => {
    let type: ColumnType = 'null';
    let hasNull = false;

    for (const row of rows) {
      const val = row[colName];
      if (val === null || val === undefined) {
        hasNull = true;
        continue;
      }
      type = inferColumnType(val);
      break;
    }

    return {
      name: colName,
      type,
      nullable: hasNull || rows.some((r) => r[colName] === null || r[colName] === undefined),
    };
  });

  return {
    name,
    rows: rows.length,
    columns,
  };
}

/**
 * Create a dataset from an array of rows
 */
export function createDataset(rows: DataRow[], name = 'dataset', description?: string): Dataset {
  const metadata = inferSchema(rows, name);
  if (description) metadata.description = description;
  metadata.createdAt = Date.now();
  return { metadata, rows };
}

/**
 * Select specific columns from a dataset
 */
export function selectColumns(dataset: Dataset, columns: string[]): Dataset {
  const newRows = dataset.rows.map((row) => {
    const newRow: DataRow = {};
    for (const col of columns) {
      if (col in row) {
        newRow[col] = row[col];
      }
    }
    return newRow;
  });
  return createDataset(newRows, dataset.metadata.name);
}

/**
 * Filter dataset rows
 */
export function filterRows(dataset: Dataset, predicate: (row: DataRow) => boolean): Dataset {
  const filtered = dataset.rows.filter(predicate);
  return createDataset(filtered, dataset.metadata.name);
}

/**
 * Sort dataset by a column
 */
export function sortBy(dataset: Dataset, column: string, ascending = true): Dataset {
  const sorted = [...dataset.rows].sort((a, b) => {
    const va = a[column];
    const vb = b[column];
    if (va === vb) return 0;
    if (va === null || va === undefined) return 1;
    if (vb === null || vb === undefined) return -1;
    const cmp = va < vb ? -1 : 1;
    return ascending ? cmp : -cmp;
  });
  return createDataset(sorted, dataset.metadata.name);
}

/**
 * Get unique values in a column
 */
export function uniqueValues(dataset: Dataset, column: string): unknown[] {
  const seen = new Set<unknown>();
  for (const row of dataset.rows) {
    seen.add(row[column]);
  }
  return Array.from(seen);
}

/**
 * Group rows by a column value
 */
export function groupBy(dataset: Dataset, column: string): Map<unknown, DataRow[]> {
  const groups = new Map<unknown, DataRow[]>();
  for (const row of dataset.rows) {
    const key = row[column];
    const group = groups.get(key) ?? [];
    group.push(row);
    groups.set(key, group);
  }
  return groups;
}

/**
 * Get column values as an array
 */
export function getColumn(dataset: Dataset, column: string): unknown[] {
  return dataset.rows.map((r) => r[column]);
}

/**
 * Get numeric column values (filters out non-numbers)
 */
export function getNumericColumn(dataset: Dataset, column: string): number[] {
  return dataset.rows
    .map((r) => r[column])
    .filter((v): v is number => typeof v === 'number' && !isNaN(v));
}

/**
 * Sample random rows from a dataset
 */
export function sampleRows(dataset: Dataset, n: number): Dataset {
  const shuffled = [...dataset.rows].sort(() => Math.random() - 0.5);
  return createDataset(shuffled.slice(0, n), dataset.metadata.name);
}

/**
 * Get first N rows
 */
export function head(dataset: Dataset, n = 5): Dataset {
  return createDataset(dataset.rows.slice(0, n), dataset.metadata.name);
}

/**
 * Get last N rows
 */
export function tail(dataset: Dataset, n = 5): Dataset {
  return createDataset(dataset.rows.slice(-n), dataset.metadata.name);
}

/**
 * Add a computed column
 */
export function addColumn(
  dataset: Dataset,
  name: string,
  compute: (row: DataRow) => unknown
): Dataset {
  const newRows = dataset.rows.map((row) => ({
    ...row,
    [name]: compute(row),
  }));
  return createDataset(newRows, dataset.metadata.name);
}

/**
 * Rename a column
 */
export function renameColumn(
  dataset: Dataset,
  oldName: string,
  newName: string
): Dataset {
  const newRows = dataset.rows.map((row) => {
    const newRow: DataRow = {};
    for (const [key, val] of Object.entries(row)) {
      newRow[key === oldName ? newName : key] = val;
    }
    return newRow;
  });
  return createDataset(newRows, dataset.metadata.name);
}

/**
 * Drop rows with null values in specified columns
 */
export function dropNulls(dataset: Dataset, columns?: string[]): Dataset {
  const cols = columns ?? dataset.metadata.columns.map((c) => c.name);
  const filtered = dataset.rows.filter((row) =>
    cols.every((col) => row[col] !== null && row[col] !== undefined)
  );
  return createDataset(filtered, dataset.metadata.name);
}
