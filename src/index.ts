import fs from 'node:fs/promises';
import module from 'node:module';
import path from 'node:path';

import { type LibraryOptions, type Plugin, type Rollup, type UserConfig } from 'vite';

interface Options {
  /**
   * Shortcut for overriding the default `build.lib.entry` auto-detection.
   *
   * Auto detection uses any (all) of the following files that exist:
   * - `index.*`
   * - `bin.*`
   * - `main.*`
   * - `src/index.*`
   * - `src/bin.*`
   * - `src/main.*`
   *
   * Where the extension (`.*`) is one of the following:
   *
   * - `.ts`
   * - `.tsx`
   * - `.mts`
   * - `.cts`
   * - `.js`
   * - `.jsx`
   * - `.mjs`
   * - `.cjs`
   */
  entry?: string | string[];
  /**
   * Shortcut for `build.target`. This only performs syntax transforms and does
   * not include polyfills.
   *
   * Defaults to `esnext` which only performs minimal transpiling for
   * minification compatibility.
   *
   * If only NodeJS is targeted (all strings start with `node`), then
   * `resolve.conditions` is also defaulted to include `node`.
   */
  target?: string | string[] | false;
  /**
   * When true, multiple input files may be combined into fewer output files,
   * and input file names and paths will not be preserved in the output
   * directory.
   *
   * When false, each input file will map to a single output file, with the
   * same relative base path and name. The extension may change to reflect
   * transpilation.
   *
   * Defaults to false.
   */
  bundle?: boolean;
  /**
   * Shortcut for `build.rollupOptions.external`. Can be an array of strings
   * and regular expressions, a function, or one of the following presets:
   * `auto`, `node`, or `none`.
   *
   * - `none`: Nothing is external.
   * - `node`: Only Node built-ins are external.
   * - `auto`: Node built-ins and production dependencies are external.
   *
   * The default is `node` if the `bundle` option is true. Otherwise, the
   * default is `auto`.
   *
   * **NOTE:** It is strongly recommended to use the `auto` preset (default)
   * when bundle is true. Otherwise, the output directory may contain a
   * `node_modules` directory structure.
   */
  external?: Exclude<Rollup.ExternalOption, string | RegExp> | 'none' | 'node' | 'auto';
}

/**
 * Vite plugin that configures sane defaults for building libraries.
 */
export const lib = ({
  target: targetOverride = 'esnext',
  entry,
  bundle = false,
  external = bundle ? 'node' : 'auto',
}: Options = {}): Plugin => {
  return {
    name: 'vite-plugin-config-lib',
    async config(current) {
      const root = current.root ?? process.cwd();
      const target = current.build?.target ?? targetOverride;
      const isNodeTarget = (Array.isArray(target) ? target : [target])
        .every((value) => value && /^node/iu.test(value));
      const libPartial: Partial<LibraryOptions> = current.build?.lib || {};
      const pkg = await getPackage(root);

      Object.assign(current, {
        root,
        build: {
          sourcemap: true,
          minify: false,
          ...current.build,
          target,
          lib: {
            formats: pkg?.type === 'module' ? ['es'] : ['cjs'],
            fileName: '[name]',
            entry: entry ?? await getDefaultEntry(root),
            ...libPartial,
          },
          rollupOptions: {
            treeshake: false,
            external: external === 'none'
              ? undefined
              : external === 'node'
                ? module.isBuiltin
                : external === 'auto'
                  ? getExternal(pkg)
                  : external,
            ...current.build?.rollupOptions,
            output: {
              preserveModules: !bundle,
              ...current.build?.rollupOptions?.output,
            },
          },
        },
        resolve: {
          conditions: isNodeTarget ? ['node'] : undefined,
          ...current.resolve,
        },
      } satisfies UserConfig);
    },
  };
};

export default lib;

const ENTRY_PREFIXES = ['index', 'bin', 'main', 'src/index', 'src/bin', 'src/main'];
const ENTRY_EXTENSIONS = ['ts', 'tsx', 'mts', 'cts', 'js', 'jsx', 'mjs', 'cjs'];
const ENTRY_PATHS = ENTRY_PREFIXES.flatMap((prefix) => ENTRY_EXTENSIONS.map((ext) => `${prefix}.${ext}`));

const getDefaultEntry = async (root: string): Promise<string[]> => {
  const results = await Promise.allSettled(ENTRY_PATHS.map(async (entry) => {
    const filename = path.resolve(root, entry);

    await fs.access(filename);

    return filename;
  }));

  const entry = results
    .filter((result): result is PromiseFulfilledResult<string> => result.status === 'fulfilled')
    .map((result) => result.value);

  if (entry.length === 0) {
    throw new Error('lib entry is required');
  }

  return entry;
};

const getPackage = async (root: string): Promise<any> => {
  root = path.resolve(root);

  try {
    const txt = await fs.readFile(path.join(root, 'package.json'), 'utf-8');
    const pkg = JSON.parse(txt);

    return pkg;
  }
  catch (error: any) {
    if (error?.code !== 'ENOENT') {
      throw error;
    }

    const nextDir = path.dirname(root);

    if (nextDir !== root) {
      return await getPackage(nextDir);
    }
  }

  return {};
};

const getExternal = (pkg: any): (id: string) => boolean | void => {
  const deps = Array.from(new Set([
    ...Object.keys(pkg?.dependencies ?? {}),
    ...Object.keys(pkg?.peerDependencies ?? {}),
    ...Object.keys(pkg?.optionalDependencies ?? {}),
  ]));

  return (id) => {
    if (module.isBuiltin(id)) {
      // Node built-ins are external.
      return true;
    }

    if (path.isAbsolute(id) || /^\.{1,2}\//u.test(id)) {
      // ID is an absolute path or relative path.
      if (/\.node(?:\?|$)/u.test(id)) {
        // Node native modules are external.
        return true;
      }
    }
    else if (deps.some((dep) => dep === id || id.startsWith(`${dep}/`))) {
      // Package production dependencies are external.
      return true;
    }
  };
};
