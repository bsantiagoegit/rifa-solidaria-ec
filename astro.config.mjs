// @ts-check
import vercel from '@astrojs/vercel/serverless';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'astro/config';

// https://astro.build/config
export default defineConfig({
	output: 'server', // Habilitar renderizado del lado del servidor
	vite: {
		plugins: [tailwindcss()],
	},
	adapter: vercel({}),
});
