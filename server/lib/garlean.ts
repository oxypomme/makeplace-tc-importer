import { appLogger } from '~/server/lib/logger';
import type { ParsedList } from './makeplace';

type NitroFetchOptions = Parameters<(typeof $fetch)>[1];

type GarleanItem = {
  type: 'item',
  id: number,
  amount: number
};

function useGarleanTools<T>(body: FormData, opts?: NitroFetchOptions) {
  return $fetch<T>('https://garlandtools.org/api.php', {
    ...(opts ?? {}),
    parseResponse: JSON.parse,
    method: 'POST',
    body,
  });
}

function formatParsedItem({ item, qte }: ParsedList[number]): GarleanItem {
  return {
    type: 'item',
    id: item.id,
    amount: qte,
  };
}

// eslint-disable-next-line import/prefer-default-export
export async function createGarleanList(name: string, elements: ParsedList) {
  // fuck, forgot quantity
  const items: GarleanItem[] = [];
  const dyes: GarleanItem[] = [];
  // eslint-disable-next-line no-restricted-syntax
  for (const el of elements) {
    if (el.type === 'dye') {
      dyes.push(formatParsedItem(el));
    } else {
      items.push(formatParsedItem(el));
    }
  }

  const data = [
    {
      type: 'group',
      id: 'Items',
      blocks: items,
    },
    {
      type: 'group',
      id: 'Dyes',
      blocks: dyes,
    },
  ];

  const formData = new FormData();
  formData.append('method', 'list-share');
  formData.append('name', name);
  formData.append('list', JSON.stringify(data));

  appLogger.debug('Creating Garland Tools list...');
  const { id } = await useGarleanTools<{ id: string }>(formData);
  appLogger.info('Garlean Tools list created !');
  return `https://garlandtools.org/db/#list/${id}`;
}
