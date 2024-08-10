import path from 'node:path';
import { readFile } from 'node:fs/promises';

import { describe, assert, beforeAll } from 'vitest';
import glob from 'fast-glob';

import { parseSchema } from './makeplace';
import { getImportLink } from './teamcraft';

const testDirs = (await glob(
  './server/tests/*',
  { onlyDirectories: true },
)).map((dir) => ({ dir, name: path.basename(dir) }));

describe.each(testDirs)('$name', async ({ dir }) => {
  describe('getImportLink', async (test) => {
    const schemaPath = path.join(dir, 'makeplace.json');
    const schemaFile = await readFile(schemaPath, 'utf-8');

    let parsed: Awaited<ReturnType<typeof parseSchema>>;
    let link: string;

    beforeAll(async () => {
      const schema = JSON.parse(schemaFile);
      parsed = parseSchema(schema);
      link = getImportLink([...parsed.items, ...parsed.dyes]);
    });

    test('should return string', () => {
      assert.isString(link);
    });

    test('should be a valid URL', () => {
      assert.doesNotThrow(() => new URL(link));
    });
  });
});
