/**
 * @dcyfr/ai-notebooks
 * Data science notebook toolkit for TypeScript
 */

// Types & Schemas
export type {
  CellType,
  CellStatus,
  CellOutputType,
  CellOutput,
  Cell,
  KernelInfo,
  NotebookMetadata,
  Notebook,
  ColumnType,
  ColumnSchema,
  DatasetMetadata,
  DataRow,
  Dataset,
  DescriptiveStats,
  CorrelationEntry,
  StepStatus,
  PipelineStep,
  PipelineConfig,
  PipelineResult,
  ChartType,
  ChartConfig,
  DataSeries,
  ChartSpec,
  AnalysisType,
  AnalysisReport,
} from './types/index.js';

// Notebook
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
} from './notebook/index.js';

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
} from './notebook/index.js';

export {
  defaultExecutor,
  createExecutionContext,
  executeCell,
  executeNotebook,
  getExecutionSummary,
} from './notebook/index.js';

export type {
  CellExecutor,
  ExecutionContext,
  ExecutionOptions,
} from './notebook/index.js';

// Pipeline
export {
  inferColumnType,
  inferSchema,
  createDataset,
  selectColumns,
  filterRows,
  sortBy,
  uniqueValues,
  groupBy,
  getColumn,
  getNumericColumn,
  sampleRows,
  head,
  tail,
  addColumn,
  renameColumn,
  dropNulls,
} from './pipeline/index.js';

export {
  mapRows,
  aggregate,
  innerJoin,
  pivot,
  normalize,
  fillNulls,
  concat,
} from './pipeline/index.js';

export {
  sum,
  mean,
  median,
  variance,
  stddev,
  quantile,
  pearsonCorrelation,
  describeColumn,
  describe,
  correlationMatrix,
  valueCounts,
  missingValues,
} from './pipeline/index.js';

export {
  createPipeline,
  PipelineBuilder,
  executePipeline,
} from './pipeline/index.js';

export type {
  StepFn,
  PipelineContext,
  PipelineDefinition,
  PipelineRunResult,
} from './pipeline/index.js';

// Visualization
export {
  createChart,
  addSeries,
  createSeries,
  barChart,
  lineChart,
  scatterPlot,
  pieChart,
  histogram,
  updateChartConfig,
} from './visualization/index.js';

export {
  renderBarChart,
  renderTable,
  renderDatasetTable,
  renderStatsTable,
  sparkline,
  formatNumber,
  renderSummary,
} from './visualization/index.js';

export {
  themes,
  getTheme,
  getSeriesColor,
  registerTheme,
} from './visualization/index.js';

export type { ChartTheme } from './visualization/index.js';

// Utils
export {
  parseCSV,
  toCSV,
} from './utils/index.js';

export {
  formatBytes,
  formatDuration,
  formatWithCommas,
  formatPercent,
  truncate,
  padTo,
  formatTimestamp,
  progressBar,
} from './utils/index.js';

export {
  validateDataset,
  required,
  isNumber,
  isString,
  inRange,
  matchesPattern,
  oneOf,
  stringLength,
} from './utils/index.js';

export type {
  ValidationResult,
  ValidationError,
  ValidationWarning,
  ColumnValidator,
} from './utils/index.js';
