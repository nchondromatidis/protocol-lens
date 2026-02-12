// @ts-check
import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';
import starlightThemeNext from 'starlight-theme-next';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';

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
      customCss: ['./src/styles/custom.css', './node_modules/katex/dist/katex.min.css'],
    }),
  ],
  markdown: {
    remarkPlugins: [remarkMath],
    rehypePlugins: [rehypeKatex],
  },
});
