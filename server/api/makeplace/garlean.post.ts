import { appLogger } from '~/server/lib/logger';
import { MakePlaceSchemaValidation, parseSchema } from '~/server/lib/makeplace';
import { enrichItems } from '~/server/lib/xivapi';
import { createGarleanList } from '~/server/lib/garlean';

export default defineEventHandler(async (event) => {
  try {
    appLogger.debug({ msg: 'Received MakePlace schema...', size: getHeader(event, 'content-length') });
    const result = await readValidatedBody(
      event,
      (body) => MakePlaceSchemaValidation.safeParse(body),
    );

    if (!result.success) {
      // eslint-disable-next-line @typescript-eslint/no-throw-literal
      throw result.error.issues;
    }
    appLogger.debug('MakePlace schema is valid !');

    // Parse makeplace file
    appLogger.debug('Parsing MakePlace schema...');
    const { items, dyes, unknownDyes } = parseSchema(result.data);
    if (unknownDyes.length > 0) {
      appLogger.warn({
        msg: 'Unknown dyes found',
        count: unknownDyes.length,
        dyes: unknownDyes,
      });
    }
    appLogger.info({ msg: 'MakePlace schema parsed !', items: items.length, dyes: dyes.length });

    // Enrich items
    appLogger.debug('Enriching items...');
    const dyesIds = new Set(dyes.map(({ item }) => item.id));
    const enriched = await enrichItems([...items, ...dyes]);
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
    appLogger.info({ msg: 'Items enriched !', items: enrichedItems.length, dyes: enrichedDyes.length });

    let { name } = getQuery(event);
    if (Array.isArray(name)) {
      ([name] = name);
    }
    if (!name) {
      name = `mptc-${new Date().toISOString()}`;
    }

    return {
      dyes: enrichedDyes,
      items: enrichedItems,
      link: await createGarleanList(`${name}`, [...items, ...dyes]),
    };
  } catch (error) {
    appLogger.error('Error while generating import link for GarLandTools', error);
    throw error;
  }
});
