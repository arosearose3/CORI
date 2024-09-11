import express from 'express';
import { handler } from './build/handler.js';
import { google } from 'googleapis';
import http from 'http';
import { WebSocketServer } from 'ws';
import { GoogleAuth } from 'google-auth-library';
import dotenv from 'dotenv';  
import axios from 'axios';
import { Readable } from 'stream';

dotenv.config();

const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ server, path: '/avail' });

app.use(express.json());

const PROJECT_ID = 'combine-fhir-smart-store';
const LOCATION = 'us-central1';
const DATASET_ID = 'COMBINE-FHIR-v1';
const FHIR_STORE_ID = '1';

const healthcare = google.healthcare('v1');

//  console.log ("healthcare: "+JSON.stringify(healthcare));

let auth;



const connectToGoogleCloud = async () => {
  console.log("in connectToGoogleCloud");
  try {
    if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
      console.log("Using GOOGLE_APPLICATION_CREDENTIALS");
      auth = new GoogleAuth({
        scopes: ['https://www.googleapis.com/auth/cloud-platform']
      });
    } else if (process.env.GOOGLE_SERVICE_ACCOUNT_KEY) {
      console.log("Using GOOGLE_SERVICE_ACCOUNT_KEY");
      let serviceAccountKey;
      try {
        serviceAccountKey = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_KEY);
        console.log("Service account key parsed successfully");
      } catch (parseError) {
        console.error("Error parsing GOOGLE_SERVICE_ACCOUNT_KEY:", parseError);
        return { success: false, error: "Invalid GOOGLE_SERVICE_ACCOUNT_KEY format" };
      }
      
      if (!serviceAccountKey.client_email) {
        console.error("Service account key is missing client_email field");
        return { success: false, error: "Invalid service account key structure" };
      }
      
      auth = new GoogleAuth({
        credentials: serviceAccountKey,
        scopes: ['https://www.googleapis.com/auth/cloud-platform']
      });
    } else {
      return { success: false, error: 'No Google Cloud credentials found' };
    }

    // Get the client
    const client = await auth.getClient();

    // Get the project ID
    const projectId = await auth.getProjectId();

    return { success: true, message: 'Successfully connected to Google Cloud Healthcare API' };
  } catch (error) {
    console.error('Error connecting to Google Cloud Healthcare API:', error);
    return { 
      success: false, 
      error: 'Failed to connect to Google Cloud Healthcare API: ' + error.message 
    };
  }
};



app.post('/avail/api/connect', async (req, res) => {
  const result = await connectToGoogleCloud();
  if (result.success) {
    res.status(200).json({ message: result.message });
  } else {
    res.status(500).json({ error: result.error });
  }
});

app.post('/avail/api/addPractitioner', async (req, res) => {
  if (!auth) {
    return res.status(400).json({ error: 'Not connected to Google Cloud. Call /connect first.' });
  }

  try {
    const practitionerData = req.body;

    // Ensure the resourceType is set to "Practitioner"
    practitionerData.resourceType = "Practitioner";

    // Validate required fields
    if (!practitionerData.name || !practitionerData.name[0].given || !practitionerData.name[0].family) {
      return res.status(400).json({ error: 'Given name and family name are required.' });
    }

    if (!practitionerData.telecom || !practitionerData.telecom[0].value) {
      return res.status(400).json({ error: 'Email is required.' });
    }

    if (!practitionerData.birthDate) {
      return res.status(400).json({ error: 'Birth date is required.' });
    }

    const parent = `projects/${PROJECT_ID}/locations/${LOCATION}/datasets/${DATASET_ID}/fhirStores/${FHIR_STORE_ID}`;

    console.log(`Attempting to create practitioner in: ${parent}`);
    console.log('Practitioner data:', JSON.stringify(practitionerData, null, 2));

    const response = await healthcare.projects.locations.datasets.fhirStores.fhir.create({
      parent,
      type: 'Practitioner',
      requestBody: practitionerData,
      auth: auth
    });

    console.log('API Response:', JSON.stringify(response.data));

    res.status(201).json({
      message: 'Practitioner added successfully',
      data: {
        id: response.data.id || 'ID not provided',
        // You can include other relevant data from the response here
      }
    });

  } catch (error) {
    console.error('Error adding practitioner:', error);
    console.error('Error details:', JSON.stringify(error.response?.data, null, 2));
    res.status(500).json({
      message: 'Failed to add practitioner',
      error: error.message || 'Unknown error occurred',
      details: error.response?.data
    });
  }
});



app.post('/avail/api/addOrganization', async (req, res) => {
  if (!auth) {
    return res.status(400).json({ error: 'Not connected to Google Cloud. Call /connect first.' });
  }

  try {
    const userData = req.body;

    // Map user data to FHIR Organization Resource
    var organizationResource = {};
     organizationResource = {
      resourceType: "Organization",
   //   identifier: userData.identifier,
      active: true,
      type: userData.type,
      name: userData.name,
   //   alias: userData.alias,
   //   description: userData.description,
      contact: [{
        purpose: {
          coding: [{
            system: "http://terminology.hl7.org/CodeSystem/contactentity-type",
            code: "ADMIN"
          }]
        },
        name: {
          text: userData.contact[0].name[0].text
        },
        telecom: [
          {
            system: "phone",
            value: userData.contact[0].telecom[0].value
          },
          {
            system: "email",
            value: userData.contact[0].telecom[1].value
          },
          {
            system: "fax",
            value: userData.contact[0].telecom[2].value
          }
        ],
        address: {
          use: "work",
          type: "both",
          text: userData.contact[0].address.city,
          line: userData.contact[0].address.line,
          city: userData.contact[0].address.city,
          state: userData.contact[0].address.state,
          postalCode: userData.contact[0].address.postalCode,
          country: userData.contact[0].address.country
        }
      }]
    };

    // If period start or end dates are provided, add them to the contact
    if (userData.contact[0].period.start || userData.contact[0].period.end) {
      organizationResource.contact[0].period = {
        start: userData.contact[0].period.start,
        end: userData.contact[0].period.end
      };
    }

    // Send the Organization Resource to the FHIR server
    // Construct the parent string for the Google Healthcare API
    const parent = `projects/${PROJECT_ID}/locations/${LOCATION}/datasets/${DATASET_ID}/fhirStores/${FHIR_STORE_ID}`;

    console.log ("sending:"+ JSON.stringify(organizationResource)); 
    // Send the Organization Resource to the Google FHIR store
    const response = await healthcare.projects.locations.datasets.fhirStores.fhir.create({
      parent,
      type: 'Organization',
      requestBody: organizationResource,
      auth: auth
    });

    res.status(201).json({
      message: 'Organization added successfully',

      data: response.data
    });

  } catch (error) {
    console.error('Error adding organization:', error);
    res.status(500).json({
      message: 'Failed to add organization',
      error: error.message
    });
  }
});

async function handleBlobResponse(responseData) {
  //console.log("in handleBlob");
  //console.log('handleBlob- response type:', typeof responseData);

  if (responseData && responseData[Symbol.toStringTag] === 'Blob') {
   // console.log("it's a blob");
    const buffer = await responseData.arrayBuffer();
    const text = Buffer.from(buffer).toString('utf-8');
    const ret = JSON.parse(text);
    //console.log("ret:", JSON.stringify(ret));
    return ret;
  } else if (typeof responseData === 'object' && responseData !== null) {
    // If it's already an object (but not null), return it as is
    return responseData;
  } else {
    console.error('handleBlob- Unexpected response type:', typeof responseData);
    throw new Error('handle-Blob Unexpected response type');
  }
}

app.get('/avail/api/allPractitioners', async (req, res) => {
  if (!auth) {
    return res.status(400).json({ error: 'Not connected to Google Cloud. Call /connect first.' });
  }

  try {
    const parent = `projects/${PROJECT_ID}/locations/${LOCATION}/datasets/${DATASET_ID}/fhirStores/${FHIR_STORE_ID}`;
    const response = await healthcare.projects.locations.datasets.fhirStores.fhir.search({
      parent,
      resourceType: 'Practitioner',
      auth: auth,
    });

    const jsonData = await handleBlobResponse(response.data);
    //console.log('Practitioners API Response:', JSON.stringify(jsonData, null, 2));

    let practitioners = [];
    if (jsonData && jsonData.entry && Array.isArray(jsonData.entry)) {
      practitioners = jsonData.entry.map(entry => entry.resource);
    } else if (jsonData && jsonData.total === 0) {
      console.log('No practitioners found');
    } else {
      console.error('Unexpected response structure:', jsonData);
    }

    res.json(practitioners);
  } catch (error) {
    console.error('Error fetching practitioners:', error);
    res.status(500).json({ error: 'Failed to fetch practitioners', details: error.message });
  }
});

app.get('/avail/api/allOrganizations', async (req, res) => {
  if (!auth) {
    return res.status(400).json({ error: 'Not connected to Google Cloud. Call /connect first.' });
  }

  try {
    const parent = `projects/${PROJECT_ID}/locations/${LOCATION}/datasets/${DATASET_ID}/fhirStores/${FHIR_STORE_ID}`;
    const response = await healthcare.projects.locations.datasets.fhirStores.fhir.search({
      parent,
      resourceType: 'Organization',
      auth: auth,
    });

    const jsonData = await handleBlobResponse(response.data);
    //console.log('Organizations API Response:', JSON.stringify(jsonData, null, 2));

    let organizations = [];
    if (jsonData && jsonData.entry && Array.isArray(jsonData.entry)) {
      organizations = jsonData.entry.map(entry => entry.resource);
    } else if (jsonData && jsonData.total === 0) {
      console.log('No organizations found');
    } else {
      console.error('Unexpected response structure:', jsonData);
    }

    res.json(organizations);
  } catch (error) {
    console.error('Error fetching organizations:', error);
    res.status(500).json({ error: 'Failed to fetch organizations', details: error.message });
  }
});


app.post('/avail/api/updateRoles', async (req, res) => {
  if (!auth) {
    return res.status(400).json({ error: 'Not connected to Google Cloud. Call /connect first.' });
  }

  try {
    const { practitionerRoles } = req.body;
    const parent = `projects/${PROJECT_ID}/locations/${LOCATION}/datasets/${DATASET_ID}/fhirStores/${FHIR_STORE_ID}`;

    const bundle = {
      resourceType: 'Bundle',
      type: 'transaction',
      entry: practitionerRoles.map(role => ({
        resource: role,
        request: {
          method: 'POST',
          url: 'PractitionerRole'
        }
      }))
    };

    const response = await healthcare.projects.locations.datasets.fhirStores.fhir.executeBundle({
      parent,
      resourceType: 'Bundle',
      auth: auth,
      requestBody: bundle
    });

    res.json({ message: 'Roles updated successfully', data: response.data });
  } catch (error) {
    console.error('Error updating roles:', error);
    res.status(500).json({ error: 'Failed to update roles' });
  }
});



app.get('/avail/api/allRoles', async (req, res) => {
  if (!auth) {
    return res.status(400).json({ error: 'Not connected to Google Cloud. Call /connect first.' });
  }

  try {
    const parent = `projects/${PROJECT_ID}/locations/${LOCATION}/datasets/${DATASET_ID}/fhirStores/${FHIR_STORE_ID}`;
    
    // Fetch PractitionerRole resources
    const rolesResponse = await healthcare.projects.locations.datasets.fhirStores.fhir.search({
      parent,
      resourceType: 'PractitionerRole',
      auth: auth,
    });

    const rolesData = await handleBlobResponse(rolesResponse.data);

    console.log ("rolesData"+ JSON.stringify(rolesData, null, 2));
    let roles = [];
    if (rolesData && rolesData.entry && Array.isArray(rolesData.entry)) {
      roles = await Promise.all(rolesData.entry.map(async (entry) => {
        const role = entry.resource;
        
        // Fetch associated Practitioner
        const practitionerResponse = await healthcare.projects.locations.datasets.fhirStores.fhir.read({
          name: `${parent}/fhir/${role.practitioner.reference}`,
          auth: auth,
        });
        const practitioner = await handleBlobResponse(practitionerResponse.data);

        // Fetch associated Organization
        const organizationResponse = await healthcare.projects.locations.datasets.fhirStores.fhir.read({
          name: `${parent}/fhir/${role.organization.reference}`,
          auth: auth,
        });
        const organization = await handleBlobResponse(organizationResponse.data);

        return {
          id: role.id,
          practitioner: {
            id: practitioner.id,
            name: practitioner.name[0] ? `${practitioner.name[0].given.join(' ')} ${practitioner.name[0].family}` : 'Unknown',
          },
          organization: {
            id: organization.id,
            name: organization.name,
          },
        };
      }));
    } else if (rolesData && rolesData.total === 0) {
      console.log('No roles found');
    } else {
      console.error('Unexpected response structure:', rolesData);
    }

    res.json(roles);
  } catch (error) {
    console.error('Error fetching roles:', error);
    res.status(500).json({ error: 'Failed to fetch roles', details: error.message });
  }
});




app.use(handler);

wss.on('connection', (ws) => {
  console.log('WebSocket connected');
  ws.on('message', (message) => {
    console.log('Received:', message);
  });
});


const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

export default app;