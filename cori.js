// server.js
import express from 'express';
import session from 'express-session';
import { OAuth2Client } from 'google-auth-library';
import { handler } from './build/handler.js'; // Import the SvelteKit handler
import http from 'http';
import { createServer } from 'vite';
import cors from 'cors';
import dotenv from 'dotenv';
//import { WebSocketServer } from 'ws';

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

import { BASE_PATH } from './serverutils.js'; // Adjust the path as necessary


dotenv.config(); // Load environment variables
const app = express();
const server = http.createServer(app);
const PORT = 3000;




// Setup Google OAuth2 client
const oauth2Client = new OAuth2Client(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI // Should be your redirect URI
);

/*
// Middleware configuration
app.use(cors({
  origin: process.env.CLIENT_URL, // Ensure this is set in your .env file
  credentials: true
}));
*/

app.use(express.json());
app.use(express.static('public'));

// Session management
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: false, // Set to true in production with HTTPS
    httpOnly: true,
    sameSite: 'lax',
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
  }
}));


app.post(`${BASE_PATH}/api/send-sms`, async (req, res) => {
  const { message, phoneNumber } = req.body;

  if (!message || !phoneNumber) {
    return res.status(400).json({ error: 'Message and phone number are required' });
  }

  try {
    const client = require('twilio')(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
    const result = await client.messages.create({
      body: message,
      messagingServiceSid: process.env.TWILIO_MESSAGING_SERVICE_SID,
      to: phoneNumber
    });
    res.status(200).json({ sid: result.sid });
  } catch (error) {
    console.error('Error sending SMS:', error);
    res.status(500).json({ error: 'Failed to send SMS' });
  }
});

// Google OAuth Routes
app.get(`${BASE_PATH}/auth/google/url`, (req, res) => {
  const redirectUri = `${process.env.CLIENT_URL}${BASE_PATH}/auth/google/callback`; // Ensure this matches your environment
  const url = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: [
      'https://www.googleapis.com/auth/userinfo.profile',
      'https://www.googleapis.com/auth/userinfo.email',
    ],
    redirect_uri: redirectUri,
  });

  console.log('Generated Google Auth URL:', url); // Debugging log
  console.log('redirect URi:', redirectUri); // Debugging log
  res.redirect(url); 
});

app.get(`${BASE_PATH}/auth/google/callback`, async (req, res) => {
  const { code } = req.query;
  try {
    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);

    const userInfo = await oauth2Client.request({
      url: 'https://www.googleapis.com/oauth2/v3/userinfo'
    });

  

    // Store user information in session
    req.session.user = {
      id: userInfo.data.sub,
      email: userInfo.data.email,
      name: userInfo.data.name,
      picture: userInfo.data.picture
    };

    req.session.googleToken = tokens.access_token;

    console.log('User authenticated:', req.session.user);
    let u = `${process.env.CLIENT_URL}${BASE_PATH}`;
    console.log ("redirect to :"+u);
    res.redirect(u); // Redirect after authentication
  } catch (error) {
    console.error('Error during Google authentication:', error);
    res.status(500).send('Authentication failed');
  }
});


app.get(`${BASE_PATH}/auth/user`, async (req, res) => {
  if (req.session.user) {
    const googleToken = req.session.googleToken; // Retrieve the token from the session

    if (googleToken) {
      // Verify the token by making a request to the Google API
      const url = `https://oauth2.googleapis.com/tokeninfo?access_token=${googleToken}`;

      try {
        const response = await fetch(url);
        
        if (!response.ok) {
          // Token is revoked or invalid
          console.log('Token is revoked or invalid, clearing user session.');
          req.session.user = null; // Clear user information from session
          req.session.googleToken = null; // Clear the Google token
          return res.status(401).json({ error: 'Not authenticated' });
        }

        // If token is valid, return user info
        return res.json({ user: req.session.user });
      } catch (error) {
        console.error('Error verifying Google token:', error);
        req.session.user = null; // Clear user information from session
        req.session.googleToken = null; // Clear the Google token
        return res.status(500).json({ error: 'Internal server error' });
      }
    } else {
      // If there's no token, clear user session
      console.log('No Google token found, clearing user session.');
      req.session.user = null; // Clear user information from session
      return res.status(401).json({ error: 'Not authenticated' });
    }
  } else {
    res.status(401).json({ error: 'Not authenticated' });
  }
});


app.post(`${BASE_PATH}/auth/logout`, (req, res) => {
  // End the user's authentication with Google OAuth (e.g., revoke the token)
  const googleToken = req.session.googleToken; // Assuming the token is stored in the session
  if (googleToken) {
    // Revoke the token using Google API
    const url = `https://oauth2.googleapis.com/revoke?token=${googleToken}`;
    
    fetch(url, { method: 'POST' })
      .then(response => {
        if (!response.ok) {
          throw new Error('Failed to revoke Google token');
        }
        
        // Destroy the session after revoking the token
        req.session.destroy(err => {
          if (err) {
            return res.status(500).json({ error: 'Could not log out' });
          }
          res.clearCookie('connect.sid');
          res.json({ success: true });
        });
      })
      .catch(err => {
        console.error(err);
        req.session.destroy(err => {
          if (err) {
            return res.status(500).json({ error: 'Could not log out' });
          }
          res.clearCookie('connect.sid');
          res.json({ success: true, warning: 'Could not revoke Google token, but logged out successfully.' });
        });
      });
  } else {
    // If no Google token, just destroy the session
    req.session.destroy(err => {
      if (err) {
        return res.status(500).json({ error: 'Could not log out' });
      }
      res.clearCookie('connect.sid');
      res.json({ success: true });
    });
  }
});



app.use(`${BASE_PATH}/api/practitioner`, practitionerRoutes);
app.use(`${BASE_PATH}/api/organization`, organizationRoutes);
app.use(`${BASE_PATH}/api/role`, roleRoutes);
app.use(`${BASE_PATH}/api/patient`, patientRoutes);
app.use(`${BASE_PATH}/api/condition`, conditionRoutes);
app.use(`${BASE_PATH}/api/consent`, consentRoutes);
app.use(`${BASE_PATH}/api/goal`, goalRoutes);
app.use(`${BASE_PATH}/api/provenance`, provenanceRoutes);
app.use(`${BASE_PATH}/api/task`, taskRoutes);
app.use(`${BASE_PATH}/api/servicerequest`, serviceRequestRoutes);




// Handle all other requests with the SvelteKit handler
app.use((req, res, next) => {
  handler(req, res, next);
});

// Start the Express server
server.listen(PORT, () => {
  console.log(`Server is running at http://localhost:${PORT}`);
});
