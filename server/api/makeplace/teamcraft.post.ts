import { appLogger } from '~/server/lib/logger';
import { MakePlaceSchemaValidation, parseSchema } from '~/server/lib/makeplace';
import { enrichItems } from '~/server/lib/xivapi';
import { getImportLink } from '~/server/lib/teamcraft';

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
    appLogger.info({ msg: 'MakePlace schema parsed !', items: items.length, dyes: dyes.length });
    if (unknownDyes.length > 0) {
      appLogger.warn({
        msg: 'Unknown dyes found',
        count: unknownDyes.length,
        dyes: unknownDyes,
      });
    }

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

    return {
      dyes: enrichedDyes,
      items: enrichedItems,
      link: getImportLink([...items, ...dyes]),
    };
  } catch (error) {
    appLogger.error('Error while generating import link for TeamCraft', error);
    throw error;
  }
});
