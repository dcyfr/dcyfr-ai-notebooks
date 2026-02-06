<!-- TLP:CLEAR -->
# Development Guide

## Project Structure

```
dcyfr-ai-notebooks/
├── src/
│   ├── types/          # Zod schemas & TypeScript types
│   ├── notebook/       # Notebook engine (cells, execution)
│   ├── pipeline/       # Data operations & ETL
│   ├── visualization/  # Charts & text rendering
│   ├── utils/          # CSV, formatting, validation
│   └── index.ts        # Root barrel exports
├── tests/              # Vitest test suites
├── examples/           # Usage examples
└── docs/               # Documentation
```

## Running Tests

```bash
npm test                    # Run all tests
npm run test:watch          # Watch mode
npm run test:coverage       # With coverage report
npx vitest run tests/notebook.test.ts  # Single file
```

## Type Checking

```bash
npm run typecheck           # tsc --noEmit
```

## Building

```bash
npm run build               # tsc to dist/
```

## Adding New Features

1. Define types/schemas in `src/types/index.ts`
2. Implement in the appropriate module
3. Export from the module's `index.ts`
4. Export from `src/index.ts`
5. Write tests
6. Update documentation

## Module Guidelines

### Notebook Module (`src/notebook/`)
- Cells are immutable; operations return new cell objects
- Execution is async and supports custom executors
- Default executor handles simple line-by-line evaluation

### Pipeline Module (`src/pipeline/`)
- All dataset operations return new Dataset instances
- Statistics functions work on number arrays
- Pipeline runner supports retry and continue-on-error

### Visualization Module (`src/visualization/`)
- Chart specs are data-only (no rendering logic inside)
- Formatters render to plain strings
- Themes define color palettes and styling constants

### Utils Module (`src/utils/`)
- CSV parser handles quoted fields and auto-type detection
- Validators are composable functions
- Format utilities are pure functions
