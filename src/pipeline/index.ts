/**
 * Pipeline module barrel exports
 */

export {
  inferColumnType,
  inferSchema,
  createDataset,
  selectColumns,
  filterRows,
  sortBy,
  uniqueValues,
  groupBy,
  getColumn,
  getNumericColumn,
  sampleRows,
  head,
  tail,
  addColumn,
  renameColumn,
  dropNulls,
} from './dataset.js';

export {
  mapRows,
  aggregate,
  innerJoin,
  pivot,
  normalize,
  fillNulls,
  concat,
} from './transform.js';

export {
  sum,
  mean,
  median,
  variance,
  stddev,
  quantile,
  pearsonCorrelation,
  describeColumn,
  describe,
  correlationMatrix,
  valueCounts,
  missingValues,
} from './statistics.js';

export {
  createPipeline,
  PipelineBuilder,
  executePipeline,
} from './runner.js';

export type {
  StepFn,
  PipelineContext,
  PipelineDefinition,
  PipelineRunResult,
} from './runner.js';
