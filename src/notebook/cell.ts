/**
 * Notebook Cell - Cell creation and management utilities
 */

import { randomUUID } from 'node:crypto';
import type { Cell, CellOutput, CellType } from '../types/index.js';

/**
 * Create a new cell
 */
export function createCell(
  type: CellType,
  source: string,
  options?: { id?: string; tags?: string[]; metadata?: Record<string, unknown> }
): Cell {
  return {
    id: options?.id ?? randomUUID(),
    type,
    source,
    outputs: [],
    status: 'idle',
    executionCount: undefined,
    metadata: options?.metadata,
    tags: options?.tags,
  };
}

/**
 * Create a code cell
 */
export function codeCell(source: string, tags?: string[]): Cell {
  return createCell('code', source, { tags });
}

/**
 * Create a markdown cell
 */
export function markdownCell(source: string, tags?: string[]): Cell {
  return createCell('markdown', source, { tags });
}

/**
 * Create a raw cell
 */
export function rawCell(source: string, tags?: string[]): Cell {
  return createCell('raw', source, { tags });
}

/**
 * Create a cell output
 */
export function createOutput(
  type: CellOutput['type'],
  data: unknown,
  mimeType?: string
): CellOutput {
  return { type, data, mimeType };
}

/**
 * Add output to a cell (returns new cell)
 */
export function addOutput(cell: Cell, output: CellOutput): Cell {
  return {
    ...cell,
    outputs: [...cell.outputs, output],
  };
}

/**
 * Clear all outputs from a cell (returns new cell)
 */
export function clearOutputs(cell: Cell): Cell {
  return {
    ...cell,
    outputs: [],
    status: 'idle',
    executionCount: undefined,
  };
}

/**
 * Mark cell as executing
 */
export function markRunning(cell: Cell, executionCount: number): Cell {
  return {
    ...cell,
    status: 'running',
    executionCount,
    outputs: [],
  };
}

/**
 * Mark cell as completed
 */
export function markCompleted(cell: Cell, outputs: CellOutput[]): Cell {
  return {
    ...cell,
    status: 'completed',
    outputs,
  };
}

/**
 * Mark cell as error
 */
export function markError(cell: Cell, error: string): Cell {
  return {
    ...cell,
    status: 'error',
    outputs: [createOutput('error', error)],
  };
}

/**
 * Check if a cell has any outputs
 */
export function hasOutputs(cell: Cell): boolean {
  return cell.outputs.length > 0;
}

/**
 * Get all code cells from a list
 */
export function filterCodeCells(cells: Cell[]): Cell[] {
  return cells.filter((c) => c.type === 'code');
}

/**
 * Get all cells with a specific tag
 */
export function filterByTag(cells: Cell[], tag: string): Cell[] {
  return cells.filter((c) => c.tags?.includes(tag));
}

/**
 * Get cell source as lines
 */
export function getSourceLines(cell: Cell): string[] {
  return cell.source.split('\n');
}

/**
 * Count lines in a cell
 */
export function countLines(cell: Cell): number {
  return getSourceLines(cell).length;
}
