/**
 * Notebook Manager - Create, manipulate, and manage notebooks
 */

import { randomUUID } from 'node:crypto';
import {
  NotebookSchema,
  type Cell,
  type Notebook,
  type NotebookMetadata,
} from '../types/index.js';
import { filterCodeCells } from './cell.js';

interface ParsedNotebook {
  id?: string;
  cells?: Partial<Cell>[];
  metadata?: Partial<NotebookMetadata>;
}

export interface CreateNotebookOptions {
  id?: string;
  title?: string;
  description?: string;
  author?: string;
  tags?: string[];
  kernel?: { name: string; language: string; version?: string };
}

/**
 * Create a new empty notebook
 */
export function createNotebook(options?: CreateNotebookOptions): Notebook {
  const now = Date.now();
  return {
    id: options?.id ?? randomUUID(),
    cells: [],
    metadata: {
      title: options?.title,
      description: options?.description,
      author: options?.author,
      tags: options?.tags,
      kernel: options?.kernel ?? { name: 'typescript', language: 'typescript' },
      createdAt: now,
      updatedAt: now,
      version: '1.0.0',
    },
  };
}

/**
 * Add a cell to the end of a notebook
 */
export function addCell(notebook: Notebook, cell: Cell): Notebook {
  return {
    ...notebook,
    cells: [...notebook.cells, cell],
    metadata: {
      ...notebook.metadata,
      updatedAt: Date.now(),
    },
  };
}

/**
 * Insert a cell at a specific position
 */
export function insertCell(notebook: Notebook, index: number, cell: Cell): Notebook {
  const cells = [...notebook.cells];
  cells.splice(index, 0, cell);
  return {
    ...notebook,
    cells,
    metadata: {
      ...notebook.metadata,
      updatedAt: Date.now(),
    },
  };
}

/**
 * Remove a cell by ID
 */
export function removeCell(notebook: Notebook, cellId: string): Notebook {
  return {
    ...notebook,
    cells: notebook.cells.filter((c) => c.id !== cellId),
    metadata: {
      ...notebook.metadata,
      updatedAt: Date.now(),
    },
  };
}

/**
 * Move a cell to a new position
 */
export function moveCell(notebook: Notebook, cellId: string, newIndex: number): Notebook {
  const cell = notebook.cells.find((c) => c.id === cellId);
  if (!cell) return notebook;

  const without = notebook.cells.filter((c) => c.id !== cellId);
  without.splice(newIndex, 0, cell);

  return {
    ...notebook,
    cells: without,
    metadata: {
      ...notebook.metadata,
      updatedAt: Date.now(),
    },
  };
}

/**
 * Update a cell in the notebook
 */
export function updateCell(notebook: Notebook, cellId: string, updates: Partial<Cell>): Notebook {
  return {
    ...notebook,
    cells: notebook.cells.map((c) =>
      c.id === cellId ? { ...c, ...updates } : c
    ),
    metadata: {
      ...notebook.metadata,
      updatedAt: Date.now(),
    },
  };
}

/**
 * Get a cell by ID
 */
export function getCell(notebook: Notebook, cellId: string): Cell | undefined {
  return notebook.cells.find((c) => c.id === cellId);
}

/**
 * Get the number of cells
 */
export function cellCount(notebook: Notebook): number {
  return notebook.cells.length;
}

/**
 * Get the number of code cells
 */
export function codeCellCount(notebook: Notebook): number {
  return filterCodeCells(notebook.cells).length;
}

/**
 * Update notebook metadata
 */
export function updateMetadata(
  notebook: Notebook,
  updates: Partial<NotebookMetadata>
): Notebook {
  return {
    ...notebook,
    metadata: {
      ...notebook.metadata,
      ...updates,
      updatedAt: Date.now(),
    },
  };
}

/**
 * Clear all cell outputs in the notebook
 */
export function clearAllOutputs(notebook: Notebook): Notebook {
  return {
    ...notebook,
    cells: notebook.cells.map((c) => ({
      ...c,
      outputs: [],
      status: 'idle' as const,
      executionCount: undefined,
    })),
    metadata: {
      ...notebook.metadata,
      updatedAt: Date.now(),
    },
  };
}

/**
 * Export notebook to a simplified JSON format
 */
export function exportNotebook(notebook: Notebook): string {
  return JSON.stringify(notebook, null, 2);
}

/**
 * Import notebook from JSON
 */
export function importNotebook(json: string): Notebook {
  const parsedUnknown: unknown = JSON.parse(json);

  const strictParsed = NotebookSchema.safeParse(parsedUnknown);
  if (strictParsed.success) {
    return strictParsed.data;
  }

  const parsed = parsedUnknown as ParsedNotebook;
  // Ensure cells have defaults
  const cells = (parsed.cells ?? []).map((c) => ({
    id: c.id ?? randomUUID(),
    type: c.type ?? 'code',
    source: c.source ?? '',
    outputs: c.outputs ?? [],
    status: c.status ?? 'idle',
    executionCount: c.executionCount,
    metadata: c.metadata,
    tags: c.tags,
  }));

  return {
    id: parsed.id ?? randomUUID(),
    cells,
    metadata: {
      title: parsed.metadata?.title,
      description: parsed.metadata?.description,
      author: parsed.metadata?.author,
      tags: parsed.metadata?.tags,
      kernel: parsed.metadata?.kernel ?? { name: 'typescript', language: 'typescript' },
      createdAt: parsed.metadata?.createdAt ?? Date.now(),
      updatedAt: parsed.metadata?.updatedAt ?? Date.now(),
      version: parsed.metadata?.version ?? '1.0.0',
    },
  };
}

/**
 * Merge two notebooks
 */
export function mergeNotebooks(a: Notebook, b: Notebook, title?: string): Notebook {
  return {
    id: randomUUID(),
    cells: [...a.cells, ...b.cells],
    metadata: {
      title: title ?? `Merged: ${a.metadata.title ?? 'A'} + ${b.metadata.title ?? 'B'}`,
      description: `Merged notebook from ${a.id} and ${b.id}`,
      kernel: a.metadata.kernel,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      version: '1.0.0',
    },
  };
}
