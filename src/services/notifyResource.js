const User = require('../models/User');
const Notification = require('../models/Notification');
const i18n = require('../config/i18n');
const { sendPushToDevice } = require('./fcm');

async function notifyResource({
  userId,
  userFilter,
  titleKey,
  messageKey,
  messageArgs = [],
  type,
  relatedEntity,
  relatedEntityModel,
  action,
  actionData,
  pushData,
  priority = 'high',
}) {
  const user = userId
    ? await User.findById(userId).select('_id deviceToken')
    : userFilter
      ? await User.findOne(userFilter).select('_id deviceToken')
      : null;

  if (!user?._id) return;

  const title = i18n.__(titleKey);
  const message = i18n.__(messageKey, ...messageArgs);

  await Notification.create({
    user: user._id,
    title,
    message,
    type,
    relatedEntity,
    relatedEntityModel,
    action,
    actionData,
    priority,
    createdBy: 'system',
  });

  await sendPushToDevice({
    token: user.deviceToken,
    title,
    body: message,
    data: pushData,
  });
}

module.exports = { notifyResource };
