function buildMongoURL(prefix = '') {
  const uriKey = prefix ? `${prefix}MONGO_URI` : 'MONGO_URI';
  if (process.env[uriKey]) {
    return process.env[uriKey];
  }

  const host =
  process.env[`${prefix}MONGODB_HOST`] || (
  prefix ? '127.0.0.1' : process.env.MONGODB_HOST) ||
  '127.0.0.1';
  const port =
  process.env[`${prefix}MONGODB_PORT`] || (
  prefix ? '27017' : process.env.MONGODB_PORT) ||
  '27017';
  const database =
  process.env[`${prefix}MONGODB_DATABASE`] || (
  prefix ? undefined : process.env.MONGODB_DATABASE) ||
  'good-foods';
  const username = process.env[`${prefix}MONGODB_USERNAME`];
  const password = process.env[`${prefix}MONGODB_PASSWORD`];

  let url = 'mongodb://';
  if (username && password) {
    url += `${encodeURIComponent(username)}:${encodeURIComponent(password)}@`;
  }
  url += `${host}:${port}/${database}`;
  return url;
}

function getDatabaseName(uri) {
  const match = uri.match(/\/([^/?]+)(\?|$)/);
  return match?.[1] || process.env.MONGODB_DATABASE || 'good-foods';
}

module.exports = { buildMongoURL, getDatabaseName };
