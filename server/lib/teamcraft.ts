import type { ParsedList } from './makeplace';

/**
 * Get the import link for the given items
 *
 * @param items The list of items
 *
 * @returns The import link
 */
// eslint-disable-next-line import/prefer-default-export
export function getImportLink(items: ParsedList) {
  const data = items.map(({ item, qte }) => `${item.id},null,${qte}`).join(';');
  const b64 = Buffer.from(data).toString('base64');
  return `https://ffxivteamcraft.com/import/${b64}`;
}
