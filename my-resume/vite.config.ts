import { defineConfig } from 'vite';

// カスタムドメイン(ari-show.com)配信のため base はルート
export default defineConfig({
  base: '/',
  server: { host: true, port: 3000 },
  build: { outDir: 'dist' },
});
