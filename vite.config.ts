import { defineConfig } from 'vite';
import { checker } from 'vite-plugin-checker';

// import { lib } from 'vite-plugin-auto-lib';
// import externals from 'rollup-plugin-node-externals';
// import dts from 'vite-plugin-dts';
// import { data } from 'vite-plugin-data';
// import bin from 'vite-plugin-bin';

const TEST_GLOBS = ['**/*.{test|spec}.*', '**/__{tests|mocks}__'];

process.chdir(__dirname);

export default defineConfig({
  plugins: [
    checker({ typescript: true }),
    // lib(),
    // externals(),
    // dts({ entryRoot: 'src', logLevel: 'error', exclude: TEST_GLOBS }),
    // data(),
    // bin(),
  ],
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
