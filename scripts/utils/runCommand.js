const { spawnSync } = require('child_process');

function runCommand(command, args, options = {}) {
  const result = spawnSync(command, args, {
    stdio: 'inherit',
    ...options,
  });

  if (result.error) {
    throw result.error;
  }

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

function commandExists(command) {
  const check = spawnSync('which', [command], { stdio: 'pipe' });
  return check.status === 0;
}

module.exports = { runCommand, commandExists };
