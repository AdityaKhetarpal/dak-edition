import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://dak-edition.vercel.app',
  output: 'static',
  trailingSlash: 'ignore',
  build: { format: 'directory' },
});
