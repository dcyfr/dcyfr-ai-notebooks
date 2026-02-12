/**
 * Formatter - Text-based rendering of charts and tables
 */

import type { ChartSpec, Dataset, DescriptiveStats } from '../types/index.js';

/**
 * Render a text-based horizontal bar chart
 */
export function renderBarChart(chart: ChartSpec, maxWidth = 50): string {
  const lines: string[] = [];
  lines.push(`  ${chart.config.title}`);
  lines.push('  ' + '─'.repeat(maxWidth + 15));

  for (const series of chart.series) {
    for (const point of series.data) {
      const maxVal = Math.max(...series.data.map((d) => d.y));
      const barLen = maxVal > 0 ? Math.round((point.y / maxVal) * maxWidth) : 0;
      const label = String(point.x).padEnd(12);
      const bar = '█'.repeat(barLen);
      lines.push(`  ${label} │${bar} ${point.y}`);
    }
  }

  lines.push('  ' + '─'.repeat(maxWidth + 15));
  return lines.join('\n');
}

/**
 * Render data as a text table
 */
export function renderTable(
  headers: string[],
  rows: (string | number | null | undefined)[][],
  options?: { maxColWidth?: number; align?: 'left' | 'right' | 'center' }
): string {
  const maxCol = options?.maxColWidth ?? 20;
  const align = options?.align ?? 'left';

  // Calculate column widths
  const widths = headers.map((h) => Math.min(h.length, maxCol));
  for (const row of rows) {
    for (let i = 0; i < row.length; i++) {
      const len = String(row[i] ?? '').length;
      widths[i] = Math.min(Math.max(widths[i] ?? 0, len), maxCol);
    }
  }

  const pad = (val: string, width: number): string => {
    const s = val.slice(0, width);
    if (align === 'right') return s.padStart(width);
    if (align === 'center') {
      const left = Math.floor((width - s.length) / 2);
      return ' '.repeat(left) + s + ' '.repeat(width - s.length - left);
    }
    return s.padEnd(width);
  };

  const headerLine = headers.map((h, i) => pad(h, widths[i])).join(' │ ');
  const separator = widths.map((w) => '─'.repeat(w)).join('─┼─');

  const dataLines = rows.map((row) =>
    row.map((val, i) => pad(String(val ?? ''), widths[i])).join(' │ ')
  );

  return [headerLine, separator, ...dataLines].join('\n');
}

/**
 * Render a dataset as a text table
 */
export function renderDatasetTable(dataset: Dataset, maxRows = 20): string {
  const headers = dataset.metadata.columns.map((c) => c.name);
  const displayRows = dataset.rows.slice(0, maxRows);
  const tableRows = displayRows.map((row) =>
    headers.map((h) => row[h] as string | number | null | undefined)
  );

  let result = renderTable(headers, tableRows);

  if (dataset.rows.length > maxRows) {
    result += `\n... ${dataset.rows.length - maxRows} more rows`;
  }

  return result;
}

/**
 * Render descriptive statistics as a table
 */
export function renderStatsTable(stats: DescriptiveStats[]): string {
  const headers = ['Column', 'Count', 'Mean', 'Median', 'StdDev', 'Min', 'Max', 'Nulls'];
  const rows = stats.map((s) => [
    s.column ?? '',
    s.count,
    Number(s.mean.toFixed(2)),
    Number(s.median.toFixed(2)),
    Number(s.stddev.toFixed(2)),
    s.min,
    s.max,
    s.nullCount,
  ]);
  return renderTable(headers, rows, { align: 'right' });
}

/**
 * Render a sparkline from values
 */
export function sparkline(values: number[]): string {
  if (values.length === 0) return '';
  const chars = '▁▂▃▄▅▆▇█';
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;

  return values
    .map((v) => {
      const idx = Math.min(Math.floor(((v - min) / range) * (chars.length - 1)), chars.length - 1);
      return chars[idx];
    })
    .join('');
}

/**
 * Format a number with locale-aware formatting
 */
export function formatNumber(value: number, decimals = 2): string {
  return value.toFixed(decimals);
}

/**
 * Render a simple text-based summary
 */
export function renderSummary(title: string, items: Record<string, unknown>): string {
  const lines = [`  ${title}`, '  ' + '─'.repeat(40)];
  for (const [key, value] of Object.entries(items)) {
    const valueStr = typeof value === 'object' && value !== null ? JSON.stringify(value) : String(value);
    lines.push(`  ${key.padEnd(20)} ${valueStr}`);
  }
  return lines.join('\n');
}
