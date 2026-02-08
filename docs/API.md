<!-- TLP:CLEAR -->
# API Reference - @dcyfr/ai-notebooks

**Version:** 1.0.0  
**Package:** @dcyfr/ai-notebooks  
**Description:** Data science notebook toolkit for TypeScript with Jupyter compatibility

---

## Table of Contents

1. [Overview](#overview)
2. [Installation](#installation)
3. [Quick Start](#quick-start)
4. [Notebook API](#notebook-api)
5. [Cell API](#cell-api)
6. [Execution API](#execution-api)
7. [Dataset API](#dataset-api)
8. [Statistics API](#statistics-api)
9. [Pipeline API](#pipeline-api)
10. [Visualization API](#visualization-api)
11. [Utilities API](#utilities-api)
12. [Jupyter Integration](#jupyter-integration)
13. [TypeScript Signatures](#typescript-signatures)
14. [Advanced Usage](#advanced-usage)
15. [SemVer Commitment](#semver-commitment)

---

## Overview

`@dcyfr/ai-notebooks` provides a comprehensive TypeScript-native toolkit for computational notebooks and data science workflows. It combines:

- **Notebook Management** — Create, execute, and manipulate computational notebooks with cells, outputs, and metadata
- **Data Pipelines** — Build composable ETL workflows with transforms, aggregations, and validation
- **Statistical Analysis** — Descriptive statistics, correlation, quantiles, and frequency analysis
- **Visualization** — Chart creation and text-based rendering for data exploration
- **Jupyter Compatibility** — Import/export notebooks in nbformat, integrate with IPython kernels

**Design Philosophy:**
- **Functional & Immutable** — All operations return new objects, no mutations
- **Type-Safe** — Full TypeScript support with runtime validation via Zod
- **Composable** — Small, focused functions that combine into complex workflows
- **Portable** — Works in Node.js, Deno, Bun, and browser environments

---

## Installation

```bash
npm install @dcyfr/ai-notebooks
```

### Peer Dependencies

```json
{
  "csv-parse": "^5.0.0",
  "zod": "^3.22.0"
}
```

### TypeScript Configuration

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "esModuleInterop": true
  }
}
```

---

## Quick Start

### 1. Create and Execute a Notebook

```typescript
import {
  createNotebook,
  addCell,
  codeCell,
  markdownCell,
  executeNotebook,
  getExecutionSummary,
} from '@dcyfr/ai-notebooks';

// Create notebook with metadata
let nb = createNotebook({
  title: 'My Analysis',
  author: 'Data Scientist',
  createdAt: new Date(),
});

// Add cells
nb = addCell(nb, markdownCell('# Data Analysis\n\nExploring the dataset...'));
nb = addCell(nb, codeCell('const data = [1, 2, 3, 4, 5];'));
nb = addCell(nb, codeCell('const sum = data.reduce((a, b) => a + b, 0);'));
nb = addCell(nb, codeCell('console.log("Sum:", sum);'));

// Execute the notebook
const { result, outputs } = await executeNotebook(nb);

// Check execution summary
const summary = getExecutionSummary(result);
console.log(`Executed ${summary.completed}/${summary.total} cells`);
console.log(`Errors: ${summary.errors}`);
```

### 2. Data Analysis with Datasets

```typescript
import {
  createDataset,
  describe,
  sortBy,
  head,
  renderDatasetTable,
  renderStatsTable,
} from '@dcyfr/ai-notebooks';

// Create dataset
const data = createDataset([
  { name: 'Alice', age: 28, score: 92.5 },
  { name: 'Bob', age: 34, score: 88.0 },
  { name: 'Charlie', age: 22, score: 95.3 },
  { name: 'Diana', age: 29, score: 87.8 },
], 'students');

// Descriptive statistics
const stats = describe(data);
console.log(renderStatsTable(stats));

// Top performers
const topScores = head(sortBy(data, 'score', false), 3);
console.log(renderDatasetTable(topScores));
```

### 3. Data Pipeline

```typescript
import {
  createPipeline,
  filterRows,
  sortBy,
  selectColumns,
  type Dataset,
} from '@dcyfr/ai-notebooks';

const pipeline = createPipeline<Dataset>('clean-and-sort')
  .step('filter', async (data) =>
    filterRows(data, (row) => (row.age as number) >= 25)
  )
  .step('sort', async (data) =>
    sortBy(data, 'score', false)
  )
  .step('select', async (data) =>
    selectColumns(data, ['name', 'score'])
  );

const { result, output } = await pipeline.run(data);
console.log('Cleaned data:', output);
```

### 4. Visualization

```typescript
import {
  barChart,
  renderBarChart,
  sparkline,
  themes,
} from '@dcyfr/ai-notebooks';

// Bar chart
const chart = barChart(
  'Sales by Quarter',
  ['Q1', 'Q2', 'Q3', 'Q4'],
  [120000, 150000, 180000, 200000]
);
console.log(renderBarChart(chart, 50));

// Sparkline for trends
console.log('Trend:', sparkline([120000, 150000, 180000, 200000]));
```

---

## Notebook API

### Core Functions

#### `createNotebook(metadata?: Partial<NotebookMetadata>): Notebook`

Create a new empty notebook.

```typescript
const nb = createNotebook({
  title: 'Exploratory Analysis',
  author: 'Data Team',
  description: 'Initial data exploration',
  createdAt: new Date(),
  tags: ['exploration', 'q1-2026'],
});
```

**Parameters:**
- `metadata` (optional): Notebook metadata (title, author, description, tags, createdAt, modifiedAt)

**Returns:** `Notebook` object with empty cells array

---

#### `addCell(notebook: Notebook, cell: Cell): Notebook`

Add a cell to the end of a notebook.

```typescript
let nb = createNotebook();
nb = addCell(nb, markdownCell('# Title'));
nb = addCell(nb, codeCell('const x = 42;'));
```

**Parameters:**
- `notebook`: Notebook to modify
- `cell`: Cell to add (created via `codeCell`, `markdownCell`, or `rawCell`)

**Returns:** New notebook with cell appended

---

#### `insertCell(notebook: Notebook, index: number, cell: Cell): Notebook`

Insert a cell at a specific position.

```typescript
nb = insertCell(nb, 1, codeCell('// Inserted cell'));
```

**Parameters:**
- `notebook`: Notebook to modify
- `index`: Position to insert (0-based)
- `cell`: Cell to insert

**Returns:** New notebook with cell inserted

---

#### `removeCell(notebook: Notebook, index: number): Notebook`

Remove a cell by index.

```typescript
nb = removeCell(nb, 2); // Remove third cell
```

---

#### `moveCell(notebook: Notebook, fromIndex: number, toIndex: number): Notebook`

Move a cell from one position to another.

```typescript
nb = moveCell(nb, 0, 3); // Move first cell to fourth position
```

---

#### `updateCell(notebook: Notebook, index: number, updater: (cell: Cell) => Cell): Notebook`

Update a cell using a transformation function.

```typescript
nb = updateCell(nb, 0, (cell) => ({
  ...cell,
  source: cell.source.toUpperCase(),
}));
```

---

#### `exportNotebook(notebook: Notebook): string`

Serialize notebook to JSON (nbformat-compatible).

```typescript
const json = exportNotebook(nb);
fs.writeFileSync('notebook.ipynb', json);
```

**Returns:** JSON string representation

---

#### `importNotebook(json: string): Notebook`

Parse a JSON notebook.

```typescript
const json = fs.readFileSync('notebook.ipynb', 'utf-8');
const nb = importNotebook(json);
```

**Throws:** Error if JSON is invalid or schema validation fails

---

#### `mergeNotebooks(...notebooks: Notebook[]): Notebook`

Merge multiple notebooks into one.

```typescript
const merged = mergeNotebooks(nb1, nb2, nb3);
// Metadata from first notebook, cells concatenated
```

---

### Query Functions

#### `getCell(notebook: Notebook, index: number): Cell | undefined`

Get a cell by index.

```typescript
const cell = getCell(nb, 0);
if (cell) {
  console.log(cell.cellType, cell.source);
}
```

---

#### `cellCount(notebook: Notebook): number`

Get total number of cells.

```typescript
console.log(`Notebook has ${cellCount(nb)} cells`);
```

---

#### `codeCellCount(notebook: Notebook): number`

Count code cells (excludes markdown and raw).

```typescript
console.log(`${codeCellCount(nb)} executable cells`);
```

---

#### `clearAllOutputs(notebook: Notebook): Notebook`

Remove all outputs from all cells.

```typescript
nb = clearAllOutputs(nb); // Clean slate for re-execution
```

---

## Cell API

### Cell Creation

#### `codeCell(source: string, metadata?: Partial<Cell['metadata']>): Cell`

Create a code cell.

```typescript
const cell = codeCell('console.log("Hello, world!");', {
  tags: ['example'],
  executionCount: null,
});
```

**Parameters:**
- `source`: Cell source code
- `metadata` (optional): Cell-level metadata (tags, collapsed, executionCount)

**Returns:** Cell with `cellType: 'code'`

---

#### `markdownCell(source: string): Cell`

Create a markdown cell.

```typescript
const md = markdownCell('# Introduction\n\nThis notebook analyzes...');
```

---

#### `rawCell(source: string): Cell`

Create a raw cell (no processing).

```typescript
const raw = rawCell('\\documentclass{article}...'); // LaTeX, etc.
```

---

### Cell Operations

#### `createOutput(outputType: CellOutputType, data: unknown): CellOutput`

Create a cell output.

```typescript
const output = createOutput('stream', { name: 'stdout', text: 'Hello\n' });
const errorOutput = createOutput('error', {
  ename: 'TypeError',
  evalue: 'Cannot read property...',
  traceback: ['line 1', 'line 2'],
});
```

**Output Types:**
- `'stream'`: stdout/stderr output
- `'display_data'`: Rich display (images, HTML, JSON)
- `'execute_result'`: Execution result with MIME types
- `'error'`: Error with traceback

---

#### `addOutput(cell: Cell, output: CellOutput): Cell`

Add an output to a cell.

```typescript
let cell = codeCell('console.log(42)');
cell = addOutput(cell, createOutput('stream', { name: 'stdout', text: '42\n' }));
```

---

#### `clearOutputs(cell: Cell): Cell`

Remove all outputs from a cell.

```typescript
cell = clearOutputs(cell);
```

---

### Cell Status

#### `markRunning(cell: Cell): Cell`

Mark cell as running.

```typescript
cell = markRunning(cell);
console.log(cell.status); // 'running'
```

---

#### `markCompleted(cell: Cell): Cell`

Mark cell as completed.

```typescript
cell = markCompleted(cell);
console.log(cell.status); // 'completed'
```

---

#### `markError(cell: Cell, error: Error): Cell`

Mark cell as error and add error output.

```typescript
try {
  // execution failed
} catch (err) {
  cell = markError(cell, err as Error);
}
```

---

### Cell Utilities

#### `filterCodeCells(cells: Cell[]): Cell[]`

Filter to code cells only.

```typescript
const codeCells = filterCodeCells(nb.cells);
console.log(`${codeCells.length} code cells`);
```

---

#### `filterByTag(cells: Cell[], tag: string): Cell[]`

Filter cells by metadata tag.

```typescript
const examples = filterByTag(nb.cells, 'example');
```

---

#### `hasOutputs(cell: Cell): boolean`

Check if cell has any outputs.

```typescript
if (hasOutputs(cell)) {
  console.log('Cell has', cell.outputs.length, 'outputs');
}
```

---

## Execution API

### Notebook Execution

#### `executeNotebook(notebook: Notebook, options?: ExecutionOptions): Promise<{ result: Notebook; outputs: CellOutput[] }>`

Execute all cells in a notebook.

```typescript
const { result, outputs } = await executeNotebook(nb, {
  executor: defaultExecutor,
  stopOnError: false,
  timeout: 30000, // 30 seconds per cell
});

console.log('Execution complete:', result.metadata.executionCount);
```

**Options:**
- `executor`: Custom cell executor function (default: `defaultExecutor`)
- `stopOnError`: If `true`, stop execution on first error (default: `false`)
- `timeout`: Maximum execution time per cell in milliseconds (default: none)

**Returns:**
- `result`: Notebook with updated cells (status, outputs, executionCount)
- `outputs`: All outputs produced during execution

---

#### `executeCell(cell: Cell, context: ExecutionContext): Promise<Cell>`

Execute a single cell.

```typescript
const context = createExecutionContext();
const executed = await executeCell(cell, context);

if (executed.status === 'error') {
  console.error('Cell failed:', executed.outputs[0]);
}
```

---

#### `getExecutionSummary(notebook: Notebook): { total: number; completed: number; errors: number; pending: number }`

Get execution statistics.

```typescript
const summary = getExecutionSummary(nb);
console.log(`
  Total: ${summary.total}
  Completed: ${summary.completed}
  Errors: ${summary.errors}
  Pending: ${summary.pending}
`);
```

---

### Custom Executors

Create custom cell executors for different runtimes:

```typescript
import type { CellExecutor } from '@dcyfr/ai-notebooks';

const pythonExecutor: CellExecutor = async (source, context) => {
  // Execute Python code via IPython kernel
  const result = await ipythonKernel.execute(source);
  return {
    outputs: result.outputs,
    status: result.status === 'ok' ? 'completed' : 'error',
  };
};

const { result } = await executeNotebook(nb, {
  executor: pythonExecutor,
});
```

---

## Dataset API

### Creating Datasets

#### `createDataset<T = DataRow>(rows: T[], name?: string): Dataset<T>`

Create a dataset from an array of objects.

```typescript
const sales = createDataset([
  { product: 'Widget A', revenue: 12500, units: 250 },
  { product: 'Widget B', revenue: 8900, units: 178 },
  { product: 'Service X', revenue: 45000, units: 120 },
], 'sales_q1');

console.log(sales.name); // 'sales_q1'
console.log(sales.rows.length); // 3
console.log(sales.schema); // Inferred schema
```

**Schema Inference:**
Automatically infers column types (string, number, boolean, date, null, unknown).

---

### Dataset Operations

#### `selectColumns<T>(dataset: Dataset<T>, columns: string[]): Dataset`

Select specific columns.

```typescript
const subset = selectColumns(sales, ['product', 'revenue']);
// Only product and revenue columns
```

---

#### `filterRows<T>(dataset: Dataset<T>, predicate: (row: T) => boolean): Dataset<T>`

Filter rows by condition.

```typescript
const highRevenue = filterRows(sales, (row) => row.revenue > 10000);
```

---

#### `sortBy<T>(dataset: Dataset<T>, column: string, ascending: boolean = true): Dataset<T>`

Sort dataset by column.

```typescript
const sorted = sortBy(sales, 'revenue', false); // Descending
```

---

#### `uniqueValues<T>(dataset: Dataset<T>, column: string): unknown[]`

Get unique values from a column.

```typescript
const products = uniqueValues(sales, 'product');
console.log('Unique products:', products);
```

---

#### `groupBy<T>(dataset: Dataset<T>, column: string): Map<unknown, T[]>`

Group rows by column value.

```typescript
const byCategory = groupBy(sales, 'category');
byCategory.forEach((rows, category) => {
  console.log(`${category}: ${rows.length} rows`);
});
```

---

#### `head<T>(dataset: Dataset<T>, n: number = 5): Dataset<T>`

Get first N rows.

```typescript
const top5 = head(sales, 5);
```

---

#### `tail<T>(dataset: Dataset<T>, n: number = 5): Dataset<T>`

Get last N rows.

```typescript
const bottom5 = tail(sales, 5);
```

---

#### `sampleRows<T>(dataset: Dataset<T>, n: number, seed?: number): Dataset<T>`

Random sample of rows.

```typescript
const sample = sampleRows(sales, 10); // 10 random rows
const reproducible = sampleRows(sales, 10, 42); // Seeded for reproducibility
```

---

### Dataset Transformations

#### `addColumn<T>(dataset: Dataset<T>, name: string, compute: (row: T) => unknown): Dataset`

Add a computed column.

```typescript
const withMargin = addColumn(sales, 'pricePerUnit', (row) =>
  row.revenue / row.units
);
```

---

#### `renameColumn<T>(dataset: Dataset<T>, oldName: string, newName: string): Dataset`

Rename a column.

```typescript
const renamed = renameColumn(sales, 'revenue', 'total_revenue');
```

---

#### `dropNulls<T>(dataset: Dataset<T>, column?: string): Dataset<T>`

Remove rows with null values.

```typescript
const clean = dropNulls(sales); // Drop rows with any null
const cleanRevenue = dropNulls(sales, 'revenue'); // Drop rows where revenue is null
```

---

#### `fillNulls<T>(dataset: Dataset<T>, column: string, fillValue: unknown): Dataset<T>`

Replace null values.

```typescript
const filled = fillNulls(sales, 'margin', 0);
```

---

#### `normalize<T>(dataset: Dataset<T>, column: string): Dataset<T>`

Normalize numeric column to [0, 1].

```typescript
const normalized = normalize(sales, 'revenue');
// revenue values now scaled between 0 and 1
```

---

## Statistics API

### Descriptive Statistics

#### `describe<T>(dataset: Dataset<T>): Map<string, DescriptiveStats>`

Compute descriptive statistics for all numeric columns.

```typescript
const stats = describe(sales);
stats.forEach((stat, column) => {
  console.log(`${column}: mean=${stat.mean}, stddev=${stat.stddev}`);
});
```

**Returns:** Map of column names to stats:
- `count`: Number of non-null values
- `mean`: Average
- `median`: Median value
- `stddev`: Standard deviation
- `variance`: Variance
- `min`: Minimum value
- `max`: Maximum value
- `q25`: 25th percentile
- `q75`: 75th percentile

---

#### `describeColumn<T>(dataset: Dataset<T>, column: string): DescriptiveStats`

Statistics for a single column.

```typescript
const revenueStats = describeColumn(sales, 'revenue');
console.log(`Mean revenue: ${revenueStats.mean}`);
```

---

### Individual Statistics

#### `mean(values: number[]): number`

Arithmetic mean.

```typescript
const avg = mean([1, 2, 3, 4, 5]); // 3
```

---

#### `median(values: number[]): number`

Median value.

```typescript
const med = median([1, 2, 3, 4, 100]); // 3
```

---

#### `variance(values: number[]): number`

Sample variance.

```typescript
const v = variance([1, 2, 3, 4, 5]);
```

---

#### `stddev(values: number[]): number`

Standard deviation.

```typescript
const sd = stddev([1, 2, 3, 4, 5]);
```

---

#### `quantile(values: number[], q: number): number`

Compute quantile (0 ≤ q ≤ 1).

```typescript
const q25 = quantile(values, 0.25); // 25th percentile
const q75 = quantile(values, 0.75); // 75th percentile
```

---

### Bivariate Statistics

#### `pearsonCorrelation(x: number[], y: number[]): number`

Pearson correlation coefficient (-1 to 1).

```typescript
const r = pearsonCorrelation(revenues, units);
console.log(`Correlation: ${r.toFixed(3)}`);
```

---

#### `correlationMatrix<T>(dataset: Dataset<T>): CorrelationEntry[]`

Pairwise correlations for all numeric columns.

```typescript
const corr = correlationMatrix(sales);
corr.forEach(({ col1, col2, correlation }) => {
  console.log(`${col1} vs ${col2}: ${correlation.toFixed(3)}`);
});
```

---

### Frequency Analysis

#### `valueCounts<T>(dataset: Dataset<T>, column: string): Map<unknown, number>`

Count occurrences of each value.

```typescript
const categoryCounts = valueCounts(sales, 'category');
categoryCounts.forEach((count, category) => {
  console.log(`${category}: ${count}`);
});
```

---

#### `missingValues<T>(dataset: Dataset<T>): Map<string, number>`

Count null values per column.

```typescript
const missing = missingValues(sales);
missing.forEach((count, column) => {
  if (count > 0) {
    console.log(`${column}: ${count} missing values`);
  }
});
```

---

## Pipeline API

### Pipeline Builder

#### `createPipeline<T>(name: string): PipelineBuilder<T>`

Create a new pipeline builder.

```typescript
const pipeline = createPipeline<Dataset>('etl-pipeline')
  .step('load', async () => loadData())
  .step('clean', async (data) => dropNulls(data))
  .step('transform', async (data) => normalize(data, 'score'))
  .step('aggregate', async (data) => groupBy(data, 'category'));

const { result, output } = await pipeline.run();
```

**Pipeline Steps:**
- Each step receives output from previous step
- Steps execute sequentially
- Errors stop pipeline and return status

---

#### `step(name: string, fn: StepFn<T, U>, options?: StepOptions): PipelineBuilder<U>`

Add a step to the pipeline.

```typescript
pipeline.step('validate', async (data) => {
  const validation = validateDataset(data, {
    revenue: [required(), isNumber(), inRange(0, 1000000)],
  });
  if (!validation.valid) {
    throw new Error('Validation failed');
  }
  return data;
});
```

**Options:**
- `retries`: Number of retry attempts on failure (default: 0)
- `timeout`: Step timeout in milliseconds

---

#### `run(input?: T): Promise<PipelineRunResult<U>>`

Execute the pipeline.

```typescript
const { result, output, error } = await pipeline.run(initialData);

if (result.status === 'completed') {
  console.log('Pipeline succeeded:', output);
} else {
  console.error('Pipeline failed at step:', result.failedStep);
  console.error('Error:', error);
}
```

**Returns:**
- `result`: Pipeline execution metadata (status, steps, duration)
- `output`: Final output from last step
- `error`: Error object if pipeline failed

---

### Transform Functions

#### `mapRows<T, U>(dataset: Dataset<T>, mapper: (row: T) => U): Dataset<U>`

Transform each row.

```typescript
const withTax = mapRows(sales, (row) => ({
  ...row,
  taxAmount: row.revenue * 0.08,
  totalWithTax: row.revenue * 1.08,
}));
```

---

#### `aggregate<T>(dataset: Dataset<T>, groupBy: string, aggregations: Record<string, AggFn>): Dataset`

Group and aggregate.

```typescript
const byCategory = aggregate(sales, 'category', {
  total_revenue: { column: 'revenue', fn: 'sum' },
  avg_units: { column: 'units', fn: 'avg' },
  count: { column: 'revenue', fn: 'count' },
});
```

**Aggregation Functions:**
- `'sum'`: Sum of values
- `'avg'`: Average
- `'min'`: Minimum
- `'max'`: Maximum
- `'count'`: Count of non-null values

---

#### `innerJoin<T, U>(left: Dataset<T>, right: Dataset<U>, leftKey: string, rightKey: string): Dataset`

Join two datasets.

```typescript
const joined = innerJoin(sales, customers, 'customerId', 'id');
```

---

#### `pivot<T>(dataset: Dataset<T>, index: string, columns: string, values: string, aggFn: 'sum' | 'avg' | 'count'): Dataset`

Pivot table transformation.

```typescript
const pivoted = pivot(sales, 'product', 'quarter', 'revenue', 'sum');
// Rows: products, Columns: quarters, Values: sum of revenue
```

---

#### `concat<T>(...datasets: Dataset<T>[]): Dataset<T>`

Concatenate datasets vertically.

```typescript
const combined = concat(q1Sales, q2Sales, q3Sales, q4Sales);
```

---

## Visualization API

### Chart Creation

#### `barChart(title: string, labels: string[], values: number[]): ChartSpec`

Create a bar chart specification.

```typescript
const chart = barChart(
  'Revenue by Product',
  ['Widget A', 'Widget B', 'Service X'],
  [12500, 8900, 45000]
);
```

---

#### `lineChart(title: string, labels: string[], series: DataSeries[]): ChartSpec`

Create a line chart.

```typescript
const chart = lineChart('Sales Trend', quarters, [
  { name: 'Product A', values: [100, 120, 150, 180] },
  { name: 'Product B', values: [80, 90, 85, 95] },
]);
```

---

#### `scatterPlot(title: string, points: Array<{ x: number; y: number }>): ChartSpec`

Create a scatter plot.

```typescript
const chart = scatterPlot('Revenue vs Units', salesData.rows.map((r) => ({
  x: r.units,
  y: r.revenue,
})));
```

---

#### `pieChart(title: string, labels: string[], values: number[]): ChartSpec`

Create a pie chart.

```typescript
const chart = pieChart('Market Share', ['Product A', 'Product B', 'Product C'], [45, 30, 25]);
```

---

#### `histogram(title: string, values: number[], bins: number = 10): ChartSpec`

Create a histogram.

```typescript
const chart = histogram('Revenue Distribution', revenueValues, 20);
```

---

### Chart Rendering

#### `renderBarChart(chart: ChartSpec, width: number = 40): string`

Render bar chart as ASCII text.

```typescript
console.log(renderBarChart(chart, 60));
// Output:
// Revenue by Product
// Widget A   ████████████ 12500
// Widget B   ████████     8900
// Service X  ████████████████████████████ 45000
```

---

#### `renderTable(data: Record<string, unknown>[], columns: string[]): string`

Render tabular data.

```typescript
console.log(renderTable(sales.rows, ['product', 'revenue', 'units']));
```

---

#### `renderDatasetTable(dataset: Dataset): string`

Render dataset as formatted table.

```typescript
console.log(renderDatasetTable(sales));
```

---

#### `renderStatsTable(stats: Map<string, DescriptiveStats>): string`

Render statistics as table.

```typescript
const stats = describe(sales);
console.log(renderStatsTable(stats));
// Output:
// Column   | Mean    | Median  | StdDev  | Min    | Max
// revenue  | 22100   | 13650   | 18920   | 5600   | 67000
// units    | 202     | 189     | 107     | 45     | 410
```

---

#### `sparkline(values: number[]): string`

Render inline sparkline.

```typescript
console.log('Trend:', sparkline([120, 150, 180, 200, 195, 210]));
// Output: Trend: ▁▃▅▇▆█
```

---

### Themes

#### `getTheme(name: 'light' | 'dark' | 'colorblind'): ChartTheme`

Get a built-in theme.

```typescript
import { getTheme, updateChartConfig } from '@dcyfr/ai-notebooks';

const chart = barChart('Sales', labels, values);
const darkChart = updateChartConfig(chart, { theme: getTheme('dark') });
```

---

#### `registerTheme(name: string, theme: ChartTheme): void`

Register a custom theme.

```typescript
registerTheme('corporate', {
  colors: ['#003f5c', '#7a5195', '#ef5675', '#ffa600'],
  background: '#ffffff',
  textColor: '#333333',
});
```

---

## Utilities API

### CSV Parsing

#### `parseCSV(csvString: string, options?: ParseOptions): Dataset`

Parse CSV string into dataset.

```typescript
import { parseCSV } from '@dcyfr/ai-notebooks';

const csv = `product,revenue,units
Widget A,12500,250
Widget B,8900,178`;

const data = parseCSV(csv, {
  delimiter: ',',
  skipEmptyLines: true,
});
```

**Options:**
- `delimiter`: Column separator (default: `,`)
- `skipEmptyLines`: Ignore blank lines (default: `true`)
- `headers`: Use first row as headers (default: `true`)

---

#### `toCSV(dataset: Dataset, options?: ToCSVOptions): string`

Convert dataset to CSV string.

```typescript
const csv = toCSV(sales, { includeHeaders: true });
fs.writeFileSync('sales.csv', csv);
```

---

### Formatting

#### `formatNumber(value: number, decimals: number = 2): string`

Format number with fixed decimals.

```typescript
formatNumber(1234.5678, 2); // "1234.57"
```

---

#### `formatWithCommas(value: number): string`

Add thousand separators.

```typescript
formatWithCommas(1234567); // "1,234,567"
```

---

#### `formatPercent(value: number, decimals: number = 1): string`

Format as percentage.

```typescript
formatPercent(0.1234, 2); // "12.34%"
```

---

#### `formatBytes(bytes: number): string`

Format byte count.

```typescript
formatBytes(1536); // "1.5 KB"
formatBytes(1048576); // "1.0 MB"
```

---

#### `formatDuration(ms: number): string`

Format duration.

```typescript
formatDuration(5400000); // "1.5 hours"
```

---

### Validation

#### `validateDataset(dataset: Dataset, rules: Record<string, ColumnValidator[]>): ValidationResult`

Validate dataset against schema rules.

```typescript
import { validateDataset, required, isNumber, inRange } from '@dcyfr/ai-notebooks';

const validation = validateDataset(sales, {
  revenue: [required(), isNumber(), inRange(0, 1000000)],
  units: [required(), isNumber(), inRange(1, 10000)],
  product: [required(), isString(), stringLength(1, 100)],
});

if (!validation.valid) {
  validation.errors.forEach((err) => {
    console.error(`${err.row}/${err.column}: ${err.message}`);
  });
}
```

**Built-in Validators:**
- `required()`: Value must not be null
- `isNumber()`: Must be numeric
- `isString()`: Must be string
- `inRange(min, max)`: Numeric range check
- `matchesPattern(regex)`: Regex validation
- `oneOf(values)`: Enum validation
- `stringLength(min, max)`: String length check

---

## Jupyter Integration

### Notebook Format Compatibility

`@dcyfr/ai-notebooks` uses **nbformat 4.5** compatible structure. All notebooks can be imported/exported to standard `.ipynb` files.

```typescript
import { importNotebook, exportNotebook } from '@dcyfr/ai-notebooks';
import fs from 'fs';

// Import from .ipynb
const ipynb = fs.readFileSync('analysis.ipynb', 'utf-8');
const nb = importNotebook(ipynb);

// Modify notebook
nb = addCell(nb, codeCell('print("Added from TypeScript")'));

// Export back to .ipynb
const updated = exportNotebook(nb);
fs.writeFileSync('analysis-updated.ipynb', updated);
```

**Supported Cell Types:**
- Code cells with outputs (stream, display_data, execute_result, error)
- Markdown cells
- Raw cells

**Metadata Preservation:**
- Cell-level metadata (tags, collapsed state, execution count)
- Notebook-level metadata (kernel info, language info)
- Output MIME types (text/plain, text/html, image/png, application/json, etc.)

---

### IPython Kernel Integration

#### Custom Executor for IPython

```typescript
import { createKernel } from 'jupyter-kernel'; // Hypothetical library
import type { CellExecutor } from '@dcyfr/ai-notebooks';

// Create IPython kernel connection
const kernel = await createKernel({
  name: 'python3',
  cwd: process.cwd(),
});

// Custom executor using IPython kernel
const ipythonExecutor: CellExecutor = async (source, context) => {
  const execution = kernel.execute({ code: source });
  
  const outputs: CellOutput[] = [];
  
  execution.on('stream', (stream) => {
    outputs.push(createOutput('stream', {
      name: stream.name,
      text: stream.text,
    }));
  });
  
  execution.on('display_data', (display) => {
    outputs.push(createOutput('display_data', {
      data: display.data,
      metadata: display.metadata,
    }));
  });
  
  execution.on('error', (error) => {
    outputs.push(createOutput('error', {
      ename: error.ename,
      evalue: error.evalue,
      traceback: error.traceback,
    }));
  });
  
  await execution.done();
  
  return {
    outputs,
    status: outputs.some((o) => o.outputType === 'error') ? 'error' : 'completed',
  };
};

// Execute notebook with IPython
const { result } = await executeNotebook(nb, {
  executor: ipythonExecutor,
});
```

---

### Kernel Management Patterns

#### Multi-Language Execution

```typescript
const kernels = {
  python: await createKernel({ name: 'python3' }),
  julia: await createKernel({ name: 'julia-1.9' }),
  javascript: defaultExecutor, // Built-in JS executor
};

// Execute based on kernel metadata
for (let i = 0; i < nb.cells.length; i++) {
  const cell = nb.cells[i];
  if (cell.cellType !== 'code') continue;
  
  const kernelName = cell.metadata.kernel || nb.metadata.kernelspec?.name || 'javascript';
  const executor = kernels[kernelName];
  
  const executed = await executeCell(cell, createExecutionContext());
  nb = updateCell(nb, i, () => executed);
}
```

---

### nbformat Metadata

```typescript
const nb = createNotebook({
  title: 'Python + TypeScript Analysis',
  kernelspec: {
    name: 'python3',
    display_name: 'Python 3',
    language: 'python',
  },
  language_info: {
    name: 'python',
    version: '3.11.5',
    mimetype: 'text/x-python',
    file_extension: '.py',
  },
});
```

**Accessing Kernel Info:**
```typescript
console.log(nb.metadata.kernelspec?.name); // 'python3'
console.log(nb.metadata.language_info?.version); // '3.11.5'
```

---

## TypeScript Signatures

### Core Types

```typescript
// Notebook
export interface Notebook {
  cells: Cell[];
  metadata: NotebookMetadata;
}

export interface NotebookMetadata {
  title?: string;
  author?: string;
  description?: string;
  tags?: string[];
  createdAt?: Date;
  modifiedAt?: Date;
  executionCount?: number;
  kernelspec?: KernelInfo;
  language_info?: {
    name: string;
    version?: string;
    mimetype?: string;
    file_extension?: string;
  };
}

// Cell
export interface Cell {
  id: string;
  cellType: CellType;
  source: string;
  outputs: CellOutput[];
  metadata: {
    tags?: string[];
    collapsed?: boolean;
    executionCount?: number | null;
    kernel?: string;
  };
  status?: CellStatus;
}

export type CellType = 'code' | 'markdown' | 'raw';
export type CellStatus = 'pending' | 'running' | 'completed' | 'error';

// Dataset
export interface Dataset<T = DataRow> {
  name: string;
  rows: T[];
  schema: ColumnSchema[];
  metadata: DatasetMetadata;
}

export type DataRow = Record<string, unknown>;

export interface ColumnSchema {
  name: string;
  type: ColumnType;
  nullable: boolean;
}

export type ColumnType = 'string' | 'number' | 'boolean' | 'date' | 'null' | 'unknown';

// Statistics
export interface DescriptiveStats {
  count: number;
  mean: number;
  median: number;
  stddev: number;
  variance: number;
  min: number;
  max: number;
  q25: number;
  q75: number;
}

// Pipeline
export type StepFn<T, U> = (input: T, context: PipelineContext) => Promise<U>;

export interface PipelineResult {
  name: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  steps: PipelineStep[];
  startTime?: number;
  endTime?: number;
  duration?: number;
  failedStep?: string;
}

// Visualization
export type ChartType = 'bar' | 'line' | 'scatter' | 'pie' | 'histogram';

export interface ChartSpec {
  type: ChartType;
  title: string;
  data: DataSeries[];
  config: ChartConfig;
}

export interface DataSeries {
  name: string;
  values: number[];
  labels?: string[];
}
```

---

## Advanced Usage

### Streaming Execution

Execute cells with real-time output streaming:

```typescript
import { executeCell, createExecutionContext } from '@dcyfr/ai-notebooks';

const context = createExecutionContext();

for (const [index, cell] of nb.cells.entries()) {
  if (cell.cellType !== 'code') continue;
  
  console.log(`Executing cell ${index + 1}...`);
  
  const executed = await executeCell(cell, context);
  
  // Stream outputs as they arrive
  executed.outputs.forEach((output) => {
    if (output.outputType === 'stream') {
      process.stdout.write(output.data.text);
    } else if (output.outputType === 'execute_result') {
      console.log('Result:', output.data);
    } else if (output.outputType === 'error') {
      console.error('Error:', output.data.evalue);
    }
  });
  
  nb = updateCell(nb, index, () => executed);
}
```

---

### Complex Pipeline with Error Handling

```typescript
const pipeline = createPipeline<Dataset>('robust-etl')
  .step('load', async () => {
    const csv = fs.readFileSync('data.csv', 'utf-8');
    return parseCSV(csv);
  })
  .step('validate', async (data) => {
    const validation = validateDataset(data, {
      revenue: [required(), isNumber(), inRange(0, 1000000)],
    });
    if (!validation.valid) {
      throw new Error(`Validation failed: ${validation.errors.length} errors`);
    }
    return data;
  })
  .step('clean', async (data) => {
    return dropNulls(data);
  })
  .step('enrich', async (data) => {
    return addColumn(data, 'revenuePerUnit', (row) =>
      row.revenue / row.units
    );
  })
  .step('aggregate', async (data) => {
    return aggregate(data, 'category', {
      total: { column: 'revenue', fn: 'sum' },
      avg: { column: 'revenue', fn: 'avg' },
    });
  });

const { result, output, error } = await pipeline.run();

if (result.status === 'failed') {
  console.error(`Pipeline failed at ${result.failedStep}:`, error);
  console.log('Successful steps:', result.steps.filter((s) => s.status === 'completed'));
} else {
  console.log('Pipeline completed successfully');
  console.log(renderDatasetTable(output));
}
```

---

### Custom Visualization Theme

```typescript
import { registerTheme, barChart, updateChartConfig, renderBarChart } from '@dcyfr/ai-notebooks';

registerTheme('corporate', {
  colors: ['#003f5c', '#7a5195', '#ef5675', '#ffa600'],
  background: '#ffffff',
  textColor: '#333333',
  gridColor: '#e0e0e0',
  fontFamily: 'Arial, sans-serif',
});

let chart = barChart('Sales', ['Q1', 'Q2', 'Q3', 'Q4'], [100, 120, 150, 180]);
chart = updateChartConfig(chart, {
  theme: getTheme('corporate'),
  showGrid: true,
  showLegend: true,
});

console.log(renderBarChart(chart, 60));
```

---

### Notebook Comparison

```typescript
function compareNotebooks(nb1: Notebook, nb2: Notebook): void {
  console.log(`Notebook 1: ${cellCount(nb1)} cells`);
  console.log(`Notebook 2: ${cellCount(nb2)} cells`);
  
  const code1 = codeCellCount(nb1);
  const code2 = codeCellCount(nb2);
  console.log(`Code cells: ${code1} vs ${code2}`);
  
  const exec1 = getExecutionSummary(nb1);
  const exec2 = getExecutionSummary(nb2);
  console.log(`Completed: ${exec1.completed} vs ${exec2.completed}`);
  console.log(`Errors: ${exec1.errors} vs ${exec2.errors}`);
}
```

---

## SemVer Commitment

`@dcyfr/ai-notebooks` follows [Semantic Versioning 2.0.0](https://semver.org/).

**Version 1.0.0 Stability Guarantees:**

1. **Public API Stability:**
   - All exported functions, types, and interfaces are stable
   - No breaking changes in minor or patch releases
   - Deprecations announced at least one major version in advance

2. **Backward Compatibility:**
   - Notebooks created in v1.x are compatible with all v1.y versions (y > x)
   - `importNotebook()` maintains compatibility with nbformat 4.0-4.5

3. **Data Format Stability:**
   - Dataset schema structure remains consistent
   - Pipeline serialization format locked for v1.x

4. **Deprecation Policy:**
   - Deprecated features marked with TypeScript `@deprecated` JSDoc tags
   - Deprecated features maintained for at least one major version
   - Runtime warnings for deprecated usage (development only)

5. **Breaking Changes (Major Versions Only):**
   - API signature changes
   - Type definition modifications
   - Removal of deprecated features

**Version Ranges:**
```json
{
  "dependencies": {
    "@dcyfr/ai-notebooks": "^1.0.0"  // Recommended: Auto-update minor/patch
  }
}
```

**Support Policy:**
- **Current major version (v1.x):** Full support (bug fixes, security patches, feature additions)
- **Previous major version:** Security patches for 12 months after new major release
- **Older versions:** Community support only

---

**Last Updated:** February 8, 2026  
**Documentation Version:** 1.0.0  
**Repository:** https://github.com/dcyfr/dcyfr-ai-notebooks  
**Issues:** https://github.com/dcyfr/dcyfr-ai-notebooks/issues  
**License:** MIT
