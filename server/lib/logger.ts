import pino from 'pino';
import pretty from 'pino-pretty';

function createPino(name: string, format?: string) {
  return pino(
    { name },
    pino.multistream([
      pretty({
        messageFormat: format,
        hideObject: !!format,
        ignore: 'pid,hostname',
      }),
      pino.destination(`server/logs/${name}.log`),
    ]),
  );
}

export const appLogger = createPino('app');

export const httpLogger = createPino('http', '"{method} {path}" {status} {elapsed}ms');
