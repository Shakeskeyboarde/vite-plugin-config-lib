# Vite Plugin Config Lib

Vite plugin that configures sane defaults for building libraries.

## Getting Started

Install the plugin:

```sh
npm install vite-plugin-config-lib --save-dev
```

Add the plugin to your `vite.config.js`:

```ts
import { defineConfig } from 'vite';
import { lib } from 'vite-plugin-config-lib';

export default defineConfig({
  plugins: [lib()]
});
```

As long as you have a [common entrypoint](#common-entrypoints) (eg. `src/index.ts`), this should be a working configuration for most libraries. Only [defaults](#config-defaults) are provided, so any configuration by earlier plugins or by the user will be left as-is. For example, if you need to use an entry that is not auto-detected, you can just add it to your configuration normally.

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

- `build.sourcemap`: `true`
- `build.minify`: `false`
- `build.lib.formats`: Auto-detected from the `type` field in the nearest
  `package.json` file.
- `build.lib.fileName`: `'[name]'`
- `build.lib.entry`: Auto-detected at the Vite `root` from a list of common
  entry points.
- `build.rollupOptions.treeshake`: `false`
- `build.rollupOptions.external`: Externalizes NodeJS built-ins, native
  modules, and production dependencies.
- `build.rollupOptions.output.preserveModules`: `true`

Some of the above defaults are generally the only options that make sense for a library. Others are more opinionated, but should probably be correct for most projects.

Source maps are enabled by default. This doesn't hurt anything, and is almost always the correct choice so that consumers can reference them in-place, or use them to generate correct bundle source maps of their own.

Minification is disabled by default. Disabling it avoids some potential issues and provides a better debugging experience for consumers. Minification can be a performance optimization, but that's generally also paired with bundling, which can be done by consumers if necessary.

The lib `fileName` and Rollup `preserveModules` defaults cause the build output files to map 1:1 with build inputs. Bundling is not necessary in a library, and can even be harmful if consumers are treeshaking. This also allows for sub-path exports and generating type definition files adjacent to their corresponding source files. Consumers can always choose to bundle if that's the correct choice for their environment or performance needs.

Externalization is generally necessary with `preserveModules` enabled. A basic externalization default configuration is provided that handles NodeJS built-ins, native modules, and production dependencies. If more advanced externalization support is needed, use the [rollup-plugin-node-externals](https://www.npmjs.com/package/rollup-plugin-node-externals) plugin which will override the default solution.

Tree shaking is disabled by default. It's safe to assume that consumers will do their own treeshaking if necessary. Disabling it also avoids issues related to side effects.

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