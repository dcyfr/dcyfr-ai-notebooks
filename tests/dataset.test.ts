/**
 * Tests for pipeline/dataset.ts
 */

import { describe, it, expect } from 'vitest';
import {
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
  head,
  tail,
  addColumn,
  renameColumn,
  dropNulls,
} from '../src/pipeline/index.js';

describe('Type Inference', () => {
  it('infers string type', () => expect(inferColumnType('hello')).toBe('string'));
  it('infers number type', () => expect(inferColumnType(42)).toBe('number'));
  it('infers boolean type', () => expect(inferColumnType(true)).toBe('boolean'));
  it('infers null type', () => expect(inferColumnType(null)).toBe('null'));
  it('infers undefined as null', () => expect(inferColumnType(undefined)).toBe('null'));
  it('infers date type', () => expect(inferColumnType(new Date())).toBe('date'));
  it('infers array type', () => expect(inferColumnType([1, 2])).toBe('array'));
  it('infers object type', () => expect(inferColumnType({ a: 1 })).toBe('object'));
});

describe('Schema Inference', () => {
  it('infers schema from rows', () => {
    const rows = [
      { name: 'Alice', age: 25 },
      { name: 'Bob', age: 30 },
    ];
    const schema = inferSchema(rows, 'people');
    expect(schema.name).toBe('people');
    expect(schema.rows).toBe(2);
    expect(schema.columns).toHaveLength(2);
    expect(schema.columns.find((c) => c.name === 'name')?.type).toBe('string');
    expect(schema.columns.find((c) => c.name === 'age')?.type).toBe('number');
  });

  it('handles empty rows', () => {
    const schema = inferSchema([]);
    expect(schema.rows).toBe(0);
    expect(schema.columns).toHaveLength(0);
  });

  it('detects nullable columns', () => {
    const rows = [
      { name: 'Alice', score: 90 },
      { name: 'Bob', score: null },
    ];
    const schema = inferSchema(rows);
    const scoreCol = schema.columns.find((c) => c.name === 'score');
    expect(scoreCol?.nullable).toBe(true);
  });
});

describe('Dataset Creation', () => {
  it('creates a dataset', () => {
    const ds = createDataset([{ x: 1 }], 'test', 'A test dataset');
    expect(ds.metadata.name).toBe('test');
    expect(ds.metadata.description).toBe('A test dataset');
    expect(ds.rows).toHaveLength(1);
  });
});

describe('Dataset Operations', () => {
  const data = createDataset([
    { name: 'Alice', age: 25, city: 'NYC' },
    { name: 'Bob', age: 30, city: 'LA' },
    { name: 'Charlie', age: 22, city: 'NYC' },
    { name: 'Diana', age: 35, city: 'SF' },
  ]);

  it('selects columns', () => {
    const selected = selectColumns(data, ['name', 'age']);
    expect(Object.keys(selected.rows[0])).toEqual(['name', 'age']);
  });

  it('filters rows', () => {
    const filtered = filterRows(data, (r) => (r.age as number) > 25);
    expect(filtered.rows).toHaveLength(2);
  });

  it('sorts ascending', () => {
    const sorted = sortBy(data, 'age');
    expect(sorted.rows[0].name).toBe('Charlie');
    expect(sorted.rows[3].name).toBe('Diana');
  });

  it('sorts descending', () => {
    const sorted = sortBy(data, 'age', false);
    expect(sorted.rows[0].name).toBe('Diana');
  });

  it('gets unique values', () => {
    const cities = uniqueValues(data, 'city');
    expect(cities).toContain('NYC');
    expect(cities).toContain('LA');
    expect(cities).toContain('SF');
  });

  it('groups by column', () => {
    const groups = groupBy(data, 'city');
    expect(groups.get('NYC')).toHaveLength(2);
    expect(groups.get('LA')).toHaveLength(1);
  });

  it('gets column values', () => {
    const ages = getColumn(data, 'age');
    expect(ages).toEqual([25, 30, 22, 35]);
  });

  it('gets numeric column values', () => {
    const ages = getNumericColumn(data, 'age');
    expect(ages).toEqual([25, 30, 22, 35]);
  });

  it('gets head', () => {
    const top = head(data, 2);
    expect(top.rows).toHaveLength(2);
    expect(top.rows[0].name).toBe('Alice');
  });

  it('gets tail', () => {
    const bottom = tail(data, 2);
    expect(bottom.rows).toHaveLength(2);
    expect(bottom.rows[1].name).toBe('Diana');
  });

  it('adds a computed column', () => {
    const withLabel = addColumn(data, 'label', (r) => `${r.name}-${r.city}`);
    expect(withLabel.rows[0].label).toBe('Alice-NYC');
  });

  it('renames a column', () => {
    const renamed = renameColumn(data, 'name', 'fullName');
    expect(renamed.rows[0].fullName).toBe('Alice');
    expect(renamed.rows[0].name).toBeUndefined();
  });

  it('drops nulls', () => {
    const withNulls = createDataset([
      { a: 1, b: 'x' },
      { a: null, b: 'y' },
      { a: 3, b: null },
    ]);
    const cleaned = dropNulls(withNulls, ['a']);
    expect(cleaned.rows).toHaveLength(2);
  });
});
