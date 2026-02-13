# @dcyfr/ai-notebooks

Data science notebook toolkit for TypeScript — create, execute, and analyze computational notebooks with built-in data pipeline and visualization support.

## Features

- **Notebook Engine** — Create, manage, and execute computational notebooks with cells, outputs, and metadata
- **Data Pipeline** — Build multi-step ETL pipelines with transforms, aggregation, joins, and validation
- **Statistics** — Descriptive statistics, correlation analysis, quantiles, and frequency counts
- **Visualization** — Chart specification builders and text-based renderers (bar charts, tables, sparklines)
- **Data Utilities** — CSV parsing, dataset operations, data validation with composable rules
- **Type-Safe** — Full TypeScript support with Zod schema validation

## Quick Start

```bash
# Clone or use as part of the DCYFR workspace
git clone https://github.com/dcyfr/dcyfr-ai-notebooks
npm install
```

### Create and Execute a Notebook

```typescript
import {
  createNotebook,
  addCell,
  codeCell,
  markdownCell,
  executeNotebook,
  getExecutionSummary,
} from '@dcyfr/ai-notebooks';

// Create a notebook
let nb = createNotebook({ title: 'My Analysis' });
nb = addCell(nb, markdownCell('# Hello World'));
nb = addCell(nb, codeCell('const x = 42;\nconsole.log(x);'));

// Execute
const { result } = await executeNotebook(nb);
const summary = getExecutionSummary(result);
console.log(`Completed: ${summary.completed}/${summary.total}`);
```

### Data Analysis

```typescript
import {
  createDataset,
  describe,
  sortBy,
  head,
  renderDatasetTable,
  renderStatsTable,
} from '@dcyfr/ai-notebooks';

const data = createDataset([
  { name: 'Alice', score: 92.5 },
  { name: 'Bob', score: 88.0 },
  { name: 'Charlie', score: 95.3 },
], 'students');

// Descriptive statistics
console.log(renderStatsTable(describe(data)));

// Top performers
console.log(renderDatasetTable(head(sortBy(data, 'score', false))));
```

### Data Pipelines

```typescript
import { createPipeline, filterRows, normalize, aggregate } from '@dcyfr/ai-notebooks';
import type { Dataset } from '@dcyfr/ai-notebooks';

const pipeline = createPipeline<Dataset>('my-pipeline')
  .step('filter', async (data) => filterRows(data, (r) => r.active === true))
  .step('normalize', async (data) => normalize(data, 'score'))
  .step('aggregate', async (data) =>
    aggregate(data, 'category', {
      avg_score: { column: 'score', fn: 'avg' },
      count: { column: 'score', fn: 'count' },
    })
  );

const { result, output } = await pipeline.run(dataset);
console.log(`Status: ${result.status}, Steps: ${result.steps.length}`);
```

### Visualization

```typescript
import { barChart, renderBarChart, sparkline } from '@dcyfr/ai-notebooks';

const chart = barChart('Sales', ['Q1', 'Q2', 'Q3', 'Q4'], [120, 150, 180, 200]);
console.log(renderBarChart(chart));

console.log('Trend:', sparkline([120, 150, 180, 200]));
```

## Module Structure

| Module | Import Path | Description |
|--------|------------|-------------|
| Notebook | `@dcyfr/ai-notebooks/notebook` | Cell/notebook CRUD, execution engine |
| Pipeline | `@dcyfr/ai-notebooks/pipeline` | Dataset ops, transforms, statistics, ETL |
| Visualization | `@dcyfr/ai-notebooks/visualization` | Charts, tables, themes, formatters |
| Utils | `@dcyfr/ai-notebooks/utils` | CSV, formatting, validation |

## Examples

```bash
# Data exploration
npx tsx examples/data-exploration/index.ts

# Data pipeline
npx tsx examples/data-pipeline/index.ts

# Model analysis
npx tsx examples/model-analysis/index.ts
```

## Development

```bash
npm install
npm run test          # Run tests
npm run test:watch    # Watch mode
npm run test:coverage # Coverage report
npm run build         # Build
npm run typecheck     # Type check
```

## License

MIT — See [LICENSE](LICENSE) for details.
