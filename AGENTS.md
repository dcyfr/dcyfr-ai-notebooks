# AGENTS.md — @dcyfr/ai-notebooks

## Project Overview

TypeScript data science notebook toolkit providing notebook engine, data pipelines, statistics, and visualization.

## Architecture

```
src/
├── types/           # Zod schemas and TypeScript types
├── notebook/        # Cell management, notebook CRUD, execution engine
├── pipeline/        # Dataset operations, transforms, statistics, ETL runner
├── visualization/   # Chart builders, text renderers, themes
└── utils/           # CSV parsing, formatting, data validation
```

## Key Patterns

- **Immutable data transforms** — All dataset operations return new instances
- **Zod schemas** — Type definitions derived from Zod schemas in `types/index.ts`
- **Fluent pipeline API** — `createPipeline().step().step().run()`
- **Text-based rendering** — Charts and tables render to strings (no DOM dependency)

## Testing

```bash
npm run test          # All tests
npm run test:watch    # Watch mode
npm run test:coverage # Coverage (80% threshold)
```

## Conventions

- Pure functions where possible
- No side effects in data transforms
- All public APIs exported through barrel files
- Descriptive function names matching domain terminology
