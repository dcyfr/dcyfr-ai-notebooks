/**
 * Core types for the DCYFR notebooks framework
 *
 * Provides Zod schemas and TypeScript types for notebook cells, datasets,
 * data pipelines, visualization, and analysis workflows.
 */

import { z } from 'zod';

// ============================================================================
// Cell Types
// ============================================================================

/** Supported cell types */
export const CellTypeSchema = z.enum(['code', 'markdown', 'raw']);
export type CellType = z.infer<typeof CellTypeSchema>;

/** Cell execution status */
export const CellStatusSchema = z.enum([
  'idle',
  'running',
  'completed',
  'error',
  'skipped',
]);
export type CellStatus = z.infer<typeof CellStatusSchema>;

/** Cell output type */
export const CellOutputTypeSchema = z.enum([
  'text',
  'table',
  'chart',
  'image',
  'html',
  'json',
  'error',
]);
export type CellOutputType = z.infer<typeof CellOutputTypeSchema>;

/** Cell output */
export const CellOutputSchema = z.object({
  type: CellOutputTypeSchema,
  data: z.unknown(),
  mimeType: z.string().optional(),
  metadata: z.record(z.unknown()).optional(),
});
export type CellOutput = z.infer<typeof CellOutputSchema>;

/** A notebook cell */
export const CellSchema = z.object({
  id: z.string(),
  type: CellTypeSchema,
  source: z.string(),
  outputs: z.array(CellOutputSchema).default([]),
  status: CellStatusSchema.default('idle'),
  executionCount: z.number().int().nonnegative().optional(),
  metadata: z.record(z.unknown()).optional(),
  tags: z.array(z.string()).optional(),
});
export type Cell = z.infer<typeof CellSchema>;

// ============================================================================
// Notebook Types
// ============================================================================

/** Notebook kernel info */
export const KernelInfoSchema = z.object({
  name: z.string().default('typescript'),
  language: z.string().default('typescript'),
  version: z.string().optional(),
});
export type KernelInfo = z.infer<typeof KernelInfoSchema>;

/** Notebook metadata */
export const NotebookMetadataSchema = z.object({
  title: z.string().optional(),
  description: z.string().optional(),
  author: z.string().optional(),
  tags: z.array(z.string()).optional(),
  kernel: KernelInfoSchema.default({}),
  createdAt: z.number().optional(),
  updatedAt: z.number().optional(),
  version: z.string().default('1.0.0'),
});
export type NotebookMetadata = z.infer<typeof NotebookMetadataSchema>;

/** A complete notebook */
export const NotebookSchema = z.object({
  id: z.string(),
  cells: z.array(CellSchema),
  metadata: NotebookMetadataSchema.default({}),
});
export type Notebook = z.infer<typeof NotebookSchema>;

// ============================================================================
// Dataset Types
// ============================================================================

/** Column data types */
export const ColumnTypeSchema = z.enum([
  'string',
  'number',
  'boolean',
  'date',
  'object',
  'array',
  'null',
]);
export type ColumnType = z.infer<typeof ColumnTypeSchema>;

/** Column schema */
export const ColumnSchemaSchema = z.object({
  name: z.string(),
  type: ColumnTypeSchema,
  nullable: z.boolean().default(false),
  description: z.string().optional(),
  unique: z.boolean().optional(),
});
export type ColumnSchema = z.infer<typeof ColumnSchemaSchema>;

/** Dataset metadata */
export const DatasetMetadataSchema = z.object({
  name: z.string(),
  description: z.string().optional(),
  source: z.string().optional(),
  rows: z.number().int().nonnegative(),
  columns: z.array(ColumnSchemaSchema),
  createdAt: z.number().optional(),
  sizeBytes: z.number().int().nonnegative().optional(),
});
export type DatasetMetadata = z.infer<typeof DatasetMetadataSchema>;

/** A row of data */
export type DataRow = Record<string, unknown>;

/** A dataset (in-memory tabular data) */
export interface Dataset {
  metadata: DatasetMetadata;
  rows: DataRow[];
}

// ============================================================================
// Statistics Types
// ============================================================================

/** Descriptive statistics for a numeric column */
export const DescriptiveStatsSchema = z.object({
  column: z.string(),
  count: z.number().int().nonnegative(),
  mean: z.number(),
  median: z.number(),
  min: z.number(),
  max: z.number(),
  stddev: z.number().nonnegative(),
  variance: z.number().nonnegative(),
  q25: z.number(),
  q75: z.number(),
  nullCount: z.number().int().nonnegative(),
});
export type DescriptiveStats = z.infer<typeof DescriptiveStatsSchema>;

/** Correlation entry */
export const CorrelationEntrySchema = z.object({
  columnA: z.string(),
  columnB: z.string(),
  coefficient: z.number().min(-1).max(1),
});
export type CorrelationEntry = z.infer<typeof CorrelationEntrySchema>;

// ============================================================================
// Pipeline Types
// ============================================================================

/** Pipeline step status */
export const StepStatusSchema = z.enum([
  'pending',
  'running',
  'completed',
  'failed',
  'skipped',
]);
export type StepStatus = z.infer<typeof StepStatusSchema>;

/** Pipeline step definition */
export const PipelineStepSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().optional(),
  status: StepStatusSchema.default('pending'),
  startedAt: z.number().optional(),
  completedAt: z.number().optional(),
  error: z.string().optional(),
  metadata: z.record(z.unknown()).optional(),
});
export type PipelineStep = z.infer<typeof PipelineStepSchema>;

/** Pipeline configuration */
export const PipelineConfigSchema = z.object({
  name: z.string(),
  description: z.string().optional(),
  steps: z.array(z.string()),
  retryOnFailure: z.boolean().default(false),
  maxRetries: z.number().int().nonnegative().default(3),
  continueOnError: z.boolean().default(false),
  verbose: z.boolean().default(false),
});
export type PipelineConfig = z.infer<typeof PipelineConfigSchema>;

/** Pipeline run result */
export const PipelineResultSchema = z.object({
  pipelineName: z.string(),
  status: z.enum(['completed', 'failed', 'partial']),
  steps: z.array(PipelineStepSchema),
  startedAt: z.number(),
  completedAt: z.number(),
  durationMs: z.number().nonnegative(),
  error: z.string().optional(),
});
export type PipelineResult = z.infer<typeof PipelineResultSchema>;

// ============================================================================
// Visualization Types
// ============================================================================

/** Chart types */
export const ChartTypeSchema = z.enum([
  'bar',
  'line',
  'scatter',
  'pie',
  'histogram',
  'heatmap',
  'box',
  'area',
]);
export type ChartType = z.infer<typeof ChartTypeSchema>;

/** Chart configuration */
export const ChartConfigSchema = z.object({
  type: ChartTypeSchema,
  title: z.string().optional(),
  xLabel: z.string().optional(),
  yLabel: z.string().optional(),
  width: z.number().int().positive().default(800),
  height: z.number().int().positive().default(400),
  colors: z.array(z.string()).optional(),
  theme: z.enum(['light', 'dark', 'dcyfr']).default('dcyfr'),
  showLegend: z.boolean().default(true),
  showGrid: z.boolean().default(true),
});
export type ChartConfig = z.infer<typeof ChartConfigSchema>;

/** Data point for charts */
export const DataPointSchema = z.object({
  x: z.union([z.number(), z.string()]),
  y: z.number(),
});
export type DataPoint = z.infer<typeof DataPointSchema>;

/** A data series for charting */
export const DataSeriesSchema = z.object({
  name: z.string(),
  data: z.array(DataPointSchema),
  color: z.string().optional(),
});
export type DataSeries = z.infer<typeof DataSeriesSchema>;

/** Chart specification (ready to render) */
export const ChartSpecSchema = z.object({
  config: ChartConfigSchema,
  series: z.array(DataSeriesSchema),
});
export type ChartSpec = z.infer<typeof ChartSpecSchema>;

// ============================================================================
// Analysis Types
// ============================================================================

/** Analysis type */
export const AnalysisTypeSchema = z.enum([
  'exploratory',
  'descriptive',
  'comparative',
  'predictive',
  'diagnostic',
]);
export type AnalysisType = z.infer<typeof AnalysisTypeSchema>;

/** Analysis report */
export const AnalysisReportSchema = z.object({
  title: z.string(),
  type: AnalysisTypeSchema,
  summary: z.string(),
  findings: z.array(z.string()),
  datasetName: z.string(),
  statistics: z.array(DescriptiveStatsSchema).optional(),
  charts: z.array(ChartSpecSchema).optional(),
  createdAt: z.number(),
  metadata: z.record(z.unknown()).optional(),
});
export type AnalysisReport = z.infer<typeof AnalysisReportSchema>;
