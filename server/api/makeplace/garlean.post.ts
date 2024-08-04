import { MakePlaceSchemaValidation, parseSchema } from '~/server/lib/makeplace';
import { createGarleanList } from '~/server/lib/garlean';

export default defineEventHandler(async (event) => {
  const result = await readValidatedBody(
    event,
    (body) => MakePlaceSchemaValidation.safeParse(body),
  );

  if (!result.success) {
    // eslint-disable-next-line @typescript-eslint/no-throw-literal
    throw result.error.issues;
  }

  let { name } = getQuery(event);
  if (Array.isArray(name)) {
    name = name[0];
  }
  if (!name) {
    name = `mptc-${new Date().toISOString()}`;
  }

  const { items, dyes } = parseSchema(result.data);
  return {
    items,
    dyes,
    link: await createGarleanList(`${name}`, [...items, ...dyes]),
  };
});
