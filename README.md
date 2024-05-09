# Vite Plugin Auto Lib

Vite plugin that configures sane defaults for building libraries.

## Getting Started

Install the plugin:

```sh
npm install vite-plugin-auto-lib --save-dev
```

Add the plugin to your `vite.config.js`:

```ts
import { defineConfig } from 'vite';
import { lib } from 'vite-plugin-auto-lib';

export default defineConfig({
  plugins: [lib()]
});
```

As long as you have a [common entrypoint](#common-entrypoints) (eg. `src/index.ts`), this should be a working configuration for most libraries.

Only [defaults](#config-defaults) are provided, so any configuration set by earlier plugins or by the user will be left as-is.

```ts
export default defineConfig({
  plugins: [lib()],
  // Override the auto-detected lib entry.
  build: {
    lib: {
      entry: 'src/foo.ts',
    }
  }
});
```

## Common Entrypoints

The plugin will auto detect entrypoints with the following prefixes and extensions:

- Prefixes: `index`, `bin`, `main`, `src/index`, `src/bin`, `src/main`
- Extensions: `.ts`, `.tsx`, `.mts`, `.cts`, `.js`, `.jsx`, `.mjs`, `.cjs`

Multiple entrypoints can be detected. However, if the same prefix exists with multiple extensions, only one will be detected as an entrypoint. The extensions are listed in order of priority, with the highest priority first. Therefore, if `index.ts` and `index.tsx` both exist, then `index.ts` will be detected.

## Config Defaults

- `build.target`: `'esnext'`
- `build.sourcemap`: `true`
- `build.lib.formats`: Auto-detected from the `type` field in the nearest
  `package.json` file.
- `build.lib.fileName`: `'[name]'`
- `build.lib.entry`: Auto-detected at the Vite `root` from a list of common
  entry points.
- `build.rollupOptions.treeshake`: `false`
- `build.rollupOptions.external`: Externalizes NodeJS built-ins, native
  modules, and production dependencies.
- `build.rollupOptions.output.preserveModules`: `true`

## Recommended Supplemental Plugins

- [vite-plugin-checker](https://www.npmjs.com/package/vite-plugin-checker)
  - Type checking.
- [vite-plugin-dts](https://www.npmjs.com/package/vite-plugin-dts)
  - Type declarations.
- [vite-plugin-bin](https://www.npmjs.com/package/vite-plugin-bin)
  - Bin script helper.
- [vite-plugin-data](https://www.npmjs.com/package/vite-plugin-data)
  - Build-time data injection.
- [rollup-plugin-node-externals](https://www.npmjs.com/package/rollup-plugin-node-externals)
  - More complete and configurable externalization.