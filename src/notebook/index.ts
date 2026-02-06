/**
 * Notebook module barrel exports
 */

export {
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
} from './cell.js';

export {
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
} from './notebook.js';

export type { CreateNotebookOptions } from './notebook.js';

export {
  executeCell,
  executeNotebook,
  getExecutionSummary,
  createExecutionContext,
  defaultExecutor,
} from './runner.js';

export type { CellExecutor, ExecutionContext, ExecutionOptions } from './runner.js';
