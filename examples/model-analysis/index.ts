/**
 * Example: Model Analysis
 *
 * Demonstrates analysis workflows for model evaluation:
 * computing metrics, correlation analysis, and visual reports.
 */

import {
  createDataset,
  describe,
  correlationMatrix,
  createNotebook,
  codeCell,
  markdownCell,
  addCell,
  executeNotebook,
  getExecutionSummary,
  renderStatsTable,
  renderBarChart,
  barChart,
  renderSummary,
  sparkline,
  mean,
  stddev,
  exportNotebook,
} from '../../src/index.js';

// ---- 1. Create model predictions dataset ----

const predictions = createDataset(
  [
    { model: 'baseline', epoch: 1, accuracy: 0.72, loss: 0.58, f1: 0.70, latency_ms: 12 },
    { model: 'baseline', epoch: 5, accuracy: 0.81, loss: 0.42, f1: 0.79, latency_ms: 12 },
    { model: 'baseline', epoch: 10, accuracy: 0.84, loss: 0.35, f1: 0.82, latency_ms: 13 },
    { model: 'fine-tuned', epoch: 1, accuracy: 0.78, loss: 0.48, f1: 0.76, latency_ms: 18 },
    { model: 'fine-tuned', epoch: 5, accuracy: 0.88, loss: 0.28, f1: 0.87, latency_ms: 19 },
    { model: 'fine-tuned', epoch: 10, accuracy: 0.92, loss: 0.18, f1: 0.91, latency_ms: 20 },
    { model: 'distilled', epoch: 1, accuracy: 0.75, loss: 0.52, f1: 0.73, latency_ms: 8 },
    { model: 'distilled', epoch: 5, accuracy: 0.85, loss: 0.32, f1: 0.83, latency_ms: 8 },
    { model: 'distilled', epoch: 10, accuracy: 0.89, loss: 0.22, f1: 0.88, latency_ms: 9 },
  ],
  'model_predictions'
);

// ---- 2. Descriptive statistics ----

console.log('=== Model Metrics Summary ===\n');
const stats = describe(predictions);
console.log(renderStatsTable(stats));

// ---- 3. Final epoch comparison ----

console.log('\n=== Final Epoch Comparison ===\n');
const finalEpoch = predictions.rows.filter((r) => r.epoch === 10);
const models = finalEpoch.map((r) => String(r.model));
const accuracies = finalEpoch.map((r) => r.accuracy as number);
const chart = barChart('Accuracy at Epoch 10', models, accuracies);
console.log(renderBarChart(chart, 40));

// ---- 4. Training progress sparklines ----

console.log('\n=== Training Progress ===');
for (const model of ['baseline', 'fine-tuned', 'distilled']) {
  const modelRows = predictions.rows.filter((r) => r.model === model);
  const accs = modelRows.map((r) => r.accuracy as number);
  const losses = modelRows.map((r) => r.loss as number);
  console.log(`  ${model.padEnd(12)} Accuracy: ${sparkline(accs)}  Loss: ${sparkline(losses)}`);
}

// ---- 5. Correlation analysis ----

console.log('\n=== Feature Correlations ===');
const corr = correlationMatrix(predictions);
const significant = corr.filter(
  (e) => Math.abs(e.coefficient) > 0.5 && e.columnA !== e.columnB
);
for (const e of significant) {
  const dir = e.coefficient > 0 ? '↑↑' : '↑↓';
  console.log(`  ${e.columnA} ${dir} ${e.columnB}: ${e.coefficient.toFixed(3)}`);
}

// ---- 6. Model summary report ----

console.log('\n=== Model Evaluation Report ===\n');
for (const model of ['baseline', 'fine-tuned', 'distilled']) {
  const rows = predictions.rows.filter((r) => r.model === model);
  const accs = rows.map((r) => r.accuracy as number);
  const latencies = rows.map((r) => r.latency_ms as number);

  console.log(renderSummary(`Model: ${model}`, {
    'Best Accuracy': Math.max(...accs).toFixed(3),
    'Mean Accuracy': mean(accs).toFixed(3),
    'Accuracy StdDev': stddev(accs).toFixed(3),
    'Avg Latency': `${mean(latencies).toFixed(1)}ms`,
    'Epochs': rows.length,
  }));
  console.log('');
}

// ---- 7. Notebook generation ----

console.log('=== Generating Analysis Notebook ===\n');

let nb = createNotebook({ title: 'Model Analysis Report', author: 'dcyfr' });
nb = addCell(nb, markdownCell('# Model Analysis Report\n\nAutomated analysis of model performance across training epochs.'));
nb = addCell(nb, codeCell('// Load and inspect dataset\nconsole.log("Loaded", predictions.metadata.rows, "records");'));
nb = addCell(nb, codeCell('// Compute statistics\nconst stats = describe(predictions);\nconsole.log(renderStatsTable(stats));'));
nb = addCell(nb, markdownCell('## Conclusions\n\n- Fine-tuned model achieves highest accuracy (0.92)\n- Distilled model offers best latency/accuracy trade-off\n- Strong negative correlation between accuracy and loss'));

const result = await executeNotebook(nb);
const summary = getExecutionSummary(result);
console.log(`Notebook cells: ${summary.total}`);
console.log(`Completed: ${summary.completed}`);
console.log(`Errors: ${summary.errors}`);

const exported = exportNotebook(result);
console.log(`Exported notebook: ${exported.length} bytes`);
