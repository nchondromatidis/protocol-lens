// @ts-check
import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';
import mdx from '@astrojs/mdx';
import starlightThemeNext from 'starlight-theme-next';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';

import react from '@astrojs/react';

import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  integrations: [
    starlight({
      plugins: [starlightThemeNext()],
      title: 'DeFi Notes',
      routeMiddleware: './src/routeData.ts',
      sidebar: [
        { label: 'Uniswap v2', autogenerate: { directory: 'exchanges/uniswap-v2' } },
        { label: 'Uniswap v3', autogenerate: { directory: 'exchanges/uniswap-v3' } },
        { label: 'Cureve', autogenerate: { directory: 'exchanges/curve' } },
      ],
      customCss: ['./src/styles/global.css', './src/styles/custom.css', './node_modules/katex/dist/katex.min.css'],
    }),
    mdx(),
    react(),
  ],
  markdown: {
    remarkPlugins: [remarkMath],
    rehypePlugins: [rehypeKatex],
  },
  vite: {
    plugins: [tailwindcss()],
  },
});
