/**
 * Example: Data Pipeline
 *
 * Demonstrates building and executing multi-step data pipelines
 * with transforms, aggregations, and validation.
 */

import {
  createDataset,
  createPipeline,
  filterRows,
  addColumn,
  normalize,
  aggregate,
  sortBy,
  renderDatasetTable,
  validateDataset,
  required,
  isNumber,
  inRange,
  formatDuration,
  progressBar,
} from '../../src/index.js';

import type { Dataset } from '../../src/index.js';

// ---- 1. Build a raw dataset ----

const rawData = createDataset(
  [
    { id: 1, name: 'Alice', department: 'Engineering', salary: 120000, performance: 4.5, tenure: 3 },
    { id: 2, name: 'Bob', department: 'Engineering', salary: 95000, performance: 3.8, tenure: 1 },
    { id: 3, name: 'Charlie', department: 'Marketing', salary: 85000, performance: 4.2, tenure: 5 },
    { id: 4, name: 'Diana', department: 'Marketing', salary: 72000, performance: 3.0, tenure: 2 },
    { id: 5, name: 'Eve', department: 'Engineering', salary: 135000, performance: 4.8, tenure: 7 },
    { id: 6, name: 'Frank', department: 'Sales', salary: 68000, performance: 3.5, tenure: 1 },
    { id: 7, name: 'Grace', department: 'Sales', salary: 78000, performance: 4.1, tenure: 4 },
    { id: 8, name: 'Hank', department: 'Engineering', salary: 110000, performance: 4.0, tenure: 2 },
  ],
  'employees'
);

console.log('=== Raw Employee Data ===\n');
console.log(renderDatasetTable(rawData));

// ---- 2. Validate data quality ----

console.log('\n=== Data Validation ===\n');

const validation = validateDataset(rawData, {
  name: [required()],
  salary: [required(), isNumber(), inRange(0, 500000)],
  performance: [required(), isNumber(), inRange(1, 5)],
});

console.log(`Valid: ${validation.valid}`);
console.log(`Errors: ${validation.errors.length}`);
console.log(`Warnings: ${validation.warnings.length}`);

// ---- 3. Build and run a pipeline ----

console.log('\n=== Running Pipeline ===\n');

const pipeline = createPipeline<Dataset>('employee-analysis', {
  verbose: true,
  continueOnError: false,
})
  .step('filter-high-performers', async (data, ctx) => {
    ctx.log('Filtering employees with performance >= 3.5');
    return filterRows(data, (row) => (row.performance as number) >= 3.5);
  })
  .step('add-salary-band', async (data, ctx) => {
    ctx.log('Computing salary bands');
    return addColumn(data, 'salary_band', (row) => {
      const salary = row.salary as number;
      if (salary >= 120000) return 'Senior';
      if (salary >= 90000) return 'Mid';
      return 'Junior';
    });
  })
  .step('normalize-salary', async (data, ctx) => {
    ctx.log('Normalizing salary column');
    return normalize(data, 'salary');
  })
  .step('aggregate-by-dept', async (data, ctx) => {
    ctx.log('Aggregating by department');
    return aggregate(data, 'department', {
      avg_salary: { column: 'salary', fn: 'avg' },
      headcount: { column: 'salary', fn: 'count' },
      max_performance: { column: 'performance', fn: 'max' },
    });
  })
  .step('sort-results', async (data, ctx) => {
    ctx.log('Sorting by headcount');
    return sortBy(data, 'headcount', false);
  });

const { result, output } = await pipeline.run(rawData);

console.log(`Pipeline: ${result.pipelineName}`);
console.log(`Status: ${result.status}`);
console.log(`Duration: ${formatDuration(result.durationMs)}`);
console.log(`Steps completed: ${result.steps.filter((s) => s.status === 'completed').length}/${result.steps.length}`);

for (let i = 0; i < result.steps.length; i++) {
  const step = result.steps[i];
  console.log(progressBar(i + 1, result.steps.length, 20) + ` ${step.name} [${step.status}]`);
}

console.log('\n=== Pipeline Output ===\n');
console.log(renderDatasetTable(output));
