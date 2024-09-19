import { httpLogger as logger } from '../lib/logger';

export default defineNitroPlugin((nitroApp) => {
  nitroApp.hooks.hook('request', (event) => {
    event.context.receivedAt = process.hrtime.bigint();
  });

  nitroApp.hooks.hook('afterResponse', (event) => {
    const elapsed = process.hrtime.bigint() - event.context.receivedAt;
    logger.info({
      method: event.method,
      ua: event.headers.get('user-agent'),
      path: event.path,
      status: getResponseStatus(event),
      elapsed: elapsed / BigInt(1000000),
    });
  });
});
