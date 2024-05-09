import externals from 'rollup-plugin-node-externals';
import { defineConfig } from 'vite';
import { checker } from 'vite-plugin-checker';
import dts from 'vite-plugin-dts';

const TEST_GLOBS = ['**/*.{test|spec}.*', '**/__{tests|mocks}__'];

process.chdir(__dirname);

export default defineConfig({
  plugins: [
    checker({ typescript: true }),
    externals(),
    dts({ entryRoot: 'src', logLevel: 'error', exclude: TEST_GLOBS }),
  ],
  build: {
    target: 'esnext',
    sourcemap: true,
    minify: false,
    lib: {
      entry: 'src/index.ts',
      fileName: '[name]',
      formats: ['es'],
    },
    rollupOptions: {
      treeshake: false,
      output: { preserveModules: true },
    },
  },
  test: {
    reporters: ['verbose'],
    setupFiles: 'vitest.setup.ts',
    coverage: {
      enabled: true,
      all: true,
      reporter: ['html', 'text-summary'],
      include: ['**/src/**/*.?(c|m)[jt]s?(x)'],
      exclude: TEST_GLOBS,
    },
  },
});
