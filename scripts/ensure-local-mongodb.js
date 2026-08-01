const { execFileSync, spawnSync } = require('child_process');
const dotenv = require('dotenv');

dotenv.config();

const mongoUri = process.env.MONGO_URI || '';
const containerName = process.env.MONGO_DOCKER_CONTAINER || 'mongodb';
const isLocalMongo = /(?:localhost|127\.0\.0\.1|\[::1\])(?::\d+)?(?:[/?]|$)/i.test(mongoUri);

// Hosting services must use their configured database, not a local Docker daemon.
if (process.env.NODE_ENV === 'production' || !isLocalMongo) {
  console.log('MongoDB Docker local ignoré (base distante ou environnement de production).');
  process.exit(0);
}

function runDocker(args, options = {}) {
  return execFileSync('docker', args, {
    encoding: 'utf8',
    stdio: options.quiet ? ['ignore', 'pipe', 'pipe'] : 'inherit'
  });
}

function isDockerReady() {
  try {
    runDocker(['info'], { quiet: true });
    return true;
  } catch {
    return false;
  }
}

function wait(milliseconds) {
  return new Promise(resolve => setTimeout(resolve, milliseconds));
}

function launchDockerDesktop() {
  if (process.platform === 'darwin') {
    const result = spawnSync('open', ['-a', 'Docker'], { stdio: 'ignore' });
    return !result.error && result.status === 0;
  }

  if (process.platform === 'win32') {
    const dockerDesktop = `${process.env.ProgramFiles}\\Docker\\Docker\\Docker Desktop.exe`;
    const result = spawnSync(dockerDesktop, [], { detached: true, stdio: 'ignore' });
    return !result.error;
  }

  return false;
}

async function main() {
  if (!isDockerReady()) {
    console.log('Docker n’est pas démarré. Lancement de Docker Desktop…');

    if (!launchDockerDesktop()) {
      throw new Error('Impossible de lancer Docker Desktop automatiquement sur ce système.');
    }

    const timeoutAt = Date.now() + 120_000;
    while (Date.now() < timeoutAt && !isDockerReady()) {
      await wait(2_000);
    }

    if (!isDockerReady()) {
      throw new Error('Docker Desktop n’est pas prêt après 2 minutes.');
    }
  }

  let isRunning;
  try {
    isRunning = runDocker(
      ['inspect', '--format', '{{.State.Running}}', containerName],
      { quiet: true }
    ).trim() === 'true';
  } catch {
    throw new Error(
      `Le conteneur Docker « ${containerName} » n’existe pas. Créez-le avant de relancer npm start.`
    );
  }

  if (isRunning) {
    console.log(`Le conteneur MongoDB « ${containerName} » est déjà démarré.`);
    return;
  }

  console.log(`Démarrage du conteneur MongoDB « ${containerName} »…`);
  runDocker(['start', containerName]);
}

main().catch(error => {
  console.error(`Préparation de MongoDB impossible : ${error.message}`);
  process.exit(1);
});
