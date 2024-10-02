// server.js

import express from 'express';
import session from 'express-session';
import { OAuth2Client } from 'google-auth-library';
import { handler } from './build/handler.js'; // Ensure the build exists
import { connectToGoogleCloud } from './serverutils.js';

import practitionerRoutes from './routes/practitionerRoutes.js';
import organizationRoutes from './routes/organizationRoutes.js';
import roleRoutes from './routes/roleRoutes.js';
import patientRoutes from './routes/patientRoutes.js';
import conditionRoutes from './routes/conditionRoutes.js';
import consentRoutes from './routes/consentRoutes.js';
import goalRoutes from './routes/goalRoutes.js';
import provenanceRoutes from './routes/provenanceRoutes.js';
import serviceRequestRoutes from './routes/serviceRequestRoutes.js';
import taskRoutes from './routes/taskRoutes.js';

import { WebSocketServer } from 'ws';
import http from 'http';
import dotenv from 'dotenv';
import cors from 'cors';
import { createServer } from 'vite';

dotenv.config();

const FULL_PATH = '/avail/prod';
const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ server, path: `${FULL_PATH}` });

// Setup CORS and middleware
app.use(cors({ origin: process.env.CLIENT_URL, credentials: true }));
app.use(express.json());
app.use(express.static('public'));

// Session middleware
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: false,
    httpOnly: true,
    sameSite: 'lax',
    maxAge: 24 * 60 * 60 * 1000,
  }
}));

// Uncomment for detailed logging
app.use((req, res, next) => {
  console.log('Incoming request:', req.method, req.url);
  next();
});

// OAuth2 client setup
const oauth2Client = new OAuth2Client(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI
);

// Auth check middleware
function checkAuth(req, res, next) {
  // Authentication logic here
}

// Apply the auth check middleware
app.use(`${FULL_PATH}`, checkAuth);

// Google OAuth Routes
app.get(`${FULL_PATH}/auth/google/url`, (req, res) => {
  // Google auth URL logic
});

// Other route handlers
app.use(`${FULL_PATH}/api/practitioner`, practitionerRoutes);
app.use(`${FULL_PATH}/api/organization`, organizationRoutes);
app.use(`${FULL_PATH}/api/role`, roleRoutes);
app.use(`${FULL_PATH}/api/patient`, patientRoutes);
app.use(`${FULL_PATH}/api/condition`, conditionRoutes);
app.use(`${FULL_PATH}/api/consent`, consentRoutes);
app.use(`${FULL_PATH}/api/goal`, goalRoutes);
app.use(`${FULL_PATH}/api/provenance`, provenanceRoutes);
app.use(`${FULL_PATH}/api/task`, taskRoutes);
app.use(`${FULL_PATH}/api/servicerequest`, serviceRequestRoutes);

// Create a Vite server for SvelteKit
const vite = await createServer({
  server: {
    middlewareMode: 'html' // Set to 'html' for HTML responses
  }
});

// Use Vite's middleware for development
app.use(vite.middlewares);

// Mount the SvelteKit handler
app.use(FULL_PATH, (req, res, next) => {
  console.log('SvelteKit handler - Forwarding request for URL:', req.url);
  
  handler(req, res, next);
});

// WebSocket handling
wss.on('connection', (ws) => {
  console.log('WebSocket connected');
});

// Start the server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Full path: ${FULL_PATH}`);
});

export default app;
