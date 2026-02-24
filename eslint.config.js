const noCommentsPlugin = require('eslint-plugin-no-comments');
const i18nextPlugin = require('eslint-plugin-i18next');

module.exports = [
  {
    ignores: [
      'node_modules/**',
      'uploads/**',
      'backups/**',
      '*.log',
    ],
  },
  {
    files: ['**/*.js'],
    plugins: {
      'no-comments': noCommentsPlugin,
      i18next: i18nextPlugin,
    },
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: {
        console: 'readonly',
        process: 'readonly',
        Buffer: 'readonly',
        __dirname: 'readonly',
        __filename: 'readonly',
        module: 'readonly',
        require: 'readonly',
        global: 'readonly',
        exports: 'readonly',
        setTimeout: 'readonly',
        setInterval: 'readonly',
        clearTimeout: 'readonly',
        clearInterval: 'readonly',
      },
    },
    rules: {
      'no-comments/disallowComments': 'error',
      'no-multiple-empty-lines': ['error', { max: 1, maxEOF: 1 }],
      'no-console': ['warn', { allow: ['warn', 'error'] }],
      // Règles personnalisées pour détecter les chaînes non traduites
      'no-restricted-syntax': [
        'warn',
        {
          selector: 'CallExpression[callee.property.name="json"] > ObjectExpression > Property[key.name="message"] > Literal',
          message: 'Les messages dans les réponses JSON devraient être traduits avec res.__(key)'
        },
        {
          selector: 'CallExpression[callee.property.name="json"] > ObjectExpression > Property[key.name="error"] > Literal',
          message: 'Les messages d\'erreur dans les réponses JSON devraient être traduits avec res.__(key)'
        },
        {
          selector: 'CallExpression[callee.object.name="console"][callee.property.name=/^(log|error|warn)$/][arguments.0.type="Literal"]',
          message: 'Les messages de console devraient être traduits avec i18n.__(key) (logs en anglais)'
        }
      ],
      'i18next/no-literal-string-in-jsx': 'off', // Pas nécessaire pour un backend Node.js
    },
  },
];
