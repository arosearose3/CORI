import express from 'express';
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

dotenv.config();

// Initialize Express and HTTP server
const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ server, path: '/avail' });

app.use(express.json());

// Middleware to check authentication
function checkAuth(req, res, next) {
  if (!req.session || !req.session.user) {
    return res.redirect('/login'); // Redirect to login page if not authenticated
  }
  next();
}

// Apply the middleware to the /avail route
app.use('/avail', checkAuth); 

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
app.use('/avail/api/serviceRequest', serviceRequestRoutes);

// Default handler for other routes
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
