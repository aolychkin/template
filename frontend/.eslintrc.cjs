module.exports = {
  root: true,
  env: { browser: true, es2020: true },
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:react-hooks/recommended',
  ],
  ignorePatterns: ['dist', '.eslintrc.cjs', 'node_modules', 'src/shared/api/generated/**'],
  parser: '@typescript-eslint/parser',
  plugins: ['react-refresh', '@typescript-eslint'],
  rules: {
    'react-refresh/only-export-components': [
      'warn',
      { allowConstantExport: true },
    ],
    // Отключаем некоторые строгие правила для удобства
    '@typescript-eslint/no-explicit-any': 'off',
    '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
    'no-empty': 'warn',
    
    // ==========================================================================
    // ARCHITECTURAL INVARIANTS
    // ==========================================================================
    
    // Invariant #1: Single Retry Layer - RTK Query retry должен быть отключён
    'no-restricted-syntax': [
      'error',
      {
        selector: "Property[key.name='retry'][value.type!='Literal'][value.value!=false]",
        message: 'RTK Query retry must be disabled. Use withRetry() from shared/lib/retry.ts instead.',
      },
      {
        selector: "Property[key.name='retry'][value.value=true]",
        message: 'RTK Query retry must be disabled. Use withRetry() from shared/lib/retry.ts instead.',
      },
      {
        selector: "Property[key.name='retry'][value.type='Literal'][value.value>0]",
        message: 'RTK Query retry must be disabled. Use withRetry() from shared/lib/retry.ts instead.',
      },
    ],
    
    // Logger usage - console в бизнес-логике — warning
    'no-console': [
      'warn',
      {
        allow: ['warn', 'info', 'debug'],
      },
    ],
    
    // FSD Architecture: Запрет глубоких относительных импортов
    'no-restricted-imports': [
      'error',
      {
        patterns: [
          {
            group: ['../../../*', '../../../../*', '../../../../../*'],
            message: 'FSD Architecture: Используй абсолютные импорты через алиасы (shared/, entities/, app/).',
          },
          {
            group: ['@/*'],
            message: 'FSD Architecture: Используй алиасы без @ (shared/, entities/, app/), не @/shared.',
          },
        ],
      },
    ],
  },
  overrides: [
    // Разрешаем console в инфраструктурном коде
    {
      files: [
        '**/logger.ts',
        '**/sync.ts',
        '**/*ErrorBoundary*.tsx',
        '**/error-handler.ts',
        '**/auth.ts',
        '**/jwt.ts',
        '**/cookies.ts',
        '**/debug.ts',
        '**/main.tsx',
        '**/router.tsx',
        '**/ProtectedRoute*.tsx',
        '**/Layout.tsx',
      ],
      rules: {
        'no-console': 'off',
      },
    },
    // Тестовые файлы
    {
      files: ['**/*.test.ts', '**/*.test.tsx', '**/*.spec.ts', '**/*.spec.tsx'],
      rules: {
        '@typescript-eslint/no-explicit-any': 'off',
        'no-console': 'off',
      },
    },
  ],
};
