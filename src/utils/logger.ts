import pino, { stdTimeFunctions } from 'pino';
import environments from './env';

const logger = pino({
  name: process.env.APP_ID,
  level: environments.LOG_LEVEL,
  nestedKey: 'stack',
  timestamp: stdTimeFunctions.isoTime,
});

export default logger;
