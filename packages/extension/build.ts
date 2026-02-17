import * as esbuild from 'esbuild';
import { existsSync, mkdirSync } from 'fs';

const watch = process.argv.includes('--watch');
const outdir = 'dist';

if (!existsSync(outdir)) {
  mkdirSync(outdir, { recursive: true });
}

const entryPoints = [
  'src/background/service-worker.ts',
  'src/content-scripts/generic-injector.ts',
  'src/content-scripts/claude-ai.ts',
  'src/content-scripts/chatgpt.ts',
  'src/content-scripts/gemini.ts',
  'src/content-scripts/perplexity.ts',
  'src/health-check/selector-tester.ts',
  'src/popup/popup.ts',
];

// Filter to only existing entry points
const existingEntries = entryPoints.filter(ep => {
  try {
    return existsSync(ep);
  } catch {
    return false;
  }
});

async function build() {
  const buildOptions: esbuild.BuildOptions = {
    entryPoints: existingEntries,
    bundle: true,
    outdir,
    format: 'esm',
    platform: 'browser',
    target: 'chrome120',
    sourcemap: true,
    // Inline @aro/shared since extensions can't do node_modules resolution
    external: [],
    define: {
      'process.env.NODE_ENV': '"production"',
    },
  };

  if (watch) {
    const ctx = await esbuild.context(buildOptions);
    await ctx.watch();
    console.log('Watching for changes...');
  } else {
    await esbuild.build(buildOptions);
    console.log('Extension built successfully');
  }
}

build().catch((err) => {
  console.error(err);
  process.exit(1);
});
