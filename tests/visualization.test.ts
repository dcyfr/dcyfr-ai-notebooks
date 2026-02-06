/**
 * Tests for visualization module
 */

import { describe, it, expect } from 'vitest';
import {
  createChart,
  addSeries,
  createSeries,
  barChart,
  lineChart,
  scatterPlot,
  pieChart,
  histogram,
  updateChartConfig,
  renderBarChart,
  renderTable,
  renderDatasetTable,
  renderStatsTable,
  sparkline,
  formatNumber,
  renderSummary,
  getTheme,
  getSeriesColor,
  registerTheme,
  themes,
  createDataset,
} from '../src/index.js';

describe('Chart Creation', () => {
  it('creates a chart with defaults', () => {
    const chart = createChart('bar', 'Test');
    expect(chart.config.type).toBe('bar');
    expect(chart.config.title).toBe('Test');
    expect(chart.config.width).toBe(800);
    expect(chart.config.height).toBe(400);
    expect(chart.config.theme).toBe('dcyfr');
    expect(chart.series).toEqual([]);
  });

  it('creates a chart with custom options', () => {
    const chart = createChart('line', 'Custom', {
      width: 1200,
      height: 600,
      theme: 'dark',
      xLabel: 'Time',
      yLabel: 'Value',
    });
    expect(chart.config.width).toBe(1200);
    expect(chart.config.theme).toBe('dark');
    expect(chart.config.xLabel).toBe('Time');
  });

  it('adds series to chart', () => {
    let chart = createChart('bar', 'Test');
    const series = createSeries('Revenue', [{ x: 'Q1', y: 100 }]);
    chart = addSeries(chart, series);
    expect(chart.series).toHaveLength(1);
    expect(chart.series[0].name).toBe('Revenue');
  });

  it('creates series with color', () => {
    const series = createSeries('Test', [{ x: 0, y: 1 }], '#ff0000');
    expect(series.color).toBe('#ff0000');
  });
});

describe('Chart Shortcuts', () => {
  it('creates a bar chart', () => {
    const chart = barChart('Sales', ['A', 'B', 'C'], [10, 20, 30]);
    expect(chart.config.type).toBe('bar');
    expect(chart.series).toHaveLength(1);
    expect(chart.series[0].data).toHaveLength(3);
  });

  it('creates a line chart', () => {
    const chart = lineChart('Trend', [1, 2, 3], [10, 20, 30]);
    expect(chart.config.type).toBe('line');
    expect(chart.series[0].data).toHaveLength(3);
  });

  it('creates a scatter plot', () => {
    const chart = scatterPlot('Scatter', [{ x: 1, y: 2 }, { x: 3, y: 4 }]);
    expect(chart.config.type).toBe('scatter');
    expect(chart.series[0].data).toHaveLength(2);
  });

  it('creates a pie chart', () => {
    const chart = pieChart('Distribution', ['A', 'B'], [60, 40]);
    expect(chart.config.type).toBe('pie');
  });

  it('creates a histogram', () => {
    const chart = histogram('Distribution', [1, 2, 2, 3, 3, 3, 4, 5], 4);
    expect(chart.config.type).toBe('histogram');
    expect(chart.series).toHaveLength(1);
  });

  it('handles empty histogram', () => {
    const chart = histogram('Empty', []);
    expect(chart.series).toEqual([]);
  });

  it('updates chart config', () => {
    const chart = createChart('bar', 'Original');
    const updated = updateChartConfig(chart, { title: 'Updated', width: 1000 });
    expect(updated.config.title).toBe('Updated');
    expect(updated.config.width).toBe(1000);
    expect(chart.config.title).toBe('Original'); // immutable
  });
});

describe('Text Rendering', () => {
  it('renders a bar chart', () => {
    const chart = barChart('Test', ['A', 'B', 'C'], [10, 20, 30]);
    const output = renderBarChart(chart, 30);
    expect(output).toContain('Test');
    expect(output).toContain('A');
    expect(output).toContain('B');
    expect(output).toContain('C');
    expect(output).toContain('█');
  });

  it('renders a table', () => {
    const output = renderTable(
      ['Name', 'Age'],
      [['Alice', 25], ['Bob', 30]]
    );
    expect(output).toContain('Name');
    expect(output).toContain('Age');
    expect(output).toContain('Alice');
    expect(output).toContain('30');
    expect(output).toContain('─');
  });

  it('renders a dataset table', () => {
    const ds = createDataset([
      { name: 'Alice', score: 90 },
      { name: 'Bob', score: 85 },
    ]);
    const output = renderDatasetTable(ds);
    expect(output).toContain('Alice');
    expect(output).toContain('Bob');
  });

  it('truncates long datasets', () => {
    const rows = Array.from({ length: 50 }, (_, i) => ({ id: i }));
    const ds = createDataset(rows);
    const output = renderDatasetTable(ds, 10);
    expect(output).toContain('more rows');
  });

  it('renders stats table', () => {
    const stats = [
      { column: 'score', count: 10, mean: 85, median: 84, stddev: 5, min: 70, max: 100, variance: 25, q25: 80, q75: 90, nullCount: 0 },
    ];
    const output = renderStatsTable(stats);
    expect(output).toContain('score');
    expect(output).toContain('85');
  });

  it('renders sparkline', () => {
    const line = sparkline([1, 3, 5, 7, 9]);
    expect(line.length).toBe(5);
    expect(line).toContain('▁');
    expect(line).toContain('█');
  });

  it('handles empty sparkline', () => {
    expect(sparkline([])).toBe('');
  });

  it('formats numbers', () => {
    expect(formatNumber(3.14159, 2)).toBe('3.14');
    expect(formatNumber(100, 0)).toBe('100');
  });

  it('renders summary', () => {
    const output = renderSummary('Model Stats', { Accuracy: '92%', Loss: '0.08' });
    expect(output).toContain('Model Stats');
    expect(output).toContain('Accuracy');
    expect(output).toContain('92%');
  });
});

describe('Themes', () => {
  it('has built-in themes', () => {
    expect(themes.dcyfr).toBeDefined();
    expect(themes.light).toBeDefined();
    expect(themes.dark).toBeDefined();
  });

  it('gets theme by name', () => {
    const theme = getTheme('light');
    expect(theme.name).toBe('light');
    expect(theme.background).toBe('#ffffff');
  });

  it('falls back to dcyfr theme', () => {
    const theme = getTheme('nonexistent');
    expect(theme.name).toBe('dcyfr');
  });

  it('gets series color with wrapping', () => {
    const theme = getTheme('dcyfr');
    const color0 = getSeriesColor(theme, 0);
    const colorWrapped = getSeriesColor(theme, theme.colors.length);
    expect(color0).toBe(colorWrapped);
  });

  it('registers a custom theme', () => {
    registerTheme({
      name: 'custom',
      background: '#111',
      foreground: '#eee',
      gridColor: '#333',
      colors: ['#f00', '#0f0'],
      fontFamily: 'monospace',
    });
    const theme = getTheme('custom');
    expect(theme.name).toBe('custom');
    expect(theme.colors).toEqual(['#f00', '#0f0']);
  });
});
