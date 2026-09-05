import path from 'path';
import { defineConfig, loadEnv, Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import express from 'express';
import cookieParser from 'cookie-parser';
import { whatsappRouter } from './lib/whatsappRoutes';

function apiPlugin(): Plugin {
  return {
    name: 'rockyt-api-plugin',
    configureServer(server) {
      const apiApp = express();
      apiApp.use(cookieParser());
      apiApp.use(express.json());
      apiApp.use(whatsappRouter);
      server.middlewares.use(apiApp);
    },
  };
}

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
      },
      plugins: [react(), apiPlugin()],
      define: {
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      }
    };
});
