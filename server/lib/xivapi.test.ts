// @vitest-environment nuxt
import path from 'node:path';
import { readFile } from 'node:fs/promises';

import { describe, assert, beforeAll } from 'vitest';
import glob from 'fast-glob';

import { type ParsedList, parseSchema } from './makeplace';
import { enrichItems } from './xivapi';

const testDirs = (await glob(
  './server/tests/*',
  { onlyDirectories: true },
)).map((dir) => ({ dir, name: path.basename(dir) }));

function splitItems(enriched: any, dyes: ParsedList) {
  const dyesIds = new Set(dyes.map(({ item }) => item.id));

  const enrichedDyes = [];
  const enrichedItems = [];
  // eslint-disable-next-line no-restricted-syntax
  for (const item of enriched) {
    if (dyesIds.has(item.item.id)) {
      enrichedDyes.push(item);
    } else {
      enrichedItems.push(item);
    }
  }

  return {
    items: enrichedItems,
    dyes: enrichedDyes,
  };
}

describe.each(testDirs)('$name', async ({ dir }) => {
  const schemaPath = path.join(dir, 'makeplace.json');
  const schemaFile = await readFile(schemaPath, 'utf-8');

  describe('enrichItems', (test) => {
    let parsed: Awaited<ReturnType<typeof parseSchema>>;
    let enriched: Awaited<ReturnType<typeof enrichItems>>;
    let items: ParsedList;
    let dyes: ParsedList;

    beforeAll(async () => {
      const schema = JSON.parse(schemaFile);
      parsed = parseSchema(schema);

      enriched = await enrichItems([...parsed.items, ...parsed.dyes]);
      ({ items, dyes } = splitItems(enriched, parsed.dyes));
    });

    test('should return array', () => {
      assert.isArray(enriched);
    });

    test('should have the same count of items', () => {
      assert.lengthOf(items, parsed.items.length);
    });

    test('should have the same count of dyes', () => {
      assert.lengthOf(dyes, parsed.dyes.length);
    });
  });
});
