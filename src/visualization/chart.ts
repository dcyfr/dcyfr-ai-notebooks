/**
 * Chart Builder - Chart specification creation
 */

import type { ChartConfig, ChartSpec, ChartType, DataSeries } from '../types/index.js';

/**
 * Create a chart spec
 */
export function createChart(
  type: ChartType,
  title: string,
  options?: Partial<ChartConfig>
): ChartSpec {
  return {
    config: {
      type,
      title,
      xLabel: options?.xLabel ?? '',
      yLabel: options?.yLabel ?? '',
      width: options?.width ?? 800,
      height: options?.height ?? 400,
      colors: options?.colors,
      theme: options?.theme ?? 'dcyfr',
      showLegend: options?.showLegend ?? true,
      showGrid: options?.showGrid ?? true,
    },
    series: [],
  };
}

/**
 * Add a data series to a chart
 */
export function addSeries(chart: ChartSpec, series: DataSeries): ChartSpec {
  return {
    ...chart,
    series: [...chart.series, series],
  };
}

/**
 * Create a data series
 */
export function createSeries(
  name: string,
  data: Array<{ x: number | string; y: number }>,
  color?: string
): DataSeries {
  return { name, data, color };
}

/**
 * Shortcut: create a bar chart
 */
export function barChart(
  title: string,
  labels: string[],
  values: number[],
  options?: Partial<ChartConfig>
): ChartSpec {
  const chart = createChart('bar', title, options);
  const data = labels.map((label, i) => ({ x: label, y: values[i] ?? 0 }));
  return addSeries(chart, createSeries(title, data));
}

/**
 * Shortcut: create a line chart
 */
export function lineChart(
  title: string,
  xValues: number[],
  yValues: number[],
  options?: Partial<ChartConfig>
): ChartSpec {
  const chart = createChart('line', title, options);
  const data = xValues.map((x, i) => ({ x, y: yValues[i] ?? 0 }));
  return addSeries(chart, createSeries(title, data));
}

/**
 * Shortcut: create a scatter plot
 */
export function scatterPlot(
  title: string,
  points: Array<{ x: number; y: number }>,
  options?: Partial<ChartConfig>
): ChartSpec {
  const chart = createChart('scatter', title, options);
  return addSeries(chart, createSeries(title, points));
}

/**
 * Shortcut: create a pie chart
 */
export function pieChart(
  title: string,
  labels: string[],
  values: number[],
  options?: Partial<ChartConfig>
): ChartSpec {
  const chart = createChart('pie', title, options);
  const data = labels.map((label, i) => ({ x: label, y: values[i] ?? 0 }));
  return addSeries(chart, createSeries(title, data));
}

/**
 * Shortcut: create a histogram
 */
export function histogram(
  title: string,
  values: number[],
  bins = 10,
  options?: Partial<ChartConfig>
): ChartSpec {
  const chart = createChart('histogram', title, options);

  if (values.length === 0) return chart;

  const min = Math.min(...values);
  const max = Math.max(...values);
  const binWidth = (max - min) / bins;

  const counts = new Array(bins).fill(0) as number[];
  for (const v of values) {
    const idx = Math.min(Math.floor((v - min) / binWidth), bins - 1);
    counts[idx]++;
  }

  const data = counts.map((count, i) => ({
    x: Number((min + i * binWidth + binWidth / 2).toFixed(2)),
    y: count,
  }));

  return addSeries(chart, createSeries(title, data));
}

/**
 * Update chart configuration
 */
export function updateChartConfig(
  chart: ChartSpec,
  updates: Partial<ChartConfig>
): ChartSpec {
  return {
    ...chart,
    config: { ...chart.config, ...updates },
  };
}
