// svelte.config.js
import adapter from '@sveltejs/adapter-node';
import * as dotenv from 'dotenv';

// Load the correct .env file based on environment
const runtimeEnv = process.env.NODE_ENV === 'production' ? '.env.prod' : '.env';
dotenv.config({ path: runtimeEnv });

/** @type {import('@sveltejs/kit').Config} */
const config = {
  kit: {
    adapter: adapter(),
    paths: {
      base: process.env.RUNTIME_ENV === 'prod' ? '/avail/prod' : '/avail/dev'
    },

    prerender: {
      handleHttpError: 'warn'
    }
  },
};

export default config;
