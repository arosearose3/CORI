import express from 'express';
import { auth, healthcare, PROJECT_ID, LOCATION, DATASET_ID, FHIR_STORE_ID, handleBlobResponse } from '../serverutils.js';
import axios from 'axios';
import { google } from 'googleapis';  // Assuming you use Google API for authentication
import { getFhirAccessToken } from '../src/lib/auth/auth.js'; // Adjust the path as needed

const router = express.Router();

const FHIR_BASE_URL = `https://healthcare.googleapis.com/v1/projects/${PROJECT_ID}/locations/${LOCATION}/datasets/${DATASET_ID}/fhirStores/${FHIR_STORE_ID}/fhir`;



// Add a new Organization
router.post('/add', async (req, res) => {
  if (!auth) {
    return res.status(400).json({ error: 'Not connected to Google Cloud. Call /connect first.' });
  }

  try {
    const organizationData = req.body;
    organizationData.resourceType = 'Organization';

    console.log ("org/add data:"+JSON.stringify(organizationData));

    const parent = `projects/${PROJECT_ID}/locations/${LOCATION}/datasets/${DATASET_ID}/fhirStores/${FHIR_STORE_ID}`;

    const response = await healthcare.projects.locations.datasets.fhirStores.fhir.create({
      parent,
      type: 'Organization',
      requestBody: organizationData,
      auth: auth,
    });

    res.status(201).json({ message: 'Organization added successfully', data: response.data });
  } catch (error) {
    res.status(500).json({ message: 'Failed to add organization', error: error.message });
  }
});

// Get all Organizations
async function extractOrganizations(url, accessToken) {
  let organizations = [];
  let nextPageUrl = url;

  while (nextPageUrl) {
    const response = await axios.get(nextPageUrl, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: 'application/fhir+json',
      },
    });

    const bundle = response.data;

    if (!bundle || bundle.resourceType !== 'Bundle' || !Array.isArray(bundle.entry)) {
      throw new Error('Invalid FHIR Bundle format');
    }

    // Extract Organizations
    const pageOrganizations = bundle.entry
      .map(entry => entry.resource)
      .filter(resource => resource.resourceType === 'Organization');
    
    organizations = organizations.concat(pageOrganizations);

    // Find the 'next' link for pagination
    const nextLink = bundle.link.find(link => link.relation === 'next');
    nextPageUrl = nextLink ? nextLink.url : null;
  }

  return organizations;
}

// Updated /all endpoint to handle pagination
router.get('/all', async (req, res) => {
  // ... (authentication and initial setup)

  try {
    // Initial URL
    const url = `https://healthcare.googleapis.com/v1/projects/${PROJECT_ID}/locations/${LOCATION}/datasets/${DATASET_ID}/fhirStores/${FHIR_STORE_ID}/fhir/Organization`;

    // Retrieve the access token
    const accessToken = await getFhirAccessToken();

    if (!accessToken) {
      return res.status(401).json({ error: 'Authentication failed. Unable to retrieve access token.' });
    }

    console.log("Fetching organizations from:", url);

    // Extract all Organizations handling pagination
    const organizations = await extractOrganizations(url, accessToken);
    console.log("Successfully fetched organizations");

    res.json(organizations);
  } catch (error) {
    console.error('Error fetching organizations:', error.response ? error.response.data : error.message);
    res.status(500).json({ error: 'Failed to fetch organizations', details: error.message });
  }
});



//get one Organization  
router.get('/:organizationId', async (req, res) => {
  if (!auth) {
    return res.status(400).json({ error: 'Not connected to Google Cloud. Call /connect first.' });
  }

  const { organizationId } = req.params;

  if (!organizationId) {
    return res.status(400).json({ error: 'Organization ID is required.' });
  }

   console.log ("org/getone orgid:"+organizationId);
  try {
   // const parent = `projects/${PROJECT_ID}/locations/${LOCATION}/datasets/${DATASET_ID}/fhirStores/${FHIR_STORE_ID}`;
   // const organizationUrl = `${parent}/fhir/Organization/${organizationId}`;

    const accessToken = await getFhirAccessToken();
    const searchUrl = `${FHIR_BASE_URL}/Organization/${organizationId}`;


    // Fetch Organization details
 /*    const organizationResponse = await healthcare.projects.locations.datasets.fhirStores.fhir.read({
      name: organizationUrl,
      auth: auth,
    }); */

    const organizationResponse = await axios.get(searchUrl, {
      headers: {
        Authorization: `Bearer ${accessToken}`, // Use the getAccessToken function
        Accept: 'application/fhir+json', // Ensure the request is FHIR-compliant
      },
    });

    const organization = await handleBlobResponse(organizationResponse.data);
    res.json(organization);
  } catch (error) {
    console.error('Error fetching Organization:', error);
    res.status(500).json({ error: 'Failed to fetch Organization', details: error.message });
  }
});


export default router;
