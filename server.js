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

global.PROJECT_ID = 'combine-fhir-smart-store';
global.LOCATION = 'us-central1';
global.DATASET_ID = 'COMBINE-FHIR-v1';
global.FHIR_STORE_ID = '1';

global.healthcare = google.healthcare('v1');

//  console.log ("healthcare: "+JSON.stringify(healthcare));

global.auth = true;



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

    //check on extension 'capacity' exist
    manageStructureDefinition(auth);

    return { success: true, message: 'Successfully connected to Google Cloud Healthcare API' };
  } catch (error) {
    console.error('Error connecting to Google Cloud Healthcare API:', error);
    return { 
      success: false, 
      error: 'Failed to connect to Google Cloud Healthcare API: ' + error.message 
    };
  }
};

app.get('/avail/api/UpdateSchedule', (req, res) => {
  // Extract the 'id' parameter from the query string
  const id = req.query.id;

  // Log the 'id' to the console
  console.log('Received id:', id);

    // Forward the request to SvelteKit and let it handle rendering
    res.redirect(`/avail/update-schedule?id=${id}`);
});

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
    console.log("allRoles - rolesResponse"+ JSON.stringify(rolesResponse.data, null, 2));

    const rolesData = await handleBlobResponse(rolesResponse.data);

    //console.log ("rolesData"+ JSON.stringify(rolesData, null, 2));
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
        const availability = role.availability || [];
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
          availability: availability,
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

app.put('/avail/api/updateRole', async (req, res) => {
  if (!auth) {
    return res.status(400).json({ error: 'Not connected to Google Cloud. Call /connect first.' });
  }

  try {
    const updatedRole = req.body;

    // Validate that the resource is a PractitionerRole
    if (updatedRole.resourceType !== 'PractitionerRole') {
      console.log('Invalid resourceType:', updatedRole.resourceType);
      return res.status(400).json({ error: 'Invalid resource type. Must be PractitionerRole.' });
    }

    // Ensure the PractitionerRole resource has an ID
    if (!updatedRole.id) {
      console.log('PractitionerRole resource is missing id');
      return res.status(400).json({ error: 'PractitionerRole resource must have an id for updating.' });
    }

    const parent = `projects/${PROJECT_ID}/locations/${LOCATION}/datasets/${DATASET_ID}/fhirStores/${FHIR_STORE_ID}`;
    const name = `${parent}/fhir/PractitionerRole/${updatedRole.id}`;

    console.log(`Attempting to update PractitionerRole with id: ${updatedRole.id}`);
    console.log('Received PractitionerRole data:', JSON.stringify(updatedRole, null, 2));

    // Perform the FHIR update using Google Healthcare API
    const response = await healthcare.projects.locations.datasets.fhirStores.fhir.update({
      name,
      requestBody: updatedRole,
      auth: auth
    });

    // Log the response from the FHIR server
    console.log('FHIR API Response:', JSON.stringify(response.data, null, 2));

    // Check if the update was successful
    if (response.status === 200 || response.status === 201) {
      res.status(200).json({
        message: 'PractitionerRole updated successfully',
        data: response.data
      });
    } else {
      console.log('Unexpected response status:', response.status);
      throw new Error('Failed to update PractitionerRole');
    }

  } catch (error) {
    console.error('Error updating PractitionerRole:', error);
    console.error('Error details:', JSON.stringify(error.response?.data, null, 2));

    res.status(500).json({
      message: 'Failed to update PractitionerRole',
      error: error.message || 'Unknown error occurred',
      details: error.response?.data
    });
  }
});



app.get('/avail/api/GetPractitionersRoles', async (req, res) => {
  if (!auth) {
    return res.status(400).json({ error: 'Not connected to Google Cloud. Call /connect first.' });
  }
  try {
    const { id } = req.query; // Get the Practitioner ID from query parameters
    if (!id) {
      return res.status(400).json({ error: 'Practitioner ID is required.' });
    }
      const parent = `projects/${PROJECT_ID}/locations/${LOCATION}/datasets/${DATASET_ID}/fhirStores/${FHIR_STORE_ID}`;
      const response = await healthcare.projects.locations.datasets.fhirStores.fhir.search({
        parent: parent,
        resourceType: "PractitionerRole", 
        practitioner: id,
 
        auth: auth,
      });

     // console.log("allRoles - rolesResponse"+ JSON.stringify(response.data, null, 2));
      const rolesData = await handleBlobResponse(response.data);

    if (!rolesData.entry || rolesData.entry.length === 0) {
      return res.json({ message: 'No roles found for the given practitioner.', practitionerRoles: [] });
    }

    const practitionerRoles = await Promise.all(rolesData.entry.map(async (entry) => {
      const role = entry.resource;        
        // Fetch Practitioner details
        const practitionerResponse = await healthcare.projects.locations.datasets.fhirStores.fhir.read({
          name: `${parent}/fhir/${role.practitioner.reference}`,
          auth: auth,
        });
        const practitioner = await handleBlobResponse(practitionerResponse.data);
        
        // Fetch Organization details
        const organizationResponse = await healthcare.projects.locations.datasets.fhirStores.fhir.read({
          name: `${parent}/fhir/${role.organization.reference}`,
          auth: auth,
        });
        const organization = await handleBlobResponse(organizationResponse.data);
  
        return {
          id: role.id,
          practitioner: {
            id: practitioner.id,
            name: practitioner.name && practitioner.name[0] ? 
              `${practitioner.name[0].given.join(' ')} ${practitioner.name[0].family}` : 
              'Unknown'
          },
          organization: {
            id: organization.id,
            name: organization.name
          },
          availableTime: role.availableTime || []
        };
      }));

    res.json({ practitionerRoles });
  } catch (error) {
    console.error('Error retrieving practitioner roles:', error);
    res.status(500).json({ error: 'Failed to retrieve practitioner roles' });
  }
});

//Capacity endpoint
//
// Endpoint to update PractitionerRole with Capacity data
app.post('/avail/api/updateCapacity', async (req, res) => {
  if (!auth) {
    return res.status(400).json({ error: 'Not connected to Google Cloud. Call /connect first.' });
  }

  try {
    const { practitionerRoleId, capacityData } = req.body;

    // Validate input
    if (!practitionerRoleId || !capacityData) {
      return res.status(400).json({ error: 'practitionerRoleId and capacityData are required.' });
    }

    // Call the function to update PractitionerRole with Capacity data
    const updatedPractitionerRole = await updatePractitionerRoleWithCapacity(auth, practitionerRoleId, capacityData);

    res.status(200).json({
      message: 'PractitionerRole capacity updated successfully',
      data: updatedPractitionerRole
    });

  } catch (error) {
    console.error('Error updating PractitionerRole capacity:', error);
    res.status(500).json({
      message: 'Failed to update PractitionerRole capacity',
      error: error.message || 'Unknown error occurred'
    });
  }
});


// Capacity 
//
// Function to update PractitionerRole with Capacity data - extension
async function updatePractitionerRoleWithCapacity(auth, practitionerRoleId, capacityData) {
  const parent = `projects/${PROJECT_ID}/locations/${LOCATION}/datasets/${DATASET_ID}/fhirStores/${FHIR_STORE_ID}`;
  const name = `${parent}/fhir/PractitionerRole/${practitionerRoleId}`;

  try {
    // First, get the existing PractitionerRole
    const getResponse = await healthcare.projects.locations.datasets.fhirStores.fhir.read({
      name: name,
      auth: auth
    });

    const practitionerRole = getResponse.data;

    // Add or update the extension
    if (!practitionerRole.extension) {
      practitionerRole.extension = [];
    }

    const capacityExtension = practitionerRole.extension.find(ext => 
      ext.url === "https://combinebh.org/resources/FHIRResources/PractitionerCapacityFHIRExtension.html"
    );

    if (capacityExtension) {
      capacityExtension.extension = capacityData;
    } else {
      practitionerRole.extension.push({
        url: "https://combinebh.org/resources/FHIRResources/PractitionerCapacityFHIRExtension.html",
        extension: capacityData
      });
    }

    // Update the PractitionerRole
    const updateResponse = await healthcare.projects.locations.datasets.fhirStores.fhir.update({
      name: name,
      requestBody: practitionerRole,
      auth: auth
    });

    console.log('PractitionerRole updated successfully:', updateResponse.data);
    return updateResponse.data;
  } catch (error) {
    console.error('Error updating PractitionerRole:', error);
    throw error;
  }
}

app.get('/avail/api/GetCapacity', async (req, res) => {
  if (!auth) {
    return res.status(400).json({ error: 'Not connected to Google Cloud. Call /connect first.' });
  }

  try {
    const { id } = req.query; // Get the PractitionerRole ID from query parameters
    if (!id) {
      return res.status(400).json({ error: 'PractitionerRole ID is required.' });
    }

    const parent = `projects/${PROJECT_ID}/locations/${LOCATION}/datasets/${DATASET_ID}/fhirStores/${FHIR_STORE_ID}`;
    const name = `${parent}/fhir/PractitionerRole/${id}`;

    // Fetch the PractitionerRole resource
    const response = await healthcare.projects.locations.datasets.fhirStores.fhir.read({
      name: name,
      auth: auth
    });

    const practitionerRole = await handleBlobResponse(response.data);

    // Find the capacity extension
    const capacityExtension = practitionerRole.extension?.find(ext => 
      ext.url === "https://combinebh.org/resources/FHIRResources/PractitionerCapacityFHIRExtension.html"
    );

    if (capacityExtension) {
      res.json({ capacity: capacityExtension.extension });
    } else {
      res.json({ capacity: null, message: 'No capacity data found for this PractitionerRole.' });
    }

  } catch (error) {
    console.error('Error retrieving capacity data:', error);
    res.status(500).json({ error: 'Failed to retrieve capacity data', details: error.message });
  }
});

async function manageStructureDefinition(auth) {
 

  const parent = `projects/${PROJECT_ID}/locations/${LOCATION}/datasets/${DATASET_ID}/fhirStores/${FHIR_STORE_ID}`;
  const structureDefinitionUrl = "http://example.com/StructureDefinition/practitioner-capacity";

  try {
    // First, check if the StructureDefinition already exists
    const searchResponse = await healthcare.projects.locations.datasets.fhirStores.fhir.search({
      parent: parent,
      resourceType: 'StructureDefinition',
      auth: auth,
      searchParams: {
        url: structureDefinitionUrl
      }
    });

    const searchResult = await handleBlobResponse(searchResponse.data);

    if (searchResult.entry && searchResult.entry.length > 0) {
      console.log('StructureDefinition already exists:', searchResult.entry[0].resource);
      return searchResult.entry[0].resource;
    }

    // If it doesn't exist, create a new one
    const structureDefinition = {
        "resourceType": "StructureDefinition",
        "url": "https://combinebh.org/resources/FHIRResources/PractitionerCapacityFHIRExtension.html",
        "name": "PractitionerCapacity",
        "status": "draft",
        "fhirVersion": "4.0.1",
        "kind": "complex-type",
        "abstract": false,
        "type": "Extension",
        "baseDefinition": "http://hl7.org/fhir/StructureDefinition/Extension",
        "context": [
          {
            "type": "element",
            "expression": "PractitionerRole"
          }
        ],
        "differential": {
          "element": [
            {
              "id": "Extension",
              "path": "Extension",
              "short": "Practitioner capacity for different patient types"
            },
            {
              "id": "Extension.extension:children",
              "path": "Extension.extension",
              "sliceName": "children",
              "min": 0,
              "max": "1",
              "type": [
                {
                  "code": "Extension"
                }
              ]
            },
            {
              "id": "Extension.extension:children.value[x]",
              "path": "Extension.extension.value[x]",
              "type": [
                {
                  "code": "integer"
                }
              ]
            },
            {
              "id": "Extension.extension:adults",
              "path": "Extension.extension",
              "sliceName": "adults",
              "min": 0,
              "max": "1",
              "type": [
                {
                  "code": "Extension"
                }
              ]
            },
            {
              "id": "Extension.extension:adults.value[x]",
              "path": "Extension.extension.value[x]",
              "type": [
                {
                  "code": "integer"
                }
              ]
            },
            {
              "id": "Extension.extension:teens",
              "path": "Extension.extension",
              "sliceName": "teens",
              "min": 0,
              "max": "1",
              "type": [
                {
                  "code": "Extension"
                }
              ]
            },
            {
              "id": "Extension.extension:teens.value[x]",
              "path": "Extension.extension.value[x]",
              "type": [
                {
                  "code": "integer"
                }
              ]
            },
            {
              "id": "Extension.extension:couples",
              "path": "Extension.extension",
              "sliceName": "couples",
              "min": 0,
              "max": "1",
              "type": [
                {
                  "code": "Extension"
                }
              ]
            },
            {
              "id": "Extension.extension:couples.value[x]",
              "path": "Extension.extension.value[x]",
              "type": [
                {
                  "code": "integer"
                }
              ]
            },
            {
              "id": "Extension.extension:families",
              "path": "Extension.extension",
              "sliceName": "families",
              "min": 0,
              "max": "1",
              "type": [
                {
                  "code": "Extension"
                }
              ]
            },
            {
              "id": "Extension.extension:families.value[x]",
              "path": "Extension.extension.value[x]",
              "type": [
                {
                  "code": "integer"
                }
              ]
            }
          ]
        }
      }

    const createResponse = await healthcare.projects.locations.datasets.fhirStores.fhir.create({
      parent: parent,
      type: 'StructureDefinition',
      requestBody: structureDefinition,
      auth: auth
    });

    console.log('StructureDefinition created successfully:', createResponse.data);
    return createResponse.data;

  } catch (error) {
    console.error('Error managing StructureDefinition:', error);
    throw error;
  }
}


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