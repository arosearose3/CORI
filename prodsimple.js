// server.js

import express from 'express';
import { handler } from './build/handler.js'; // Import the SvelteKit handler
import http from 'http';
import { createServer } from 'vite';
import cors from 'cors';


const app = express();
const PORT = 3000;

// Serve static files from the 'public' directory
app.use(express.static('public'));

// Create a Vite server for SvelteKit
const vite = await createServer({
  server: {
    middlewareMode: true // Enable middleware mode for Vite
  }
});

// Use Vite's connect instance as middleware
app.use(vite.middlewares);


app.use(cors({
    origin: process.env.CLIENT_URL, // Ensure this is set in your .env file
    credentials: true
  }));

app.use(express.json());

// Handle all other requests with the SvelteKit handler
app.use((req, res, next) => {
  handler(req, res, next);
});

// Start the Express server
app.listen(PORT, () => {
  console.log(`Server is running at http://localhost:${PORT}`);
});
