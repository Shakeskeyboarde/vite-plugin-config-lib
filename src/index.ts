import fs from 'node:fs/promises';
import module from 'node:module';
import path from 'node:path';

import { type Plugin, type UserConfig } from 'vite';

/**
 * Vite plugin that configures sane defaults for building libraries.
 */
export const lib = (): Plugin => {
  return {
    name: 'vite-plugin-config-lib',
    async config(current) {
      const root = current.root ?? process.cwd();
      const pkg = await getPackage(root);

      Object.assign(current, {
        root,
        build: {
          sourcemap: true,
          ...current.build,
          lib: {
            formats: pkg?.type === 'module' ? ['es'] : ['cjs'],
            fileName: '[name]',
            entry: await getDefaultEntry(root),
            ...current.build?.lib || {},
          },
          rollupOptions: {
            treeshake: false,
            external: getExternal(pkg),
            ...current.build?.rollupOptions,
            output: {
              preserveModules: true,
              ...current.build?.rollupOptions?.output,
            },
          },
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

const getPackage = async (dir: string): Promise<any> => {
  dir = path.resolve(dir);

  try {
    const txt = await fs.readFile(path.join(dir, 'package.json'), 'utf-8');
    const pkg = JSON.parse(txt);

    return pkg;
  }
  catch (error: any) {
    if (error?.code !== 'ENOENT') {
      throw error;
    }

    const nextDir = path.dirname(dir);

    if (nextDir !== dir) {
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
