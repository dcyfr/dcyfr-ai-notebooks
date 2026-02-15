/**
 * Pipeline Runner - ETL/data pipeline orchestration
 */

import type { PipelineConfig, PipelineResult, PipelineStep } from '../types/index.js';

/** Step function */
export type StepFn<T = unknown> = (input: T, context: PipelineContext) => Promise<T>;

/** Pipeline context */
export interface PipelineContext {
  pipelineName: string;
  stepIndex: number;
  totalSteps: number;
  metadata: Record<string, unknown>;
  log: (message: string) => void;
}

/** Pipeline definition */
export interface PipelineDefinition<T = unknown> {
  config: PipelineConfig;
  steps: Map<string, StepFn<T>>;
}

/**
 * Create a pipeline builder
 */
export function createPipeline<T = unknown>(
  name: string,
  options?: Partial<Omit<PipelineConfig, 'name' | 'steps'>>
): PipelineBuilder<T> {
  return new PipelineBuilder<T>(name, options);
}

/**
 * Pipeline builder for fluent API
 */
export class PipelineBuilder<T = unknown> {
  private name: string;
  private options: Partial<Omit<PipelineConfig, 'name' | 'steps'>>;
  private stepNames: string[] = [];
  private stepFns: Map<string, StepFn<T>> = new Map();

  constructor(name: string, options?: Partial<Omit<PipelineConfig, 'name' | 'steps'>>) {
    this.name = name;
    this.options = options ?? {};
  }

  /**
   * Add a step to the pipeline
   */
  step(name: string, fn: StepFn<T>): this {
    this.stepNames.push(name);
    this.stepFns.set(name, fn);
    return this;
  }

  /**
   * Build the pipeline definition
   */
  build(): PipelineDefinition<T> {
    return {
      config: {
        name: this.name,
        description: this.options.description,
        steps: [...this.stepNames],
        retryOnFailure: this.options.retryOnFailure ?? false,
        maxRetries: this.options.maxRetries ?? 3,
        continueOnError: this.options.continueOnError ?? false,
        verbose: this.options.verbose ?? false,
      },
      steps: new Map(this.stepFns),
    };
  }

  /**
   * Build and execute the pipeline
   */
  async run(input: T): Promise<PipelineRunResult<T>> {
    return executePipeline(this.build(), input);
  }
}

/** Result of pipeline execution including the final output */
export interface PipelineRunResult<T = unknown> {
  result: PipelineResult;
  output: T;
}

/**
 * Execute a pipeline definition
 */
export async function executePipeline<T>(
  pipeline: PipelineDefinition<T>,
  input: T,
  options?: { onStepComplete?: (step: PipelineStep) => void; logs?: string[] }
): Promise<PipelineRunResult<T>> {
  const { config, steps: stepFns } = pipeline;
  const startedAt = Date.now();
  const logs: string[] = options?.logs ?? [];
  const stepResults: PipelineStep[] = [];

  let currentInput = input;
  let pipelineStatus: 'completed' | 'failed' | 'partial' = 'completed';
  let pipelineError: string | undefined;

  for (let i = 0; i < config.steps.length; i++) {
    const stepName = config.steps[i];
    const stepFn = stepFns.get(stepName);

    if (!stepFn) {
      const step: PipelineStep = {
        id: `step-${i}`,
        name: stepName,
        status: 'failed',
        error: `Step function not found: ${stepName}`,
        startedAt: Date.now(),
        completedAt: Date.now(),
      };
      stepResults.push(step);
      pipelineStatus = 'failed';
      pipelineError = step.error;
      if (!config.continueOnError) break;
      continue;
    }

    const step: PipelineStep = {
      id: `step-${i}`,
      name: stepName,
      status: 'running',
      startedAt: Date.now(),
    };

    const context: PipelineContext = {
      pipelineName: config.name,
      stepIndex: i,
      totalSteps: config.steps.length,
      metadata: {},
      log: (msg: string) => logs.push(`[${stepName}] ${msg}`),
    };

    let attempts = 0;
    const maxAttempts = config.retryOnFailure ? config.maxRetries + 1 : 1;
    let success = false;

    while (attempts < maxAttempts && !success) {
      attempts++;
      try {
        currentInput = await stepFn(currentInput, context);
        step.status = 'completed';
        step.completedAt = Date.now();
        success = true;
        options?.onStepComplete?.(step);
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        if (attempts >= maxAttempts) {
          step.status = 'failed';
          step.error = message;
          step.completedAt = Date.now();
          pipelineStatus = config.continueOnError ? 'partial' : 'failed';
          pipelineError = message;
        }
      }
    }

    stepResults.push(step);

    if (step.status === 'failed' && !config.continueOnError) {
      // Mark remaining steps as skipped
      for (let j = i + 1; j < config.steps.length; j++) {
        stepResults.push({
          id: `step-${j}`,
          name: config.steps[j],
          status: 'skipped',
        });
      }
      break;
    }
  }

  const completedAt = Date.now();

  return {
    result: {
      pipelineName: config.name,
      status: pipelineStatus,
      steps: stepResults,
      startedAt,
      completedAt,
      durationMs: completedAt - startedAt,
      error: pipelineError,
    },
    output: currentInput,
  };
}
