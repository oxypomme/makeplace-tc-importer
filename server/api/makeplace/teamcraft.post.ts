import { MakePlaceSchemaValidation, parseSchema } from '~/server/lib/makeplace';
import { getImportLink } from '~/server/lib/teamcraft';

export default defineEventHandler(async (event) => {
  const result = await readValidatedBody(
    event,
    (body) => MakePlaceSchemaValidation.safeParse(body),
  );

  if (!result.success) {
    // eslint-disable-next-line @typescript-eslint/no-throw-literal
    throw result.error.issues;
  }

  const { items, dyes } = parseSchema(result.data);
  return {
    items,
    dyes,
    link: getImportLink([...items, ...dyes]),
  };
});
