// svelte.config.js
import adapter from '@sveltejs/adapter-node';


/** @type {import('@sveltejs/kit').Config} */
const config = {
  kit: {
    adapter: adapter(),
    paths: {
      base: '/avail'
    },
    prerender: {
      handleHttpError: 'warn'
    }
  },

};

export default config;
