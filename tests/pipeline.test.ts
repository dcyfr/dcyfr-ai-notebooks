/**
 * Tests for pipeline/runner.ts (pipeline orchestration)
 */

import { describe, it, expect } from 'vitest';
import { createPipeline, executePipeline } from '../src/pipeline/index.js';
import type { PipelineDefinition } from '../src/pipeline/index.js';

describe('Pipeline Builder', () => {
  it('creates a pipeline with steps', () => {
    const pipeline = createPipeline<number>('test')
      .step('double', async (n) => n * 2)
      .step('add-ten', async (n) => n + 10)
      .build();

    expect(pipeline.config.name).toBe('test');
    expect(pipeline.config.steps).toEqual(['double', 'add-ten']);
    expect(pipeline.steps.size).toBe(2);
  });

  it('applies default config values', () => {
    const pipeline = createPipeline('defaults').build();
    expect(pipeline.config.retryOnFailure).toBe(false);
    expect(pipeline.config.maxRetries).toBe(3);
    expect(pipeline.config.continueOnError).toBe(false);
    expect(pipeline.config.verbose).toBe(false);
  });

  it('accepts custom config', () => {
    const pipeline = createPipeline('custom', {
      retryOnFailure: true,
      maxRetries: 5,
      continueOnError: true,
    }).build();
    expect(pipeline.config.retryOnFailure).toBe(true);
    expect(pipeline.config.maxRetries).toBe(5);
  });
});

describe('Pipeline Execution', () => {
  it('executes steps sequentially', async () => {
    const { result, output } = await createPipeline<number>('math')
      .step('double', async (n) => n * 2)
      .step('add-five', async (n) => n + 5)
      .run(10);

    expect(output).toBe(25); // (10 * 2) + 5
    expect(result.status).toBe('completed');
    expect(result.steps).toHaveLength(2);
    expect(result.steps.every((s) => s.status === 'completed')).toBe(true);
  });

  it('records timing', async () => {
    const { result } = await createPipeline<string>('timed')
      .step('identity', async (s) => s)
      .run('hello');

    expect(result.startedAt).toBeGreaterThan(0);
    expect(result.completedAt).toBeGreaterThanOrEqual(result.startedAt);
    expect(result.durationMs).toBeGreaterThanOrEqual(0);
  });

  it('handles step failure', async () => {
    const { result } = await createPipeline<number>('failing')
      .step('ok', async (n) => n + 1)
      .step('fail', async () => { throw new Error('boom'); })
      .step('unreachable', async (n) => n)
      .run(0);

    expect(result.status).toBe('failed');
    expect(result.error).toBe('boom');
    expect(result.steps[1].status).toBe('failed');
    expect(result.steps[2].status).toBe('skipped');
  });

  it('continues on error when configured', async () => {
    const { result, output } = await createPipeline<number>('resilient', {
      continueOnError: true,
    })
      .step('ok', async (n) => n + 1)
      .step('fail', async () => { throw new Error('oops'); })
      .step('after', async (n) => n + 10)
      .run(0);

    expect(result.status).toBe('partial');
    expect(result.steps[0].status).toBe('completed');
    expect(result.steps[1].status).toBe('failed');
    expect(result.steps[2].status).toBe('completed');
  });

  it('retries on failure', async () => {
    let attempts = 0;
    const { result } = await createPipeline<number>('retry', {
      retryOnFailure: true,
      maxRetries: 2,
    })
      .step('flaky', async (n) => {
        attempts++;
        if (attempts < 3) throw new Error('not yet');
        return n + 1;
      })
      .run(0);

    expect(result.status).toBe('completed');
    expect(attempts).toBe(3); // 1 initial + 2 retries
  });

  it('provides context to step functions', async () => {
    const logs: string[] = [];

    await createPipeline<number>('contextual', { verbose: true })
      .step('step-a', async (n, ctx) => {
        ctx.log(`Processing ${n}`);
        expect(ctx.pipelineName).toBe('contextual');
        expect(ctx.stepIndex).toBe(0);
        expect(ctx.totalSteps).toBe(2);
        return n;
      })
      .step('step-b', async (n, ctx) => {
        expect(ctx.stepIndex).toBe(1);
        return n;
      })
      .run(42);
  });

  it('handles missing step function', async () => {
    const definition: PipelineDefinition<number> = {
      config: {
        name: 'broken',
        steps: ['exists', 'missing'],
        retryOnFailure: false,
        maxRetries: 3,
        continueOnError: false,
        verbose: false,
      },
      steps: new Map([['exists', async (n) => n]]),
    };

    const { result } = await executePipeline(definition, 0);
    expect(result.status).toBe('failed');
    expect(result.steps[1].error).toContain('not found');
  });

  it('fires onStepComplete callback', async () => {
    const completed: string[] = [];

    await executePipeline(
      createPipeline<number>('callback')
        .step('a', async (n) => n + 1)
        .step('b', async (n) => n + 2)
        .build(),
      0,
      { onStepComplete: (step) => completed.push(step.name) }
    );

    expect(completed).toEqual(['a', 'b']);
  });
});
