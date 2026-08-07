const i18n = require('i18n');
const path = require('path');
i18n.configure({
    locales: ['en', 'fr', 'es', 'ar'],
    directory: path.join(__dirname, '../locales'),
    defaultLocale: 'en',
    cookie: 'lang',
    queryParameter: 'lang',
    objectNotation: true,
    fallbacks: { es: 'en', ar: 'en' },
});
module.exports = i18n;
