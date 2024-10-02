import express from 'express';
import session from 'express-session'; // Add session handling
import { OAuth2Client } from 'google-auth-library'; // Add Google OAuth client
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
import cors from 'cors'; // Add CORS support

dotenv.config();

// Initialize Express and HTTP server
const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ server, path: '/avail' });

app.use(cors({ origin: process.env.CLIENT_URL, credentials: true })); // Enable CORS for client
app.use(express.json());
app.use(express.static('public', {
    setHeaders: function(res, path, stat) {
      if (path.endsWith('.js')) {
        res.set('Content-Type', 'application/javascript');
      }
    }
  }));

// Add session support
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: { secure: process.env.NODE_ENV === 'production' }
}));

// Google OAuth2 client
const oauth2Client = new OAuth2Client(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI
);

function checkAuth(req, res, next) {
    // Log request path and original URL for debugging
  
    console.log('in serv3/CheckAuth URL:', req.originalUrl);

    // Define open paths that should bypass the auth check
    const openPaths = [
        '/avail/loginroute', 
        '/avail/auth/user',
        '/avail/auth/google/callback', 
        '/avail/auth/google/url',
        '/_app', // SvelteKit static files path
        '/favicon.ico',
        '/avail/_app', // Add any other static asset paths that need to be excluded
        '/avail/assets', // If you serve assets under a specific directory, add it here
        '/avail/android-chrome-192x192.png',
        '/avail/favicon-32x32.png',
        '/avail/site.webmanifest',
        '/avail/favicon-16x16.png',
        '/avail/auth/proxy-image',
        '/avail/demoflow',
        '/avail/api'
    ];

    // Check if the request path starts with one of the open paths
    if (openPaths.some(path => req.originalUrl.startsWith(path))) {
    //   console.log('Skipping auth check for:', req.originalUrl);
        return next(); // Skip auth check for these paths
    }

    // Check if the user is authenticated
    if (!req.session || !req.session.user) {
        console.log('User not authenticated');
  //      return res.redirect('/avail/loginroute'); // Redirect to login if not authenticated
    }

    next(); // Continue if authenticated
}


app.use((err, req, res, next) => {
  console.error('Global Error Handler:', err);
  res.status(500).send('Something went wrong!');
});

app.use((req, res, next) => {
  // Log HTTP method and URL
  console.log('--- Incoming Request ---');
  console.log(`Method: ${req.method}`);
  console.log(`URL: ${req.url}`);
  console.log(`Path: ${req.path}`);
  console.log(`Protocol: ${req.protocol}`);
  console.log(`Hostname: ${req.hostname}`);
  console.log(`IP: ${req.ip}`);

  // Log headers
  console.log('--- Headers ---');
  console.log(req.headers);

  // Log query parameters
  console.log('--- Query Parameters ---');
  console.log(req.query);

  // Log route parameters (if any)
  console.log('--- Route Parameters ---');
  console.log(req.params);

  // Log cookies (requires cookie-parser middleware)
  if (req.cookies) {
    console.log('--- Cookies ---');
    console.log(req.cookies);
  }

  // Log body (requires body-parser middleware)
  console.log('--- Body ---');
  console.log(req.body);

  // Log additional request properties
  console.log('--- Additional Info ---');
  console.log(`Base URL: ${req.baseUrl}`);
  console.log(`Original URL: ${req.originalUrl}`);
  console.log(`XHR Request: ${req.xhr ? 'Yes' : 'No'}`);

  // Proceed to the next middleware or route handler
  next();
});



// Apply the middleware to the /avail route
app.use('/avail', checkAuth);

// Google OAuth Routes
app.get('/avail/auth/google/url', (req, res) => {
  const url = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: ['https://www.googleapis.com/auth/userinfo.profile', 'https://www.googleapis.com/auth/userinfo.email'],
    prompt: 'select_account'
  });
  res.json({ url });
});

app.get('/avail/auth/google/callback', async (req, res) => {
  const { code } = req.query;
  try {
    // Exchange the authorization code for tokens
    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);

    // Fetch user information from Google
    const userInfo = await oauth2Client.request({
      url: 'https://www.googleapis.com/oauth2/v3/userinfo'
    });

    // Save user info in the session
    req.session.user = {
      id: userInfo.data.sub,
      email: userInfo.data.email,
      name: userInfo.data.name,
      picture: userInfo.data.picture
    };

    // Redirect back to the main page after successful login
    res.redirect('/avail'); // Change this path to the correct route in your app
  } catch (error) {
    console.error('Error during Google authentication:', error);
    res.status(500).send('Authentication failed');
  }
});

app.get('/avail/auth/user', (req, res) => {
  if (req.session.user) {
    res.json({ user: req.session.user });
  } else {
    res.status(401).json({ error: 'Not authenticated' });
  }
});

app.post('/avail/auth/logout', (req, res) => {
  req.session.destroy(err => {
    if (err) {
      return res.status(500).json({ error: 'Could not log out' });
    }
    res.clearCookie('connect.sid');
    res.json({ success: true });
  });
});

// Proxy image fetch for Google user images
// Proxy image fetch for Google user images
app.get('/avail/auth/proxy-image', async (req, res) => {
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
  
let isConnectedToGoogleCloud = false;

// API to connect to Google Cloud
app.post('/avail/api/connect', async (req, res) => {
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

// Set up API routes
app.use('/avail/api/practitioner', practitionerRoutes);
app.use('/avail/api/organization', organizationRoutes);
app.use('/avail/api/role', roleRoutes);
app.use('/avail/api/patient', patientRoutes);
app.use('/avail/api/condition', conditionRoutes);
app.use('/avail/api/consent', consentRoutes);
app.use('/avail/api/goal', goalRoutes);
app.use('/avail/api/provenance', provenanceRoutes);
app.use('/avail/api/task', taskRoutes);
app.use('/avail/api/servicerequest', serviceRequestRoutes);


app.use((req, res, next) => {
  console.log(`serv3 before handler Request received at: ${req.url}`);
  console.log('Request Path:', req.originalUrl);
  next();
});

// Default handler for other Svelte routes
app.use(handler);

// WebSocket handling
wss.on('connection', (ws) => {
  console.log('WebSocket connected');
  ws.on('message', (message) => {
    console.log('Received:', message);
  });
});

// Start the server
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

export default app;
