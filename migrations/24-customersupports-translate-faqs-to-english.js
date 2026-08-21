
const { ObjectId } = require('mongodb');

const BACKUP_COLLECTION = '_migration_24_customersupport_faq_backups';
const MIGRATION_TAG = 'migration_24_english_faq';

const FAQ_TRANSLATIONS = [
{
  questionFr: "Où voir l'état de ma commande ?",
  questionEn: 'Where can I see my order status?',
  answerEn:
  'Open the Orders section and tap your active order to view preparation and delivery updates in real time.',
  faq_category: 'delivery'
},
{
  questionFr: 'Puis-je changer l\'adresse de livraison ?',
  questionEn: 'Can I change the delivery address?',
  answerEn:
  'You can update the delivery address before the restaurant starts preparing your order, from your profile or at checkout.',
  faq_category: 'delivery'
},
{
  questionFr: 'Puis-je modifier ma commande ?',
  questionEn: 'Can I modify my order?',
  answerEn:
  'Contact support as soon as possible. Once preparation has started, changes may no longer be possible.',
  faq_category: 'other'
},
{
  questionFr: 'Que faire si ma commande est endommagée ?',
  questionEn: 'What should I do if my order is damaged?',
  answerEn:
  'Take a photo of the issue and contact support within 24 hours. We will review your case and offer a suitable resolution.',
  faq_category: 'other'
},
{
  questionFr: "L'application ne fonctionne pas",
  questionEn: 'The app is not working',
  answerEn:
  'Force close the app, check your internet connection, install the latest update, then restart your device. If the issue persists, contact support.',
  faq_category: 'other'
},
{
  questionFr: "L'application ne fonctionne pas ?",
  questionEn: 'The app is not working',
  answerEn:
  'Force close the app, check your internet connection, install the latest update, then restart your device. If the issue persists, contact support.',
  faq_category: 'other'
}];

const DRIVER_FAQS_EN = [
{
  question: 'How do I accept a delivery?',
  answer:
  "Tap an available order on the home screen and press 'Accept' to start the delivery.",
  faq_category: 'delivery'
},
{
  question: "What happens if I can't complete a delivery?",
  answer:
  'Contact support immediately. We will help reassign the order to another driver.',
  faq_category: 'delivery'
},
{
  question: 'How do I get paid?',
  answer:
  'Payments are processed automatically after a successful delivery. Check your earnings in the app.',
  faq_category: 'payment'
},
{
  question: 'What should I do in case of an accident?',
  answer:
  'Stop immediately, ensure everyone is safe, and call emergency services. Then contact our support team.',
  faq_category: 'other'
},
{
  question: 'How do I update my availability status?',
  answer:
  'Use the status toggle on the home screen to switch between Available, Busy, or Offline.',
  faq_category: 'account'
}];

function normalizeQuestion(value) {
  return String(value || '').
  trim().
  replace(/\s+/g, ' ').
  toLowerCase();
}

async function backupFaq(backupCol, doc) {
  await backupCol.updateOne(
    { _id: doc._id },
    {
      $set: {
        _id: doc._id,
        previous: {
          question: doc.question,
          answer: doc.answer,
          faq_category: doc.faq_category
        },
        migratedAt: new Date()
      }
    },
    { upsert: true }
  );
}

async function resolveSeedUserId(db) {
  const admin = await db.collection('users').findOne({ role: 'admin' }, { projection: { _id: 1 } });
  if (admin?._id) return admin._id;

  const anyUser = await db.collection('users').findOne({}, { projection: { _id: 1 } });
  return anyUser?._id || new ObjectId('6979f426af5473434a8de666');
}

async function up(db) {
  const faqsCol = db.collection('customersupports');
  const backupCol = db.collection(BACKUP_COLLECTION);

  let translatedCount = 0;

  for (const entry of FAQ_TRANSLATIONS) {
    const docs = await faqsCol.
    find({ type: 'faq', question: entry.questionFr }).
    toArray();

    for (const doc of docs) {
      await backupFaq(backupCol, doc);
      await faqsCol.updateOne(
        { _id: doc._id },
        {
          $set: {
            question: entry.questionEn,
            answer: entry.answerEn,
            faq_category: entry.faq_category,
            updated_at: new Date(),
            actionData: { ...(doc.actionData || {}), migrationTag: MIGRATION_TAG }
          }
        }
      );
      translatedCount += 1;
    }
  }

  const existingFaqs = await faqsCol.countDocuments({ type: 'faq' });

  if (existingFaqs === 0) {
    const userId = await resolveSeedUserId(db);
    const now = new Date();

    await faqsCol.insertMany(
      DRIVER_FAQS_EN.map((faq) => ({
        type: 'faq',
        user: userId,
        question: faq.question,
        answer: faq.answer,
        faq_category: faq.faq_category,
        created_at: now,
        updated_at: now,
        actionData: { migrationTag: MIGRATION_TAG, seeded: true }
      }))
    );

    console.log(`✅ ${DRIVER_FAQS_EN.length} FAQ(s) driver seedée(s) en anglais`);
    return;
  }

  console.log(`✅ ${translatedCount} FAQ(s) traduite(s) en anglais`);
}

async function down(db) {
  const faqsCol = db.collection('customersupports');
  const backupCol = db.collection(BACKUP_COLLECTION);

  const backups = await backupCol.find({}).toArray();

  for (const backup of backups) {
    await faqsCol.updateOne(
      { _id: backup._id },
      {
        $set: {
          question: backup.previous.question,
          answer: backup.previous.answer,
          faq_category: backup.previous.faq_category,
          updated_at: new Date()
        },
        $unset: { 'actionData.migrationTag': '' }
      }
    );
  }

  await faqsCol.deleteMany({
    type: 'faq',
    'actionData.migrationTag': MIGRATION_TAG,
    'actionData.seeded': true
  });

  await backupCol.deleteMany({});

  console.log(`↩️ ${backups.length} FAQ(s) restaurée(s)`);
}

module.exports = {
  BACKUP_COLLECTION,
  MIGRATION_TAG,
  FAQ_TRANSLATIONS,
  DRIVER_FAQS_EN,
  normalizeQuestion,
  up,
  down
};
