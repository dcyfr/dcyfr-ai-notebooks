/**
 * Example: Data Exploration
 *
 * Demonstrates loading data, computing statistics,
 * and rendering visual summaries.
 */

import {
  createDataset,
  describe,
  head,
  sortBy,
  uniqueValues,
  valueCounts,
  correlationMatrix,
  barChart,
  renderBarChart,
  renderDatasetTable,
  renderStatsTable,
  sparkline,
  parseCSV,
} from '../src/index.js';

// ---- 1. Create a sample dataset ----

const salesData = createDataset(
  [
    { product: 'Widget A', category: 'Hardware', revenue: 12500, units: 250, margin: 0.35 },
    { product: 'Widget B', category: 'Hardware', revenue: 8900, units: 178, margin: 0.28 },
    { product: 'Service X', category: 'Software', revenue: 45000, units: 120, margin: 0.72 },
    { product: 'Service Y', category: 'Software', revenue: 32000, units: 95, margin: 0.68 },
    { product: 'Gadget C', category: 'Hardware', revenue: 5600, units: 320, margin: 0.15 },
    { product: 'Platform Z', category: 'Software', revenue: 67000, units: 45, margin: 0.85 },
    { product: 'Tool D', category: 'Hardware', revenue: 15800, units: 410, margin: 0.22 },
    { product: 'App W', category: 'Software', revenue: 28000, units: 200, margin: 0.65 },
  ],
  'sales_q1'
);

console.log('=== Sales Data (First 5 rows) ===\n');
console.log(renderDatasetTable(head(salesData)));

// ---- 2. Descriptive Statistics ----

console.log('\n=== Descriptive Statistics ===\n');
const stats = describe(salesData);
console.log(renderStatsTable(stats));

// ---- 3. Top products by revenue ----

console.log('\n=== Top Products by Revenue ===\n');
const sorted = sortBy(salesData, 'revenue', false);
console.log(renderDatasetTable(head(sorted)));

// ---- 4. Category breakdown ----

console.log('\n=== Categories ===');
const categories = uniqueValues(salesData, 'category');
console.log('Unique categories:', categories);

const categoryCounts = valueCounts(salesData, 'category');
console.log('Category counts:', Object.fromEntries(categoryCounts));

// ---- 5. Revenue chart ----

console.log('\n=== Revenue by Product ===\n');
const products = salesData.rows.map((r) => String(r.product));
const revenues = salesData.rows.map((r) => r.revenue as number);
const chart = barChart('Revenue by Product', products, revenues);
console.log(renderBarChart(chart, 40));

// ---- 6. Sparkline ----

console.log('\n=== Revenue Trend ===');
console.log('Revenue:', sparkline(revenues));

// ---- 7. Correlation ----

console.log('\n=== Correlation Matrix ===');
const corr = correlationMatrix(salesData);
for (const entry of corr) {
  console.log(`  ${entry.columnA} ↔ ${entry.columnB}: ${entry.coefficient.toFixed(3)}`);
}

// ---- 8. CSV round-trip ----

console.log('\n=== CSV Parsing Example ===\n');
const csvData = `name,age,score
Alice,25,92.5
Bob,30,88.0
Charlie,22,95.3`;

const parsed = parseCSV(csvData, { name: 'students' });
console.log(renderDatasetTable(parsed));
console.log('\nDataset info:', parsed.metadata.name, '-', parsed.metadata.rows, 'rows,', parsed.metadata.columns.length, 'columns');
