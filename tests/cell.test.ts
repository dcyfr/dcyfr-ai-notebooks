/**
 * Tests for notebook/cell.ts
 */

import { describe, it, expect } from 'vitest';
import {
  createCell,
  codeCell,
  markdownCell,
  rawCell,
  createOutput,
  addOutput,
  clearOutputs,
  markRunning,
  markCompleted,
  markError,
  hasOutputs,
  filterCodeCells,
  filterByTag,
  getSourceLines,
  countLines,
} from '../src/notebook/index.js';

describe('Cell Creation', () => {
  it('creates a cell with defaults', () => {
    const cell = createCell('code', 'console.log("hi")');
    expect(cell.type).toBe('code');
    expect(cell.source).toBe('console.log("hi")');
    expect(cell.status).toBe('idle');
    expect(cell.outputs).toEqual([]);
    expect(cell.executionCount).toBeUndefined();
    expect(cell.id).toBeTruthy();
  });

  it('creates a code cell shortcut', () => {
    const cell = codeCell('const x = 1;');
    expect(cell.type).toBe('code');
    expect(cell.source).toBe('const x = 1;');
  });

  it('creates a markdown cell shortcut', () => {
    const cell = markdownCell('# Title');
    expect(cell.type).toBe('markdown');
    expect(cell.source).toBe('# Title');
  });

  it('creates a raw cell shortcut', () => {
    const cell = rawCell('raw content');
    expect(cell.type).toBe('raw');
  });

  it('creates a cell with tags', () => {
    const cell = createCell('code', 'x', { tags: ['important', 'setup'] });
    expect(cell.tags).toEqual(['important', 'setup']);
  });

  it('creates a cell with metadata', () => {
    const cell = createCell('code', 'x', { metadata: { custom: 'value' } });
    expect(cell.metadata).toEqual({ custom: 'value' });
  });
});

describe('Cell Outputs', () => {
  it('creates an output', () => {
    const output = createOutput('text', 'Hello');
    expect(output.type).toBe('text');
    expect(output.data).toBe('Hello');
  });

  it('creates an output with metadata', () => {
    const output = createOutput('chart', '{}', 'application/json');
    expect(output.mimeType).toBe('application/json');
  });

  it('adds output to a cell', () => {
    const cell = codeCell('x');
    const updated = addOutput(cell, createOutput('text', 'result'));
    expect(updated.outputs).toHaveLength(1);
    expect(cell.outputs).toHaveLength(0); // immutable
  });

  it('clears outputs', () => {
    let cell = codeCell('x');
    cell = addOutput(cell, createOutput('text', 'a'));
    cell = addOutput(cell, createOutput('text', 'b'));
    expect(cell.outputs).toHaveLength(2);
    const cleared = clearOutputs(cell);
    expect(cleared.outputs).toHaveLength(0);
  });

  it('hasOutputs returns correct value', () => {
    const empty = codeCell('x');
    expect(hasOutputs(empty)).toBe(false);
    const withOutput = addOutput(empty, createOutput('text', 'hi'));
    expect(hasOutputs(withOutput)).toBe(true);
  });
});

describe('Cell Status', () => {
  it('marks cell as running', () => {
    const cell = codeCell('x');
    const running = markRunning(cell, 1);
    expect(running.status).toBe('running');
  });

  it('marks cell as completed', () => {
    const cell = codeCell('x');
    const completed = markCompleted(cell, [createOutput('text', 'done')]);
    expect(completed.status).toBe('completed');
    expect(completed.outputs).toHaveLength(1);
  });

  it('marks cell as error', () => {
    const cell = codeCell('x');
    const errored = markError(cell, 'Something failed');
    expect(errored.status).toBe('error');
    expect(errored.outputs).toHaveLength(1);
    expect(errored.outputs[0].type).toBe('error');
    expect(errored.outputs[0].data).toBe('Something failed');
  });
});

describe('Cell Filtering', () => {
  it('filters code cells', () => {
    const cells = [codeCell('a'), markdownCell('b'), codeCell('c'), rawCell('d')];
    const codeCells = filterCodeCells(cells);
    expect(codeCells).toHaveLength(2);
    expect(codeCells.every((c) => c.type === 'code')).toBe(true);
  });

  it('filters by tag', () => {
    const cells = [
      createCell('code', 'a', { tags: ['setup'] }),
      createCell('code', 'b', { tags: ['cleanup'] }),
      createCell('code', 'c', { tags: ['setup', 'important'] }),
    ];
    const setup = filterByTag(cells, 'setup');
    expect(setup).toHaveLength(2);
  });
});

describe('Cell Source', () => {
  it('gets source lines', () => {
    const cell = codeCell('line1\nline2\nline3');
    const lines = getSourceLines(cell);
    expect(lines).toEqual(['line1', 'line2', 'line3']);
  });

  it('counts lines', () => {
    const cell = codeCell('a\nb\nc');
    expect(countLines(cell)).toBe(3);
  });

  it('counts single line', () => {
    const cell = codeCell('single');
    expect(countLines(cell)).toBe(1);
  });
});
