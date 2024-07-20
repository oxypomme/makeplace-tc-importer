import { setTimeout } from 'node:timers/promises';

import type { ParsedList } from './makeplace';

type NitroFetchOptions = Parameters<(typeof $fetch)>[1];

type XIVAPISearchRequest = {
  indexes?: string
  columns?: string,
  sort_field?: string,
  body: Record<string, any>,
};

type XIVAPISearchResults<T> = {
  Pagination: {
    Page: number,
    PageNext: number,
    PagePrev: number | null,
    PageTotal: number,
    Results: number,
    ResultsPerPage: number,
    ResultsTotal: number,
  },
  Results: T[],
};

function useXIVAPI<T>(path: string, opts?: NitroFetchOptions) {
  return $fetch<T>(`https://xivapi.com${path}`, opts);
}

async function* useXIVAPISearch<T>(request: XIVAPISearchRequest, opts?: Omit<NitroFetchOptions, 'body' | 'method'>) {
  let total = 0;
  const { size = 100 } = request.body;

  let hasEnded = false;
  while (!hasEnded) {
    console.log(`Fetching ${total} - ${total + size}`);
    // eslint-disable-next-line no-await-in-loop
    const { Results } = await useXIVAPI<XIVAPISearchResults<T>>(
      '/search',
      {
        ...opts,
        method: 'POST',
        body: {
          ...request,
          body: {
            ...request.body,
            from: total,
            size,
          },
        },
      },
    );

    hasEnded = Results.length < size;
    total += Results.length;
    yield Results;
    // eslint-disable-next-line no-await-in-loop
    await setTimeout(1000);
  }
}

// eslint-disable-next-line import/prefer-default-export
export async function enrichItems(items: ParsedList) {
  const columns = ['ID', 'Name', 'Icon'];
  type XIVAPIItem = {
    ID: number,
    Name: string,
    Icon: string,
  };

  const itemFilters = items.map(
    ({ item }) => ({ term: { ID: item.id } }),
  );

  const search = useXIVAPISearch<XIVAPIItem>(
    {
      columns: columns.join(','),
      indexes: 'Item',
      sort_field: 'ID',
      body: {
        query: {
          bool: {
            should: itemFilters,
          },
        },
      },
    },
  );
  const resultMap = new Map<number, XIVAPIItem>();
  // eslint-disable-next-line no-restricted-syntax
  for await (const results of search) {
    results.forEach((item) => resultMap.set(item.ID, item));
  }

  return items.map((i) => {
    const result = resultMap.get(i.item.id);

    return {
      ...i,
      item: {
        ...i.item,
        name: result?.Name || i.item.name,
        icon: result?.Icon,
      },
    };
  });
}