/**
 * Notebook Runner - Execute notebook cells in sequence
 */

import type { Cell, CellOutput, Notebook } from '../types/index.js';
import { markRunning, markCompleted, markError, createOutput } from './cell.js';
import { updateCell } from './notebook.js';

/** Cell executor function */
export type CellExecutor = (source: string, context: ExecutionContext) => Promise<CellOutput[]>;

/** Execution context shared across cells */
export interface ExecutionContext {
  variables: Record<string, unknown>;
  executionCount: number;
  startedAt: number;
  metadata: Record<string, unknown>;
}

/** Execution options */
export interface ExecutionOptions {
  /** Custom cell executor */
  executor?: CellExecutor;
  /** Stop on first error */
  stopOnError?: boolean;
  /** Cell IDs to execute (default: all code cells) */
  cellIds?: string[];
  /** Callback after each cell execution */
  onCellComplete?: (cell: Cell, index: number) => void;
  /** Callback on error */
  onCellError?: (cell: Cell, error: Error, index: number) => void;
}

/**
 * Default cell executor: evaluates source as a function body
 */
export const defaultExecutor: CellExecutor = async (source, context) => {
  // Simple evaluation — returns text output of the source
  // In a real implementation, this would use a kernel (Jupyter, Deno, etc.)
  const lines = source.split('\n').filter((l) => l.trim().length > 0);
  const output = lines.map((l) => `> ${l}`).join('\n');
  context.executionCount++;
  return [createOutput('text', output)];
};

/**
 * Create a new execution context
 */
export function createExecutionContext(
  initial?: Partial<ExecutionContext>
): ExecutionContext {
  return {
    variables: initial?.variables ?? {},
    executionCount: initial?.executionCount ?? 0,
    startedAt: initial?.startedAt ?? Date.now(),
    metadata: initial?.metadata ?? {},
  };
}

/**
 * Execute a single cell
 */
export async function executeCell(
  cell: Cell,
  executor: CellExecutor,
  context: ExecutionContext
): Promise<Cell> {
  if (cell.type !== 'code') {
    return { ...cell, status: 'skipped' };
  }

  if (cell.source.trim().length === 0) {
    return { ...cell, status: 'skipped' };
  }

  context.executionCount++;
  const running = markRunning(cell, context.executionCount);

  try {
    const outputs = await executor(cell.source, context);
    return markCompleted(running, outputs);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return markError(running, message);
  }
}

/**
 * Execute all code cells in a notebook
 */
export async function executeNotebook(
  notebook: Notebook,
  options?: ExecutionOptions
): Promise<Notebook> {
  const executor = options?.executor ?? defaultExecutor;
  const stopOnError = options?.stopOnError ?? true;
  const context = createExecutionContext();

  let result = notebook;
  const cellsToRun = options?.cellIds
    ? notebook.cells.filter((c) => options.cellIds!.includes(c.id))
    : notebook.cells;

  for (let i = 0; i < cellsToRun.length; i++) {
    const cell = cellsToRun[i];
    const executed = await executeCell(cell, executor, context);

    result = updateCell(result, cell.id, executed);

    if (executed.status === 'completed') {
      options?.onCellComplete?.(executed, i);
    }

    if (executed.status === 'error') {
      options?.onCellError?.(executed, new Error(String(executed.outputs[0]?.data)), i);
      if (stopOnError) break;
    }
  }

  return result;
}

/**
 * Get execution summary for a notebook
 */
export function getExecutionSummary(notebook: Notebook): {
  total: number;
  completed: number;
  errors: number;
  skipped: number;
  idle: number;
} {
  const cells = notebook.cells;
  return {
    total: cells.length,
    completed: cells.filter((c) => c.status === 'completed').length,
    errors: cells.filter((c) => c.status === 'error').length,
    skipped: cells.filter((c) => c.status === 'skipped').length,
    idle: cells.filter((c) => c.status === 'idle').length,
  };
}
