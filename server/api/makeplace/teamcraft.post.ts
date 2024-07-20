import { MakePlaceSchemaValidation, parseSchema } from '~/server/lib/makeplace';
import { enrichItems } from '~/server/lib/xivapi';
import { getImportLink } from '~/server/lib/teamcraft';

export default defineEventHandler(async (event) => {
  const result = await readValidatedBody(
    event,
    (body) => MakePlaceSchemaValidation.safeParse(body),
  );
  // eslint-disable-next-line @typescript-eslint/no-throw-literal
  if (!result.success) { throw result.error.issues; }

  // Parse makeplace file
  const { items, dyes } = parseSchema(result.data);

  // Enrich items
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

  return {
    dyes: enrichedDyes,
    items: enrichedItems,
    link: getImportLink([...items, ...dyes]),
  };
});
