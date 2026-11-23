import js from '@eslint/js';
import globals from 'globals';
import tseslint from 'typescript-eslint';
import reactHooks from 'eslint-plugin-react-hooks';
import jsxA11y from 'eslint-plugin-jsx-a11y';
import prettier from 'eslint-config-prettier';

export default tseslint.config(
  { ignores: ['app/dist/**', 'dist/**', 'node_modules/**', '.cache/**'] },
  js.configs.recommended,
  {
    files: ['app/**/*.{ts,tsx}'],
    extends: [
      ...tseslint.configs.recommended,
      reactHooks.configs.flat.recommended,
      jsxA11y.flatConfigs.recommended,
    ],
    languageOptions: { globals: globals.browser },
  },
  {
    files: ['scripts/**/*.mjs', 'tests/**/*.mjs', 'app/vite.config.ts', '*.js'],
    languageOptions: { globals: globals.node },
  },
  {
    files: [
      'app/src/components/PhotoCarousel.tsx',
      'app/src/components/PhotoLightbox.tsx',
      'app/src/components/Timeline.tsx',
    ],
    rules: {
      'jsx-a11y/click-events-have-key-events': 'off',
      'jsx-a11y/no-static-element-interactions': 'off',
      'jsx-a11y/no-noninteractive-element-interactions': 'off',
    },
  },
  { files: ['app/src/components/BasemapPicker.tsx'], rules: { 'jsx-a11y/no-autofocus': 'off' } },
  { files: ['app/src/components/SiteList.tsx'], rules: { 'react-hooks/incompatible-library': 'off' } },
  prettier,
);
