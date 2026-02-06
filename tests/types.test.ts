/**
 * Tests for types/index.ts - Zod schema validation
 */

import { describe, it, expect } from 'vitest';
import {
  CellTypeSchema,
  CellStatusSchema,
  CellOutputTypeSchema,
  CellOutputSchema,
  CellSchema,
  KernelInfoSchema,
  NotebookMetadataSchema,
  NotebookSchema,
  ColumnTypeSchema,
  ColumnSchemaSchema,
  DatasetMetadataSchema,
  DescriptiveStatsSchema,
  CorrelationEntrySchema,
  StepStatusSchema,
  PipelineStepSchema,
  PipelineConfigSchema,
  PipelineResultSchema,
  ChartTypeSchema,
  ChartConfigSchema,
  DataSeriesSchema,
  ChartSpecSchema,
  AnalysisTypeSchema,
  AnalysisReportSchema,
} from '../src/types/index.js';

describe('Cell Schemas', () => {
  it('validates cell types', () => {
    expect(CellTypeSchema.parse('code')).toBe('code');
    expect(CellTypeSchema.parse('markdown')).toBe('markdown');
    expect(CellTypeSchema.parse('raw')).toBe('raw');
    expect(() => CellTypeSchema.parse('invalid')).toThrow();
  });

  it('validates cell statuses', () => {
    for (const status of ['idle', 'running', 'completed', 'error', 'skipped']) {
      expect(CellStatusSchema.parse(status)).toBe(status);
    }
    expect(() => CellStatusSchema.parse('unknown')).toThrow();
  });

  it('validates cell output types', () => {
    for (const t of ['text', 'table', 'chart', 'image', 'html', 'json', 'error']) {
      expect(CellOutputTypeSchema.parse(t)).toBe(t);
    }
  });

  it('validates cell output', () => {
    const output = CellOutputSchema.parse({
      type: 'text',
      data: 'Hello world',
    });
    expect(output.type).toBe('text');
    expect(output.data).toBe('Hello world');
  });

  it('validates cell output with metadata', () => {
    const output = CellOutputSchema.parse({
      type: 'chart',
      data: '{}',
      metadata: { format: 'svg' },
    });
    expect(output.metadata).toEqual({ format: 'svg' });
  });

  it('validates a full cell', () => {
    const cell = CellSchema.parse({
      id: 'cell-1',
      type: 'code',
      source: 'console.log("hi")',
      outputs: [],
      status: 'idle',
      executionCount: 0,
      metadata: {},
      tags: [],
    });
    expect(cell.id).toBe('cell-1');
    expect(cell.type).toBe('code');
    expect(cell.status).toBe('idle');
  });
});

describe('Notebook Schemas', () => {
  it('validates kernel info with defaults', () => {
    const kernel = KernelInfoSchema.parse({});
    expect(kernel.name).toBe('typescript');
    expect(kernel.language).toBe('typescript');
  });

  it('validates notebook metadata', () => {
    const meta = NotebookMetadataSchema.parse({
      title: 'Test Notebook',
    });
    expect(meta.title).toBe('Test Notebook');
    expect(meta.version).toBe('1.0.0');
  });

  it('validates a full notebook', () => {
    const nb = NotebookSchema.parse({
      id: 'nb-1',
      cells: [],
      metadata: { title: 'Test' },
    });
    expect(nb.id).toBe('nb-1');
    expect(nb.cells).toEqual([]);
  });
});

describe('Dataset Schemas', () => {
  it('validates column types', () => {
    for (const t of ['string', 'number', 'boolean', 'date', 'object', 'array', 'null']) {
      expect(ColumnTypeSchema.parse(t)).toBe(t);
    }
  });

  it('validates column schema', () => {
    const col = ColumnSchemaSchema.parse({
      name: 'age',
      type: 'number',
    });
    expect(col.name).toBe('age');
    expect(col.nullable).toBe(false); // default
  });

  it('validates dataset metadata', () => {
    const meta = DatasetMetadataSchema.parse({
      name: 'test',
      rows: 100,
      columns: [{ name: 'id', type: 'number' }],
    });
    expect(meta.rows).toBe(100);
  });
});

describe('Statistics Schemas', () => {
  it('validates descriptive stats', () => {
    const stats = DescriptiveStatsSchema.parse({
      column: 'score',
      count: 10,
      mean: 5.0,
      median: 5.0,
      min: 1,
      max: 10,
      stddev: 2.5,
      variance: 6.25,
      q25: 3.0,
      q75: 7.0,
      nullCount: 0,
    });
    expect(stats.count).toBe(10);
  });

  it('validates correlation entry', () => {
    const entry = CorrelationEntrySchema.parse({
      columnA: 'x',
      columnB: 'y',
      coefficient: 0.85,
    });
    expect(entry.coefficient).toBe(0.85);
  });
});

describe('Pipeline Schemas', () => {
  it('validates step statuses', () => {
    for (const s of ['pending', 'running', 'completed', 'failed', 'skipped']) {
      expect(StepStatusSchema.parse(s)).toBe(s);
    }
  });

  it('validates pipeline step', () => {
    const step = PipelineStepSchema.parse({
      id: 'step-1',
      name: 'load-data',
      status: 'completed',
    });
    expect(step.name).toBe('load-data');
  });

  it('validates pipeline config', () => {
    const config = PipelineConfigSchema.parse({
      name: 'my-pipeline',
      steps: ['load', 'transform', 'output'],
    });
    expect(config.steps).toHaveLength(3);
    expect(config.retryOnFailure).toBe(false); // default
  });

  it('validates pipeline result', () => {
    const result = PipelineResultSchema.parse({
      pipelineName: 'test',
      status: 'completed',
      steps: [],
      startedAt: Date.now(),
      completedAt: Date.now(),
      durationMs: 100,
    });
    expect(result.status).toBe('completed');
  });
});

describe('Visualization Schemas', () => {
  it('validates chart types', () => {
    for (const t of ['bar', 'line', 'scatter', 'pie', 'histogram', 'heatmap', 'box', 'area']) {
      expect(ChartTypeSchema.parse(t)).toBe(t);
    }
  });

  it('validates chart config with defaults', () => {
    const config = ChartConfigSchema.parse({
      type: 'bar',
      title: 'Test Chart',
    });
    expect(config.width).toBe(800);
    expect(config.height).toBe(400);
    expect(config.theme).toBe('dcyfr');
  });

  it('validates data series', () => {
    const series = DataSeriesSchema.parse({
      name: 'Sales',
      data: [{ x: 'Q1', y: 100 }, { x: 'Q2', y: 200 }],
    });
    expect(series.data).toHaveLength(2);
  });

  it('validates chart spec', () => {
    const spec = ChartSpecSchema.parse({
      config: { type: 'line', title: 'Trend' },
      series: [],
    });
    expect(spec.series).toEqual([]);
  });
});

describe('Analysis Schemas', () => {
  it('validates analysis types', () => {
    for (const t of ['exploratory', 'descriptive', 'comparative', 'predictive', 'diagnostic']) {
      expect(AnalysisTypeSchema.parse(t)).toBe(t);
    }
  });

  it('validates analysis report', () => {
    const report = AnalysisReportSchema.parse({
      title: 'Q1 Analysis',
      type: 'exploratory',
      summary: 'Overview of Q1 data',
      findings: ['Growth trend detected'],
      datasetName: 'q1_data',
      createdAt: Date.now(),
    });
    expect(report.findings).toHaveLength(1);
  });
});
