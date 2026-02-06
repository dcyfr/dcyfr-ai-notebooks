/**
 * Visualization module barrel exports
 */

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
} from './chart.js';

export {
  renderBarChart,
  renderTable,
  renderDatasetTable,
  renderStatsTable,
  sparkline,
  formatNumber,
  renderSummary,
} from './formatter.js';

export {
  themes,
  getTheme,
  getSeriesColor,
  registerTheme,
} from './themes.js';

export type { ChartTheme } from './themes.js';
