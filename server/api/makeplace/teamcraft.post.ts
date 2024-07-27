import { appLogger } from '~/server/lib/logger';
import { MakePlaceSchemaValidation, parseSchema } from '~/server/lib/makeplace';
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

    appLogger.debug('Parsing MakePlace schema...');
    const { items, dyes } = parseSchema(result.data);
    appLogger.info({ msg: 'MakePlace schema parsed !', items: items.length, dyes: dyes.length });

    return {
      items,
      dyes,
      link: getImportLink([...items, ...dyes]),
    };
  } catch (error) {
    appLogger.error('Error while generating import link', error);
    throw error;
  }
});
