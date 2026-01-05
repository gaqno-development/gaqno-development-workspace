import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import federation from '@originjs/vite-plugin-federation'
import path from 'path'

export default defineConfig(async () => {
	const tailwindcss = (await import('@tailwindcss/vite')).default
	
	return {
	base: '/',
	server: {
		port: 3007,
		origin: 'http://localhost:3007',
		fs: {
			allow: ['.', '../shared'],
		},
	},
	resolve: {
		alias: {
			'@': path.resolve(__dirname, './src'),
		},
	},
	plugins: [
		react(),
		tailwindcss(),
		federation({
			name: 'rpg',
			filename: 'remoteEntry.js',
			exposes: {
				'./App': './src/App.tsx',
			},
			shared: {
				react: {
					singleton: true,
					requiredVersion: '^18.0.0',
					eager: true,
				},
				'react-dom': {
					singleton: true,
					requiredVersion: '^18.0.0',
					eager: true,
				},
				'react-router-dom': {
					singleton: true,
					requiredVersion: '^6.0.0',
				},
				'@tanstack/react-query': {
					singleton: true,
					requiredVersion: '^5.0.0',
				},
				zustand: {
					singleton: true,
					requiredVersion: '^4.0.0',
				},
				'socket.io-client': {
					singleton: true,
					requiredVersion: '^4.7.0',
				},
			} as any,
		}),
	],
	build: {
		modulePreload: false,
		target: 'esnext',
		minify: false,
		cssCodeSplit: false,
		rollupOptions: {
			external: [],
		},
	},
	}
})

