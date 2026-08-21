const deleteOrphanedFiles = require('../utils/cleanupOrphanedFiles');
const loadModels = require('../utils/loadModels');

function startCleanupCron() {
  const hours = Number(process.env.CLEANUP_CRON_HOURS) || 24;
  const intervalMs = hours * 60 * 60 * 1000;

  const run = async () => {
    try {
      loadModels();
      await deleteOrphanedFiles();
      console.info('Orphaned files cleanup completed');
    } catch (error) {
      console.error('Orphaned files cleanup failed:', error);
    }
  };

  run();
  setInterval(run, intervalMs);
}

module.exports = startCleanupCron;
