const admin = require('firebase-admin');
const i18n = require('../config/i18n');

function getFirebaseApp() {
  if (admin.apps.length > 0) {
    return admin.app();
  }

  const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  if (!serviceAccountJson) {
    return null;
  }

  try {
    const serviceAccount = JSON.parse(serviceAccountJson);
    return admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
  } catch (error) {
    console.error(i18n.__('fcm_init_error'), error);
    return null;
  }
}

async function sendPushToDevice({ token, title, body, data = {} }) {
  if (!token) {
    return { sent: false };
  }

  const app = getFirebaseApp();
  if (!app) {
    console.warn(i18n.__('fcm_not_configured'));
    return { sent: false };
  }

  try {
    const merged = {
      ...(typeof data === 'object' && data !== null ? data : {}),
      ...(title != null && title !== '' ? { title: String(title) } : {}),
      ...(body != null && body !== '' ? { body: String(body) } : {}),
    };

    const payloadData = Object.entries(merged).reduce((acc, [key, value]) => {
      if (value === undefined || value === null) return acc;
      acc[key] = String(value);
      return acc;
    }, {});

    // Data-only so the client `setBackgroundMessageHandler` runs (display + local notification on the app).
    await admin.messaging(app).send({
      token,
      data: payloadData,
      android: {
        priority: 'high',
      },
      apns: {
        headers: {
          'apns-push-type': 'background',
          'apns-priority': '5',
        },
        payload: {
          aps: {
            'content-available': 1,
          },
        },
      },
    });
    return { sent: true };
  } catch (error) {
    console.error(i18n.__('fcm_send_error'), error);
    return { sent: false };
  }
}

module.exports = {
  sendPushToDevice,
};
