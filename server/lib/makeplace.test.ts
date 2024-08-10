import path from 'node:path';
import { createReadStream } from 'node:fs';
import { readFile } from 'node:fs/promises';
import { createInterface } from 'node:readline/promises';

import { describe, assert, beforeAll } from 'vitest';
import glob from 'fast-glob';

import { type ParsedList, parseSchema } from './makeplace';

const testDirs = (await glob(
  './server/tests/*',
  { onlyDirectories: true },
)).map((dir) => ({ dir, name: path.basename(dir) }));

/**
 * Parses a list file and returns a parsed representation of the list.
 *
 * @param {string} file - The path to the list file.
 * @return {Promise<Record<'items' | 'dyes', ParsedList>>} A promise that resolves to an object
 * containing the parsed list for items and dyes.
 * @throws {Error} If the list file cannot be read or if the list file format is invalid.
 */
async function parseList(file: string): Promise<Record<'items' | 'dyes', ParsedList>> {
  const rl = createInterface(createReadStream(file));

  const types = ['items', 'dyes'] as const;

  const parts = [];
  // eslint-disable-next-line no-restricted-syntax
  for await (const line of rl) {
    let matches;
    if (/^=+$/.test(line)) {
      if (!types[parts.length]) {
        break;
      }

      parts.push({
        type: types[parts.length],
        items: [] as ParsedList,
      });
    // eslint-disable-next-line no-cond-assign
    } else if ((matches = /^(.+): ([0-9]+)$/.exec(line)) !== null) {
      const part = parts.at(-1);
      part?.items.push({
        // @ts-expect-error
        type: parts.length === 1 ? 'furniture' : 'dye',
        item: {
          id: -1,
          name: matches[1],
        },
        qte: Number.parseInt(matches[2], 10),
      });
    }
  }

  return Object.fromEntries(
    parts.map(({ type, items }) => [type, items]),
  ) as Record<typeof types[number], ParsedList>;
}

function getNamesOfItems(items: ParsedList) {
  return new Set(
    items
      .map(({ item }) => item.name ?? '')
      .sort(),
  );
}

describe.each(testDirs)('$name', async ({ dir }) => {
  const listPath = path.join(dir, 'makeplace.list.txt');
  const expectedPath = path.join(dir, 'expected.json');

  const expectedFile = await readFile(expectedPath, 'utf-8');
  const expected = JSON.parse(expectedFile);

  describe('parseList', (test) => {
    let list: Awaited<ReturnType<typeof parseList>>;

    beforeAll(async () => {
      list = await parseList(listPath);
    });

    test('should return same count of result', () => {
      assert.isArray(list.items);
      assert.lengthOf(list.items, expected.items);

      assert.isArray(list.dyes);
      assert.lengthOf(list.dyes, expected.dyes);
    });
  });

  describe('parseSchema', async () => {
    const schemaPath = path.join(dir, 'makeplace.json');
    const schemaFile = await readFile(schemaPath, 'utf-8');

    let list: Awaited<ReturnType<typeof parseList>>;
    let parsed: Awaited<ReturnType<typeof parseSchema>>;

    beforeAll(async () => {
      list = await parseList(listPath);

      const schema = JSON.parse(schemaFile);
      parsed = parseSchema(schema);
    });

    describe('items', (test) => {
      test('should return array', () => {
        assert.isArray(parsed.items);
      });

      test('should return at least the same count', () => {
        assert.isAtLeast(parsed.items.length, list.items.length);
      });

      test('should return at least the same quantity', () => {
        const qteMap = new Map(parsed.items.map(({ item, qte }) => [item.name, qte]));
        // eslint-disable-next-line no-restricted-syntax
        for (const { item, qte } of list.items) {
          const v = qteMap.get(item.name);
          assert.isNumber(v);
          assert.isAtLeast(v ?? 0, qte);
        }
        assert.isAtLeast(parsed.items.length, list.items.length);
      });

      test('should return at least same names', () => {
        const parsedNames = getNamesOfItems(parsed.items);
        const listNames = getNamesOfItems(list.items);
        assert.includeMembers([...parsedNames], [...listNames]);
      });
    });

    describe('dyes', (test) => {
      test('should return array', () => {
        assert.isArray(parsed.dyes);
        assert.isArray(parsed.unknownDyes);
      });

      test('should return at least the same count', () => {
        assert.isAtLeast(parsed.dyes.length, list.dyes.length);
      });

      test("shouldn't have any unknown dyes", () => {
        assert.sameMembers(parsed.unknownDyes, [], 'Unknown dyes should be empty');
      });
    });
  });
});
