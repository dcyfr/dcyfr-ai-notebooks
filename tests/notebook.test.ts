/**
 * Tests for notebook/notebook.ts
 */

import { describe, it, expect } from 'vitest';
import {
  createNotebook,
  addCell,
  insertCell,
  removeCell,
  moveCell,
  updateCell,
  getCell,
  cellCount,
  codeCellCount,
  updateMetadata,
  clearAllOutputs,
  exportNotebook,
  importNotebook,
  mergeNotebooks,
  codeCell,
  markdownCell,
  addOutput,
  createOutput,
} from '../src/notebook/index.js';

describe('Notebook Creation', () => {
  it('creates a notebook with defaults', () => {
    const nb = createNotebook();
    expect(nb.id).toBeTruthy();
    expect(nb.cells).toEqual([]);
    expect(nb.metadata.title).toBeUndefined();
  });

  it('creates a notebook with options', () => {
    const nb = createNotebook({ title: 'My NB', author: 'Drew', tags: ['test'] });
    expect(nb.metadata.title).toBe('My NB');
    expect(nb.metadata.author).toBe('Drew');
    expect(nb.metadata.tags).toEqual(['test']);
  });
});

describe('Cell Management', () => {
  it('adds a cell', () => {
    let nb = createNotebook();
    nb = addCell(nb, codeCell('x'));
    expect(cellCount(nb)).toBe(1);
  });

  it('adds multiple cells', () => {
    let nb = createNotebook();
    nb = addCell(nb, codeCell('a'));
    nb = addCell(nb, markdownCell('b'));
    nb = addCell(nb, codeCell('c'));
    expect(cellCount(nb)).toBe(3);
    expect(codeCellCount(nb)).toBe(2);
  });

  it('inserts a cell at index', () => {
    let nb = createNotebook();
    nb = addCell(nb, codeCell('first'));
    nb = addCell(nb, codeCell('third'));
    nb = insertCell(nb, 1, codeCell('second'));
    expect(nb.cells[1].source).toBe('second');
    expect(cellCount(nb)).toBe(3);
  });

  it('removes a cell by id', () => {
    let nb = createNotebook();
    const cell = codeCell('remove me');
    nb = addCell(nb, cell);
    nb = addCell(nb, codeCell('keep'));
    nb = removeCell(nb, cell.id);
    expect(cellCount(nb)).toBe(1);
    expect(nb.cells[0].source).toBe('keep');
  });

  it('moves a cell', () => {
    let nb = createNotebook();
    const a = codeCell('a');
    const b = codeCell('b');
    const c = codeCell('c');
    nb = addCell(nb, a);
    nb = addCell(nb, b);
    nb = addCell(nb, c);
    nb = moveCell(nb, a.id, 2);
    expect(nb.cells[0].source).toBe('b');
    expect(nb.cells[2].source).toBe('a');
  });

  it('updates a cell', () => {
    let nb = createNotebook();
    const cell = codeCell('old');
    nb = addCell(nb, cell);
    nb = updateCell(nb, cell.id, { source: 'new' });
    expect(nb.cells[0].source).toBe('new');
  });

  it('gets a cell by id', () => {
    let nb = createNotebook();
    const cell = codeCell('find me');
    nb = addCell(nb, cell);
    nb = addCell(nb, codeCell('other'));
    const found = getCell(nb, cell.id);
    expect(found?.source).toBe('find me');
  });

  it('returns undefined for missing cell', () => {
    const nb = createNotebook();
    expect(getCell(nb, 'nonexistent')).toBeUndefined();
  });
});

describe('Notebook Operations', () => {
  it('updates metadata', () => {
    let nb = createNotebook();
    nb = updateMetadata(nb, { title: 'Updated', author: 'Test' });
    expect(nb.metadata.title).toBe('Updated');
    expect(nb.metadata.author).toBe('Test');
  });

  it('clears all outputs', () => {
    let nb = createNotebook();
    let cell = codeCell('x');
    cell = addOutput(cell, createOutput('text', 'result'));
    nb = addCell(nb, cell);
    nb = clearAllOutputs(nb);
    expect(nb.cells[0].outputs).toHaveLength(0);
  });
});

describe('Serialization', () => {
  it('exports and imports a notebook', () => {
    let nb = createNotebook({ title: 'Roundtrip' });
    nb = addCell(nb, codeCell('const x = 1;'));
    nb = addCell(nb, markdownCell('# Hello'));

    const json = exportNotebook(nb);
    expect(typeof json).toBe('string');

    const imported = importNotebook(json);
    expect(imported.metadata.title).toBe('Roundtrip');
    expect(cellCount(imported)).toBe(2);
    expect(imported.cells[0].source).toBe('const x = 1;');
  });
});

describe('Merge', () => {
  it('merges two notebooks', () => {
    let a = createNotebook({ title: 'A' });
    a = addCell(a, codeCell('from A'));

    let b = createNotebook({ title: 'B' });
    b = addCell(b, codeCell('from B'));
    b = addCell(b, markdownCell('# B'));

    const merged = mergeNotebooks(a, b, 'Merged');
    expect(merged.metadata.title).toBe('Merged');
    expect(cellCount(merged)).toBe(3);
  });

  it('merges with auto-generated title', () => {
    const a = createNotebook({ title: 'Alpha' });
    const b = createNotebook({ title: 'Beta' });
    const merged = mergeNotebooks(a, b);
    expect(merged.metadata.title).toBe('Merged: Alpha + Beta');
  });
});
