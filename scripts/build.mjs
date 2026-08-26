import esbuild from 'esbuild';
import path from 'node:path';

const rootDir = process.cwd();

const alias = {
  '@turnal/protocol': path.join(rootDir, 'packages/protocol/src/index.ts'),
  '@turnal/shared': path.join(rootDir, 'packages/shared/src/index.ts'),
  '@turnal/auth': path.join(rootDir, 'packages/auth/src/index.ts'),
  '@turnal/config': path.join(rootDir, 'packages/config/src/index.ts')
};

const banner = {
  js: `import { createRequire } from 'node:module'; const require = createRequire(import.meta.url);\n`
};

async function buildAll() {
  console.log('⚡ Building Turnal Services with esbuild...');

  // 1. Build API Server
  await esbuild.build({
    entryPoints: ['apps/api/src/main.ts'],
    outfile: 'apps/api/dist/main.mjs',
    bundle: true,
    platform: 'node',
    format: 'esm',
    target: 'node22',
    alias,
    packages: 'external',
    sourcemap: true,
    banner
  });
  console.log('✔ Built apps/api -> apps/api/dist/main.mjs');

  // 2. Build Edge Ingress Server
  await esbuild.build({
    entryPoints: ['apps/edge/src/server.ts'],
    outfile: 'apps/edge/dist/server.mjs',
    bundle: true,
    platform: 'node',
    format: 'esm',
    target: 'node22',
    alias,
    packages: 'external',
    sourcemap: true,
    banner
  });
  console.log('✔ Built apps/edge -> apps/edge/dist/server.mjs');

  // 3. Build Tunnel Agent CLI & Library
  await esbuild.build({
    entryPoints: ['apps/tunnel-agent/ts/src/cli.ts'],
    outfile: 'apps/tunnel-agent/ts/dist/cli.mjs',
    bundle: true,
    platform: 'node',
    format: 'esm',
    target: 'node22',
    alias,
    packages: 'external',
    sourcemap: true,
    banner
  });

  await esbuild.build({
    entryPoints: ['apps/tunnel-agent/ts/src/tunnel-client.ts'],
    outfile: 'apps/tunnel-agent/ts/dist/index.mjs',
    bundle: true,
    platform: 'node',
    format: 'esm',
    target: 'node22',
    alias,
    packages: 'external',
    sourcemap: true,
    banner
  });
  console.log('✔ Built apps/tunnel-agent/ts -> apps/tunnel-agent/ts/dist/cli.mjs & index.mjs');
}

buildAll().catch((err) => {
  console.error('✖ Build failed:', err);
  process.exit(1);
});
