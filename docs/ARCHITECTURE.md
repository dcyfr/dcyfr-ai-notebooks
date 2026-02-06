# Architecture

## Overview

`@dcyfr/ai-notebooks` is a TypeScript toolkit for data science workflows. It provides four cohesive modules that work together for computational notebook management, data processing, and analysis.

## Module Architecture

```
┌─────────────────────────────────────────────────────┐
│                    src/index.ts                      │
│               (Root barrel exports)                  │
├──────────┬──────────┬──────────────┬────────────────┤
│ notebook │ pipeline │visualization │     utils      │
│          │          │              │                │
│ • cells  │ • dataset│ • charts     │ • csv          │
│ • CRUD   │ • xforms │ • formatter  │ • format       │
│ • runner │ • stats  │ • themes     │ • validation   │
│          │ • ETL    │              │                │
└──────────┴──────────┴──────────────┴────────────────┘
                         │
                    types/index.ts
                   (Zod schemas)
```

## Design Principles

### 1. Immutability
All data operations return new objects. No mutations of input data.

### 2. Composability
Functions are designed to be composed. A pipeline step is just a function that takes and returns a Dataset.

### 3. Type Safety
All types are defined as Zod schemas, providing both TypeScript types and runtime validation.

### 4. Text-First Rendering
Visualization outputs are strings. This makes them usable in terminals, logs, and notebooks without DOM dependencies.

### 5. No External Dependencies
The only runtime dependency is Zod. Everything else is implemented from scratch.

## Data Flow

```
Raw Data (CSV, JSON, arrays)
    ↓
createDataset() → Dataset
    ↓
Pipeline Steps (filter, transform, aggregate)
    ↓
Analysis (describe, correlationMatrix)
    ↓
Visualization (charts, tables, sparklines)
    ↓
Output (console, file, notebook cell)
```

## Type System

All types flow from Zod schemas:

```typescript
// Schema → Type (automatic inference)
const CellSchema = z.object({ ... });
type Cell = z.infer<typeof CellSchema>;
```

Key types: Cell, Notebook, Dataset, PipelineConfig, ChartSpec, AnalysisReport.
