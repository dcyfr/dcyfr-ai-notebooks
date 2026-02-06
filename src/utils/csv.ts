/**
 * CSV Parser - Simple CSV parsing and generation
 */

import type { DataRow, Dataset } from '../types/index.js';
import { createDataset } from '../pipeline/dataset.js';

/**
 * Parse CSV string into a dataset
 */
export function parseCSV(
  csv: string,
  options?: { delimiter?: string; hasHeader?: boolean; name?: string }
): Dataset {
  const delimiter = options?.delimiter ?? ',';
  const hasHeader = options?.hasHeader ?? true;
  const name = options?.name ?? 'csv_data';

  const lines = csv.split('\n').filter((line) => line.trim().length > 0);
  if (lines.length === 0) return createDataset([], name);

  const parseRow = (line: string): string[] => {
    const values: string[] = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') {
        if (inQuotes && line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (ch === delimiter && !inQuotes) {
        values.push(current.trim());
        current = '';
      } else {
        current += ch;
      }
    }
    values.push(current.trim());
    return values;
  };

  let headers: string[];
  let dataStart: number;

  if (hasHeader) {
    headers = parseRow(lines[0]);
    dataStart = 1;
  } else {
    const firstRow = parseRow(lines[0]);
    headers = firstRow.map((_, i) => `col_${i}`);
    dataStart = 0;
  }

  const rows: DataRow[] = [];
  for (let i = dataStart; i < lines.length; i++) {
    const values = parseRow(lines[i]);
    const row: DataRow = {};
    for (let j = 0; j < headers.length; j++) {
      const val = values[j] ?? '';
      // Auto-detect numeric values
      const num = Number(val);
      if (val !== '' && !isNaN(num)) {
        row[headers[j]] = num;
      } else if (val.toLowerCase() === 'true') {
        row[headers[j]] = true;
      } else if (val.toLowerCase() === 'false') {
        row[headers[j]] = false;
      } else if (val === '') {
        row[headers[j]] = null;
      } else {
        row[headers[j]] = val;
      }
    }
    rows.push(row);
  }

  return createDataset(rows, name);
}

/**
 * Convert a dataset to CSV string
 */
export function toCSV(dataset: Dataset, options?: { delimiter?: string }): string {
  const delimiter = options?.delimiter ?? ',';
  const headers = dataset.metadata.columns.map((c) => c.name);

  const escape = (val: unknown): string => {
    const str = val === null || val === undefined ? '' : String(val);
    if (str.includes(delimiter) || str.includes('"') || str.includes('\n')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  const headerLine = headers.map(escape).join(delimiter);
  const dataLines = dataset.rows.map((row) =>
    headers.map((h) => escape(row[h])).join(delimiter)
  );

  return [headerLine, ...dataLines].join('\n');
}
