const i18n = require('../config/i18n');
const { RATE_LIMIT_WINDOW_MS, RATE_LIMIT_MAX } = require('../config/uploadSecurity');

const hits = new Map();

const uploadRateLimit = (req, res, next) => {
  const key = req.user?.id || req.ip;
  const now = Date.now();
  let entry = hits.get(key);

  if (!entry || now - entry.start > RATE_LIMIT_WINDOW_MS) {
    entry = { count: 0, start: now };
  }

  entry.count += 1;
  hits.set(key, entry);

  if (entry.count > RATE_LIMIT_MAX) {
    return res.status(429).json({ message: i18n.__('upload_rate_limit') });
  }

  next();
};

module.exports = uploadRateLimit;
