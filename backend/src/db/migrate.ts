import * as cb from './index';
import { logger } from '../utils/logger';

async function migrate() {
  try {
    await cb.connect();
    logger.info('Connected to DB for migration');
    await cb.ensureIndexes();
    logger.info('Migration complete');
  } catch (err) {
    logger.error('Migration failed', err);
    process.exitCode = 1;
  }
}

// Run migration on prestart
(async () => {
  try {
    await migrate();
    process.exit(0);
  } catch (err) {
    logger.error('Migration failed', err);
    process.exitCode = 1;
  }
})();
