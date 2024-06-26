import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
	plugins: [sveltekit()],
	define: {
		'import.meta.env.BUILD_NUMBER': JSON.stringify(process.env.BUILD_NUMBER),
	},
});
