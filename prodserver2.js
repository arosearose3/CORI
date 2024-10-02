// server.js

import express from 'express';
import { handler } from './build/handler.js'; // SvelteKit handler
import http from 'http';

const FULL_PATH = '/avail/prod';

const app = express();
const server = http.createServer(app);

// Uncomment for detailed logging
app.use((req, res, next) => {
  console.log('Incoming request:');
  console.log('  Method:', req.method);
  console.log('  URL:', req.url);
  console.log('  Original URL:', req.originalUrl);
  console.log('  Base URL:', req.baseUrl);
  console.log('  Path:', req.path);
  next();
});

// Mount the SvelteKit handler under the base path
app.use(FULL_PATH, (req, res, next) => {
  console.log('SvelteKit handler - Forwarding request for URL:', req.url);

  // Listen for the 'finish' event on the response object
  res.on('finish', () => {
    console.log('SvelteKit handler successfully processed the request for URL:', req.url);
  });

  try {
    handler(req, res, next);
  } catch (err) {
    console.error('SvelteKit encountered an error:', err);
    res.status(500).send('An internal server error occurred.');
  }
});

// Start the server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Full path: ${FULL_PATH}`);
});

export default app;
