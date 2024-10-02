// server.js

import express from 'express';
import session from 'express-session';
import { OAuth2Client } from 'google-auth-library';
import { handler } from './build/handler.js';
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

dotenv.config();

const FULL_PATH = '/avail/prod';

const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ server, path: `${FULL_PATH}` });


app.use(cors({ origin: process.env.CLIENT_URL, credentials: true }));
app.use(express.json());

app.use(express.static('public', {
  setHeaders: function(res, path, stat) {
    if (path.endsWith('.js')) {
      res.set('Content-Type', 'application/javascript');
    }
  },
  redirect: false // Disable automatic trailing slash redirect
}));

// Session middleware
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: false, // Set secure cookie in production
    httpOnly: true, // Helps with security
    sameSite: 'lax', // Ensures cookies are sent with cross-site requests
    maxAge: 24 * 60 * 60 * 1000, // Set cookie expiry (24 hours)
  }
}));

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



// OAuth2 client setup with correct redirect URI
const oauth2Client = new OAuth2Client(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI // Should be 'https://elig.pro/avail/prod/auth/google/callback'
);

// Auth check middleware
function checkAuth(req, res, next) {

  console.log('Checking authentication...');
  console.log('Session ID:', req.sessionID); // Log session ID
  console.log('Session data:', req.session); // Log session data

  const openPaths = [
    `${FULL_PATH}/`,
    `${FULL_PATH}/TOS`,
    `${FULL_PATH}/loginroute`,
    `${FULL_PATH}/auth/user`,
    `${FULL_PATH}/auth/google/callback`,
    `${FULL_PATH}/auth/google/url`,
    `${FULL_PATH}/_app`,
    `${FULL_PATH}/assets`,
    `${FULL_PATH}/auth/proxy-image`,
    `${FULL_PATH}/demoflow`,
    `${FULL_PATH}/api`
  ];


    // Check if the request path starts with one of the open paths
    if (openPaths.some(path => req.originalUrl.startsWith(path))) {
         console.log('Skipping auth check for:', req.originalUrl);
          return next(); // Skip auth check for these paths
      }

  // Check if user is authenticated
  if (!req.session || !req.session.user) {
    console.log('server checkAuth User not authenticated');
   // return res.status(401).json({ error: 'Not authenticated' });
    // Alternatively, redirect to login
    return res.redirect(`${FULL_PATH}/auth/google/url`);
   //  return res.redirect(`${FULL_PATH}/loginroute`);
  }

  next();
}

// Apply the auth check middleware
app.use(`${FULL_PATH}`, checkAuth);

// Google OAuth Routes
app.get(`${FULL_PATH}/auth/google/url`, (req, res) => {
  const redirectUri = `${process.env.CLIENT_URL}${FULL_PATH}/auth/google/callback`; // Ensures /prod is included

  const url = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: [
      'https://www.googleapis.com/auth/userinfo.profile',
      'https://www.googleapis.com/auth/userinfo.email',
    ],
    prompt: 'select_account',
    redirect_uri: redirectUri, // Explicitly set redirect_uri
  });

  console.log('Generated Google Auth URL:', url); // Debugging log
  res.redirect(url); 
});

app.get(`${FULL_PATH}/auth/google/callback`, async (req, res) => {
  const { code } = req.query;
  try {
    console.log('Received Google OAuth2 callback with code:', code);

    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);

    const userInfo = await oauth2Client.request({
      url: 'https://www.googleapis.com/oauth2/v3/userinfo'
    });

    req.session.user = {
      id: userInfo.data.sub,
      email: userInfo.data.email,
      name: userInfo.data.name,
      picture: userInfo.data.picture
    };

    console.log('User authenticated:', req.session.user);

    // Explicitly save the session before redirecting
    req.session.save((err) => {
      if (err) {
        console.error('Error saving session:', err);
        return res.status(500).send('Failed to save session');
      }
      console.log ("server google/callback session saved");
      res.redirect(`${FULL_PATH}/`); // Redirect after saving session
    });
  } catch (error) {
    console.error('Error during Google authentication:', error);
    res.status(500).send('Authentication failed');
  }
});

app.get(`${FULL_PATH}/auth/user`, (req, res) => {
  if (req.session.user) {
    res.json({ user: req.session.user });
  } else {
    res.status(401).json({ error: 'Not authenticated' });
  }
});

app.post(`${FULL_PATH}/auth/logout`, (req, res) => {
  req.session.destroy(err => {
    if (err) {
      console.error('Error destroying session during logout:', err);
      return res.status(500).json({ error: 'Could not log out' });
    }
    res.clearCookie('connect.sid', { path: FULL_PATH });
    res.json({ success: true });
  });
});

app.get(`${FULL_PATH}/auth/proxy-image`, async (req, res) => {
  const imageUrl = req.query.url;
  if (!imageUrl) {
    return res.status(400).send('No image URL provided');
  }

  try {
    const response = await fetch(imageUrl);
    if (!response.ok) throw new Error('Failed to fetch image');

    // Buffer the response
    const imageBuffer = await response.arrayBuffer();

    // Set the correct content type and send the image buffer
    res.setHeader('Content-Type', response.headers.get('content-type'));
    res.send(Buffer.from(imageBuffer));
  } catch (error) {
    console.error('Error proxying image:', error);
    res.status(500).send('Error loading image');
  }
});


// Google Cloud Connection
let isConnectedToGoogleCloud = false;

app.post(`${FULL_PATH}/api/connect`, async (req, res) => {
  if (isConnectedToGoogleCloud) {
    return res.status(200).json({ message: 'Already connected to Google Cloud' });
  }

  try {
    const connectionResult = await connectToGoogleCloud();
    if (connectionResult && connectionResult.success) {
      isConnectedToGoogleCloud = true;
      return res.status(200).json({ message: 'Connected to Google Cloud successfully' });
    } else {
      const errorMessage = connectionResult?.error || 'Unknown error occurred';
      return res.status(500).json({ error: errorMessage });
    }
  } catch (error) {
    console.error('Error connecting to Google Cloud:', error);
    return res.status(500).json({ error: 'Failed to connect to Google Cloud' });
  }
});

// API routes
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


/* app.use((req, res, next) => {
  if (!req.url.endsWith('/') && !req.url.includes('.')) {
    res.redirect(301, `${req.url}/`);
  } else {
    next();
  }
}); */
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

// WebSocket handling
wss.on('connection', (ws) => {
  console.log('WebSocket connected');
  ws.on('message', (message) => {
    console.log('Received:', message);
  });
});

/* // Error handling middleware
app.use((err, req, res, next) => {
  console.error('Global Error Handler:', err);
  res.status(500).send('Something went wrong!');
}); */

// Start the server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Full path: ${FULL_PATH}`);
});

export default app;
