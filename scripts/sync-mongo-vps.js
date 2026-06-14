const fs = require('fs');
const os = require('os');
const path = require('path');
require('dotenv').config();

const { buildMongoURL, getDatabaseName } = require('./utils/mongoUrl');
const { runCommand, commandExists } = require('./utils/runCommand');

function expandHome(filePath) {
  if (filePath.startsWith('~/')) {
    return path.join(os.homedir(), filePath.slice(2));
  }
  return filePath;
}

function getVpsConfig() {
  return {
    host: process.env.VPS_HOST,
    user: process.env.VPS_USER || 'root',
    sshKey: expandHome(process.env.VPS_SSH_KEY || '~/.ssh/goodfood_deploy'),
    mongoUri: buildMongoURL('VPS_'),
    backupBase: process.env.VPS_BACKUP_BASE || '/root/my-backend/backups',
    pm2Name: process.env.VPS_PM2_NAME || 'my-backend',
    remoteRestorePath: process.env.VPS_REMOTE_RESTORE_PATH || '/tmp/good-foods-restore',
  };
}

function shellWithNvm(command) {
  return [
    'export NVM_DIR="$HOME/.nvm"',
    '[ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh"',
    command,
  ].join(' && ');
}

function sshTarget(config) {
  return `${config.user}@${config.host}`;
}

function runSsh(config, remoteCommand) {
  runCommand('ssh', [
    '-i',
    config.sshKey,
    '-o',
    'BatchMode=yes',
    sshTarget(config),
    remoteCommand,
  ]);
}

function runScp(config, source, destination) {
  runCommand('scp', ['-i', config.sshKey, '-r', source, destination]);
}

function ensureRequirements(config) {
  if (!config.host) {
    console.error('Erreur: VPS_HOST manquant dans .env');
    process.exit(1);
  }

  if (!fs.existsSync(config.sshKey)) {
    console.error(`Erreur: clé SSH introuvable: ${config.sshKey}`);
    process.exit(1);
  }

  for (const tool of ['ssh', 'scp', 'docker']) {
    if (!commandExists(tool)) {
      console.error(`Erreur: ${tool} introuvable.`);
      process.exit(1);
    }
  }
}

function dumpLocalMongoViaDocker(localUri, dockerContainer, dumpRoot) {
  const dbName = getDatabaseName(localUri);
  const containerDumpDir = '/tmp/mongo-sync-dump';

  runCommand('docker', [
    'exec',
    dockerContainer,
    'mongodump',
    `--uri=${localUri}`,
    `--out=${containerDumpDir}`,
  ]);

  const localDumpPath = path.join(dumpRoot, dbName);
  fs.mkdirSync(dumpRoot, { recursive: true });

  runCommand('docker', [
    'cp',
    `${dockerContainer}:${containerDumpDir}/${dbName}`,
    localDumpPath,
  ]);

  runCommand('docker', ['exec', dockerContainer, 'rm', '-rf', containerDumpDir]);

  return { dbName, localDumpPath };
}

function syncMongoToVps() {
  const localUri = buildMongoURL();
  const dockerContainer = process.env.MONGO_DOCKER_CONTAINER || 'mongodb';
  const config = getVpsConfig();
  ensureRequirements(config);

  const timestamp = new Date()
    .toISOString()
    .replace(/[-:]/g, '')
    .replace(/\..+/, '')
    .replace('T', '-');
  const localBackupDir = path.resolve(
    process.env.LOCAL_BACKUP_BASE || 'backups',
    `vps-before-sync-${timestamp}`
  );
  const vpsBackupDir = `${config.backupBase}/vps-before-sync-${timestamp}`;
  const localDumpRoot = path.join(os.tmpdir(), `mongo-sync-${process.pid}`);

  fs.mkdirSync(localBackupDir, { recursive: true });

  console.log('→ 1/5 Backup Mongo VPS (avant mise à jour)');
  runSsh(
    config,
    `mkdir -p "${vpsBackupDir}" && mongodump --uri="${config.mongoUri}" --out="${vpsBackupDir}"`
  );

  console.log('→ 2/5 Copie backup VPS sur ton Mac');
  runScp(config, `${sshTarget(config)}:${vpsBackupDir}`, `${localBackupDir}/`);

  console.log(`→ 3/5 Dump Mongo local (Docker: ${dockerContainer})`);
  const { localDumpPath } = dumpLocalMongoViaDocker(localUri, dockerContainer, localDumpRoot);

  console.log('→ 4/5 Restore local → VPS');
  runScp(config, localDumpPath, `${sshTarget(config)}:${config.remoteRestorePath}`);
  runSsh(
    config,
    `mongorestore --uri="${config.mongoUri}" --drop "${config.remoteRestorePath}"`
  );
  runSsh(config, `rm -rf "${config.remoteRestorePath}"`);

  console.log(`→ 5/5 Restart pm2 (${config.pm2Name})`);
  runSsh(config, shellWithNvm(`pm2 restart ${config.pm2Name}`));

  fs.rmSync(localDumpRoot, { recursive: true, force: true });

  console.log('✓ Terminé — VPS synchronisé avec le Mongo local');
  console.log(`  Backup VPS : ${vpsBackupDir}`);
  console.log(`  Backup local : ${localBackupDir}`);
}

syncMongoToVps();
