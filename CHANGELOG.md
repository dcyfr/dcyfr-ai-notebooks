# @dcyfr/ai-notebooks

## 1.0.1

### Patch Changes

- 389fb9a: Test automated publishing workflow with Trusted Publishing

## 1.0.0

### Major Changes

- a8e574a: **Production Release v1.0.0 — Data Science Notebook Toolkit**

  Promote @dcyfr/ai-notebooks to production-ready v1.0.0 with comprehensive notebook execution, data pipelines, and visualization support.

  **Features:**

  - ✅ **Notebook Engine** — Create, manage, execute computational notebooks with cells and outputs
  - ✅ **Data Pipeline** — Multi-step ETL pipelines with transforms, aggregation, joins, validation
  - ✅ **Statistics** — Descriptive stats, correlation analysis, quantiles, frequency counts
  - ✅ **Visualization** — Chart builders and text-based renderers (bar charts, tables, sparklines)
  - ✅ **Data Utilities** — CSV parsing, dataset operations, composable validation rules
  - ✅ **Type-Safe** — Full TypeScript support with Zod schema validation

  **Quality Metrics:**

  - 96.95% line coverage, 85.98% branch coverage
  - 199/199 tests passing (31 test suites)
  - ESLint clean (0 violations)
  - Strict TypeScript compilation

  **Migration Path:**
  Install via npm:

  ```bash
  npm install @dcyfr/ai-notebooks
  ```

  Create and execute notebooks:

  ```typescript
  import {
    createNotebook,
    addCell,
    codeCell,
    executeNotebook,
  } from "@dcyfr/ai-notebooks";

  const notebook = createNotebook({ title: "My Analysis" });
  addCell(notebook, codeCell({ code: "const data = [1, 2, 3];" }));
  const result = await executeNotebook(notebook);
  ```

  **Documentation:**

  - [API Reference](docs/API.md) — 4,440 words, comprehensive examples
  - [Security Guide](docs/SECURITY.md) — 28,867 bytes, best practices

## 0.1.1

### Patch Changes

- 02d1fec: Migrate to changesets for automated publishing with Trusted Publishers
