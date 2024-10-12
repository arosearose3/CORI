import express, { response } from 'express';
import { auth, healthcare, PROJECT_ID, LOCATION, DATASET_ID, FHIR_STORE_ID, handleBlobResponse } from '../serverutils.js';
import axios from 'axios';
import { google } from 'googleapis';  // Assuming you use Google API for authentication
import { getFhirAccessToken } from '../src/lib/auth/auth.js'; // Adjust the path as needed

import { BASE_PATH } from '../serverutils.js'; // Adjust the path as necessary

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

    const createUrl = `${FHIR_BASE_URL}/Organization`;
    const accessToken = await getFhirAccessToken();

    console.log ("org/add createUrl:"+createUrl);
    console.log ("org/add data:"+JSON.stringify(organizationData));

    const createResponse = await axios.post(createUrl, organizationData, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/fhir+json',
      },
    });

    console.log ("org/add response:"+createResponse.data);
    console.log ("org/add jresponse:"+JSON.stringify(createResponse.data));

    res.status(201).json({ message: 'Organization added successfully', data: createResponse.data });
  }
   catch (error) {
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





// Get the name of an Organization by its reference
router.get('/getOrgName', async (req, res) => {
  if (!auth) {
    return res.status(400).json({ error: 'Not connected to Google Cloud. Call /connect first.' });
  }

  const { reference } = req.query;
  //console.log ("org/getName reference:"+reference);
  // Extract organizationId from the reference, e.g., "Organization/71888285-135a-4eb2-a579-93e3f2e65ea8"
  const organizationId = reference?.split('/')[1];
  if (!organizationId) {
    return res.status(400).json({ error: 'Invalid organization reference. Unable to extract Organization ID.' });
  }
  try {
    const accessToken = await getFhirAccessToken();
    const searchUrl = `${FHIR_BASE_URL}/Organization/${organizationId}`;
    //console.log ("org/getName searchUrl:"+searchUrl);

    // Fetch the Organization details
    const organizationResponse = await axios.get(searchUrl, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: 'application/fhir+json',
      },
    });

    //console.log ("org/getname res:"+JSON.stringify(organizationResponse.data));
    // Extract the organization name from the response
    const organization = organizationResponse.data;
    const orgName = organization.name || 'Unknown Organization';

    res.json(orgName );
  } catch (error) {
    console.error('Error fetching Organization name:', error.message);
    res.status(500).json({ error: 'Failed to fetch Organization name', details: error.message });
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
    const accessToken = await getFhirAccessToken();
    const searchUrl = `${FHIR_BASE_URL}/Organization/${organizationId}`;

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


//get one Organization  
router.delete('/:organizationId', async (req, res) => {
  if (!auth) {
    return res.status(400).json({ error: 'Not connected to Google Cloud. Call /connect first.' });
  }
  const { organizationId } = req.params;
  if (!organizationId) {
    return res.status(400).json({ error: 'Organization ID is required.' });
  }
   console.log ("org/delete orgid:"+organizationId);
  try {
    const accessToken = await getFhirAccessToken();
    const searchUrl = `${FHIR_BASE_URL}/Organization/${organizationId}`;

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
