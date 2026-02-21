const noCommentsPlugin = require('eslint-plugin-no-comments');
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
    },
  },
];
