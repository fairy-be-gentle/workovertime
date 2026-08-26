/**
 * @fileoverview ESLint 配置文件
 *
 * 基于 Google TypeScript Style Guide 和前端最佳实践配置
 * 适用于 SvelteKit + TypeScript 项目
 */

import svelteParser from 'svelte-eslint-parser';
import sveltePlugin from 'eslint-plugin-svelte';
import ts from 'typescript-eslint';
import prettierPlugin from 'eslint-plugin-prettier';
import prettierConfig from 'eslint-config-prettier';

export default [
  // 忽略文件
  {
    ignores: [
      '**/node_modules/**',
      '**/dist/**',
      '**/build/**',
      '**/.svelte-kit/**',
      '**/.data/**',
      '**/package.json',
      '**/tsconfig.json',
      '**/vite.config.ts',
      '**/vitest.config.ts',
      '**/svelte.config.js',
      '**/tailwind.config.*',
      '**/postcss.config.*',
    ],
  },

  // TypeScript-eslint 推荐配置
  ...ts.configs.recommended,

  // Svelte 组件规则
  {
    files: ['**/*.svelte'],
    languageOptions: {
      parser: svelteParser,
      parserOptions: {
        parser: ts.parser,
        extraFileExtensions: ['.svelte'],
      },
    },
    plugins: {
      svelte: sveltePlugin,
    },
    rules: {
      ...sveltePlugin.configs.recommended.rules,
      'svelte/button-has-type': 'off',
      ...sveltePlugin.configs.prettier.rules,
    },
  },

  // 测试文件规则
  {
    files: ['**/*.test.ts', '**/*.test.tsx', '**/*.spec.ts', '**/src/test/**'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-non-null-assertion': 'off',
      '@typescript-eslint/no-unused-vars': 'off',
      '@typescript-eslint/consistent-type-imports': 'off',
      '@typescript-eslint/no-unused-expressions': 'off',
    },
  },

  // JavaScript 基础规则
  {
    files: ['**/*.js', '**/*.mjs'],
    rules: {
      'no-console': ['warn', { allow: ['warn', 'error'] }],
      'no-debugger': 'warn',
    },
  },

  // 自定义规则覆盖
  {
    rules: {
      // 格式化相关（关闭与 prettier 冲突的规则）
      '@typescript-eslint/indent': 'off',
      '@typescript-eslint/member-delimiter-style': 'off',
      '@typescript-eslint/semi': 'off',
      '@typescript-eslint/comma-dangle': 'off',
      '@typescript-eslint/object-curly-spacing': 'off',
      '@typescript-eslint/array-bracket-spacing': 'off',
      '@typescript-eslint/block-spacing': 'off',
      '@typescript-eslint/brace-style': 'off',
      '@typescript-eslint/key-spacing': 'off',
      '@typescript-eslint/keyword-spacing': 'off',
      '@typescript-eslint/no-extra-parens': 'off',
      '@typescript-eslint/quote-props': 'off',
      '@typescript-eslint/quotes': 'off',
      '@typescript-eslint/comma-spacing': 'off',
      '@typescript-eslint/space-before-blocks': 'off',
      '@typescript-eslint/space-before-function-paren': 'off',
      '@typescript-eslint/space-infix-ops': 'off',

      // 禁止使用 any
      '@typescript-eslint/no-explicit-any': 'warn',

      // 禁止非空断言
      '@typescript-eslint/no-non-null-assertion': 'warn',

      // 禁用特定规则
      '@typescript-eslint/no-unused-vars': 'off',
      '@typescript-eslint/no-require-imports': 'error',
      '@typescript-eslint/no-var-requires': 'error',
      '@typescript-eslint/ban-ts-comment': 'warn',
      '@typescript-eslint/no-unused-expressions': 'off',

      // 类的规则
      '@typescript-eslint/no-extraneous-class': 'off',

      // 函数规则
      'max-params': 'off',
      '@typescript-eslint/max-params': ['error', { max: 5 }],
    },
  },

  // Prettier 规则（最后应用）
  {
    rules: {
      ...prettierConfig.rules,
      'prettier/prettier': [
        'error',
        {
          printWidth: 100,
          tabWidth: 2,
          useTabs: false,
          semi: true,
          singleQuote: true,
          quoteProps: 'as-needed',
          trailingComma: 'all',
          bracketSpacing: true,
          arrowParens: 'always',
          endOfLine: 'lf',
        },
      ],
    },
    plugins: {
      prettier: prettierPlugin,
    },
  },
];
