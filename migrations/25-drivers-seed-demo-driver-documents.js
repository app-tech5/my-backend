
const fs = require('fs');
const path = require('path');
const { ObjectId } = require('mongodb');

const DEMO_DRIVER_ID = new ObjectId('6979f43d81158605b78de666');
const BACKUP_COLLECTION = '_migration_25_demo_driver_document_backups';
const MIGRATION_TAG = 'migration_25_demo_driver_documents';

const DEMO_DOCUMENT_FILES = [
'demo-driver-license.jpg',
'demo-vehicle-insurance.jpg',
'demo-identity-card.jpg'];

const DEMO_DOCUMENT_TYPES = [
'driver_license',
'insurance',
'identity_card'];

const PUBLIC_DOCUMENTS_DIR = path.join(__dirname, '../public/driver-documents');

function resolvePublicBaseUrl() {
  const fromEnv =
  process.env.PUBLIC_BASE_URL ||
  process.env.API_BASE_URL?.replace(/\/api\/?$/, '');

  return String(fromEnv || 'http://localhost:5000').replace(/\/$/, '');
}

function buildDemoDriverDocuments(baseUrl = resolvePublicBaseUrl()) {
  const normalizedBaseUrl = String(baseUrl).replace(/\/$/, '');

  return DEMO_DOCUMENT_TYPES.map((type, index) => ({
    type,
    fileUrl: `${normalizedBaseUrl}/api/public/driver-documents/${DEMO_DOCUMENT_FILES[index]}`
  }));
}

function documentsMatchSeed(documents, seeds) {
  if (!Array.isArray(documents) || documents.length !== seeds.length) {
    return false;
  }

  return seeds.every((seed) =>
  documents.some((doc) => doc.type === seed.type && doc.fileUrl === seed.fileUrl)
  );
}

function ensureDemoDocumentFiles() {
  fs.mkdirSync(PUBLIC_DOCUMENTS_DIR, { recursive: true });

  const missing = DEMO_DOCUMENT_FILES.filter(
    (filename) => !fs.existsSync(path.join(PUBLIC_DOCUMENTS_DIR, filename))
  );

  if (missing.length === 0) {
    return;
  }

  throw new Error(
    `Missing demo document files in public/driver-documents: ${missing.join(', ')}`
  );
}

async function up(db) {
  ensureDemoDocumentFiles();

  const driversCol = db.collection('drivers');
  const backupCol = db.collection(BACKUP_COLLECTION);
  const demoDocuments = buildDemoDriverDocuments();

  const driver = await driversCol.findOne({ _id: DEMO_DRIVER_ID });
  if (!driver) {
    console.log('⚠️ Driver démo introuvable — migration ignorée');
    return;
  }

  if (documentsMatchSeed(driver.documents, demoDocuments)) {
    console.log('✅ Documents déjà seedés pour le driver démo');
    return;
  }

  const existingBackup = await backupCol.findOne({
    driverId: DEMO_DRIVER_ID,
    migrationTag: MIGRATION_TAG
  });

  if (!existingBackup) {
    await backupCol.insertOne({
      driverId: DEMO_DRIVER_ID,
      migrationTag: MIGRATION_TAG,
      previousDocuments: driver.documents || [],
      previousIsApproved: driver.isApproved === true,
      backedUpAt: new Date()
    });
  }

  await driversCol.updateOne(
    { _id: DEMO_DRIVER_ID },
    {
      $set: {
        documents: demoDocuments,
        isApproved: true
      }
    }
  );

  console.log(`✅ ${demoDocuments.length} document(s) démo appliqué(s) au driver`);
}

async function down(db) {
  const driversCol = db.collection('drivers');
  const backupCol = db.collection(BACKUP_COLLECTION);

  const backup = await backupCol.findOne({
    driverId: DEMO_DRIVER_ID,
    migrationTag: MIGRATION_TAG
  });

  if (!backup) {
    console.log('↩️ Aucune sauvegarde migration 25 — rien à restaurer');
    return;
  }

  await driversCol.updateOne(
    { _id: DEMO_DRIVER_ID },
    {
      $set: {
        documents: backup.previousDocuments || [],
        isApproved: backup.previousIsApproved === true
      }
    }
  );

  await backupCol.deleteOne({ _id: backup._id });
  console.log('↩️ Documents du driver démo restaurés');
}

module.exports = {
  DEMO_DRIVER_ID,
  BACKUP_COLLECTION,
  MIGRATION_TAG,
  DEMO_DOCUMENT_FILES,
  DEMO_DOCUMENT_TYPES,
  buildDemoDriverDocuments,
  documentsMatchSeed,
  up,
  down
};
