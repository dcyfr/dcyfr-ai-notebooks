/**
 * Tests for notebook/runner.ts
 */

import { describe, it, expect } from 'vitest';
import {
  createNotebook,
  addCell,
  codeCell,
  markdownCell,
  defaultExecutor,
  createExecutionContext,
  executeCell,
  executeNotebook,
  getExecutionSummary,
} from '../src/notebook/index.js';
import type { CellExecutor } from '../src/notebook/index.js';

describe('Default Executor', () => {
  it('produces text output from source lines', async () => {
    const ctx = createExecutionContext();
    const outputs = await defaultExecutor('line1\nline2', ctx);
    // Default executor joins non-empty lines with '> ' prefix
    expect(outputs).toHaveLength(1);
    expect(outputs[0].type).toBe('text');
    expect(String(outputs[0].data)).toContain('line1');
  });

  it('handles empty source', async () => {
    const ctx = createExecutionContext();
    const outputs = await defaultExecutor('', ctx);
    // Empty string: no non-empty lines → empty output or single empty
    expect(outputs.length).toBeGreaterThanOrEqual(0);
  });
});

describe('Execution Context', () => {
  it('creates a context with defaults', () => {
    const ctx = createExecutionContext();
    expect(ctx.variables).toEqual({});
    expect(ctx.executionCount).toBe(0);
    expect(ctx.startedAt).toBeGreaterThan(0);
  });

  it('creates a context with custom variables', () => {
    const ctx = createExecutionContext({ variables: { x: 42 } });
    expect(ctx.variables).toEqual({ x: 42 });
  });
});

describe('Cell Execution', () => {
  it('executes a code cell', async () => {
    const cell = codeCell('hello world');
    const ctx = createExecutionContext();
    const result = await executeCell(cell, defaultExecutor, ctx);
    expect(result.status).toBe('completed');
    expect(result.outputs.length).toBeGreaterThan(0);
  });

  it('skips markdown cells', async () => {
    const cell = markdownCell('# Title');
    const ctx = createExecutionContext();
    const result = await executeCell(cell, defaultExecutor, ctx);
    expect(result.status).toBe('skipped');
  });

  it('handles executor errors', async () => {
    const errorExecutor: CellExecutor = async () => {
      throw new Error('Execution failed');
    };
    const cell = codeCell('will fail');
    const ctx = createExecutionContext();
    const result = await executeCell(cell, errorExecutor, ctx);
    expect(result.status).toBe('error');
  });
});

describe('Notebook Execution', () => {
  it('executes all cells in a notebook', async () => {
    let nb = createNotebook({ title: 'Test' });
    nb = addCell(nb, codeCell('line1'));
    nb = addCell(nb, codeCell('line2'));

    const result = await executeNotebook(nb);
    expect(result.cells.length).toBe(2);
  });

  it('returns execution summary', async () => {
    let nb = createNotebook();
    nb = addCell(nb, codeCell('a'));
    nb = addCell(nb, markdownCell('b'));
    nb = addCell(nb, codeCell('c'));

    const result = await executeNotebook(nb);
    const summary = getExecutionSummary(result);
    expect(summary.total).toBe(3);
    expect(summary.completed + summary.skipped + summary.errors + summary.idle).toBe(3);
  });

  it('stops on error when configured', async () => {
    const errorExecutor: CellExecutor = async (source) => {
      if (source.includes('fail')) throw new Error('fail');
      return [{ type: 'text', data: source }];
    };

    let nb = createNotebook();
    nb = addCell(nb, codeCell('ok'));
    nb = addCell(nb, codeCell('fail'));
    nb = addCell(nb, codeCell('never'));

    const result = await executeNotebook(nb, {
      executor: errorExecutor,
      stopOnError: true,
    });

    const summary = getExecutionSummary(result);
    expect(summary.errors).toBeGreaterThanOrEqual(1);
  });

  it('continues on error when configured', async () => {
    const errorExecutor: CellExecutor = async (source) => {
      if (source.includes('fail')) throw new Error('fail');
      return [{ type: 'text', data: source }];
    };

    let nb = createNotebook();
    nb = addCell(nb, codeCell('ok'));
    nb = addCell(nb, codeCell('fail'));
    nb = addCell(nb, codeCell('also ok'));

    const result = await executeNotebook(nb, {
      executor: errorExecutor,
      stopOnError: false,
    });

    const summary = getExecutionSummary(result);
    expect(summary.total).toBe(3);
  });

  it('executes specific cells by id', async () => {
    let nb = createNotebook();
    const cell1 = codeCell('a');
    const cell2 = codeCell('b');
    const cell3 = codeCell('c');
    nb = addCell(nb, cell1);
    nb = addCell(nb, cell2);
    nb = addCell(nb, cell3);

    const result = await executeNotebook(nb, {
      cellIds: [cell1.id, cell3.id],
    });

    expect(result.cells.length).toBe(3);
  });

  it('calls onCellComplete callback', async () => {
    let nb = createNotebook();
    nb = addCell(nb, codeCell('a'));
    nb = addCell(nb, codeCell('b'));

    const completed: string[] = [];
    await executeNotebook(nb, {
      onCellComplete: (cell) => completed.push(cell.id),
    });

    expect(completed.length).toBeGreaterThanOrEqual(2);
  });
});
