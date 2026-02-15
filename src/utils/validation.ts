/**
 * Validation utilities for data quality checks
 */

import type { DataRow, Dataset } from '../types/index.js';

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
}

export interface ValidationError {
  row?: number;
  column: string;
  message: string;
  value?: unknown;
}

export interface ValidationWarning {
  column: string;
  message: string;
  count?: number;
}

export type ColumnValidator = (value: unknown, row: DataRow, rowIndex: number) => string | null;

/**
 * Validate dataset against a set of rules
 */
export function validateDataset(
  dataset: Dataset,
  validators: Record<string, ColumnValidator[]>
): ValidationResult {
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];

  for (const [column, rules] of Object.entries(validators)) {
    for (let i = 0; i < dataset.rows.length; i++) {
      const row = dataset.rows[i];
      const value = row[column];

      for (const rule of rules) {
        const error = rule(value, row, i);
        if (error) {
          errors.push({ row: i, column, message: error, value });
        }
      }
    }
  }

  // Auto-detect warnings
  for (const col of dataset.metadata.columns) {
    const nullCount = dataset.rows.filter(
      (r) => r[col.name] === null || r[col.name] === undefined
    ).length;
    const nullPercent = (nullCount / dataset.rows.length) * 100;

    if (nullPercent > 50) {
      warnings.push({
        column: col.name,
        message: `High null rate: ${nullPercent.toFixed(1)}%`,
        count: nullCount,
      });
    }
  }

  return { valid: errors.length === 0, errors, warnings };
}

// ---- Built-in validators ----

/**
 * Value must not be null/undefined
 */
export function required(): ColumnValidator {
  return (value) =>
    value === null || value === undefined ? 'Value is required' : null;
}

/**
 * Value must be a number
 */
export function isNumber(): ColumnValidator {
  return (value) =>
    value !== null && value !== undefined && typeof value !== 'number'
      ? `Expected number, got ${typeof value}`
      : null;
}

/**
 * Value must be a string
 */
export function isString(): ColumnValidator {
  return (value) =>
    value !== null && value !== undefined && typeof value !== 'string'
      ? `Expected string, got ${typeof value}`
      : null;
}

/**
 * Numeric value must be in range
 */
export function inRange(min: number, max: number): ColumnValidator {
  return (value) => {
    if (typeof value !== 'number') return null;
    return value < min || value > max ? `Value ${String(value)} not in range [${min}, ${max}]` : null;
  };
}

/**
 * String value must match pattern
 */
export function matchesPattern(pattern: RegExp): ColumnValidator {
  return (value) => {
    if (typeof value !== 'string') return null;
    return !pattern.test(value) ? `Value "${value}" does not match pattern ${pattern.toString()}` : null;
  };
}

/**
 * Value must be one of the allowed values
 */
export function oneOf(allowed: unknown[]): ColumnValidator {
  return (value) => {
    if (value === null || value === undefined) return null;
    const valueStr =
      typeof value === 'object'
        ? JSON.stringify(value)
        : typeof value === 'string'
          ? value
          : typeof value === 'number' || typeof value === 'boolean' || typeof value === 'bigint'
            ? `${value}`
            : typeof value === 'symbol'
              ? value.description ?? 'symbol'
              : '[unsupported]';
    return !allowed.includes(value) ? `Value "${valueStr}" not in allowed set` : null;
  };
}

/**
 * String length must be within bounds
 */
export function stringLength(min: number, max: number): ColumnValidator {
  return (value) => {
    if (typeof value !== 'string') return null;
    if (value.length < min || value.length > max) {
      return `String length ${value.length} not in [${min}, ${max}]`;
    }
    return null;
  };
}
