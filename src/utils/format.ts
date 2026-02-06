/**
 * Format utilities - Number, date, and display formatting
 */

/**
 * Format bytes into human-readable string
 */
export function formatBytes(bytes: number, decimals = 2): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / k ** i).toFixed(decimals)} ${sizes[i]}`;
}

/**
 * Format duration in milliseconds
 */
export function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60_000) return `${(ms / 1000).toFixed(1)}s`;
  const mins = Math.floor(ms / 60_000);
  const secs = Math.round((ms % 60_000) / 1000);
  return `${mins}m ${secs}s`;
}

/**
 * Format a number with thousands separator
 */
export function formatWithCommas(value: number): string {
  return value.toLocaleString('en-US');
}

/**
 * Format as percentage
 */
export function formatPercent(value: number, decimals = 1): string {
  return `${(value * 100).toFixed(decimals)}%`;
}

/**
 * Truncate string with ellipsis
 */
export function truncate(str: string, maxLen: number): string {
  if (str.length <= maxLen) return str;
  return str.slice(0, maxLen - 3) + '...';
}

/**
 * Pad string to width
 */
export function padTo(str: string, width: number, align: 'left' | 'right' | 'center' = 'left'): string {
  if (str.length >= width) return str.slice(0, width);
  if (align === 'right') return str.padStart(width);
  if (align === 'center') {
    const left = Math.floor((width - str.length) / 2);
    return ' '.repeat(left) + str + ' '.repeat(width - str.length - left);
  }
  return str.padEnd(width);
}

/**
 * Format timestamp to ISO date string
 */
export function formatTimestamp(ts: number): string {
  return new Date(ts).toISOString();
}

/**
 * Create a progress bar string
 */
export function progressBar(current: number, total: number, width = 30): string {
  const ratio = total > 0 ? Math.min(current / total, 1) : 0;
  const filled = Math.round(width * ratio);
  const empty = width - filled;
  const percent = (ratio * 100).toFixed(0);
  return `[${'█'.repeat(filled)}${'░'.repeat(empty)}] ${percent}% (${current}/${total})`;
}
