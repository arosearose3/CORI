import express from 'express';
import { auth, healthcare, PROJECT_ID, LOCATION, DATASET_ID, FHIR_STORE_ID, handleBlobResponse } from '../serverutils.js';
import axios from 'axios';
import { google } from 'googleapis';  // Assuming you use Google API for authentication
import { getFhirAccessToken } from '../src/lib/auth/auth.js'; // Adjust the path as needed

const router = express.Router();
const FHIR_BASE_URL = `https://healthcare.googleapis.com/v1/projects/${PROJECT_ID}/locations/${LOCATION}/datasets/${DATASET_ID}/fhirStores/${FHIR_STORE_ID}/fhir`;

router.get('/findWithEmail', async (req, res) => {
  const { email } = req.query;
  if (!email) {
    return res.status(400).json({ error: 'Email is required.' });
  }
  try {
    // Construct the FHIR search URL with the correct telecom query parameter format
    const accessToken = await getFhirAccessToken();
    const searchUrl = `${FHIR_BASE_URL}/Practitioner?telecom=${email}`;

    // Make the request using axios
    const response = await axios.get(searchUrl, {
      headers: {
        Authorization: `Bearer ${accessToken}`, // Use the getAccessToken function
        Accept: 'application/fhir+json', // Ensure the request is FHIR-compliant
      },
    });

    const practitioners = await handleBlobResponse(response.data);
    // Check if practitioners were found
    if (practitioners.entry && practitioners.entry.length > 0) {
      return res.json(practitioners.entry.map((practitioner) => practitioner.resource));
    } else {
      return res.status(404).json({ message: 'No practitioner found with the provided email.' });
    }
  } catch (error) {
    console.error('Error fetching Practitioner by email:', error);
    return res.status(500).json({ error: 'Failed to fetch Practitioner', details: error.message });
  }
});



// Add a new Practitioner
router.post('/add', async (req, res) => {
  if (!auth) {
    return res.status(400).json({ error: 'Not connected to Google Cloud. Call /connect first.' });
  }

  try {
    const practitionerData = req.body;
    practitionerData.resourceType = 'Practitioner'; // Ensure resourceType is set

    const parent = `projects/${PROJECT_ID}/locations/${LOCATION}/datasets/${DATASET_ID}/fhirStores/${FHIR_STORE_ID}`;

    const response = await healthcare.projects.locations.datasets.fhirStores.fhir.create({
      parent,
      type: 'Practitioner',
      requestBody: practitionerData,
      auth: auth,
    });

    res.status(201).json({ message: 'Practitioner added successfully', data: response.data });
  } catch (error) {
    res.status(500).json({ message: 'Failed to add practitioner', error: error.message });
  }
});

// Get all Practitioners
router.get('/all', async (req, res) => {
  if (!auth) {
    return res.status(400).json({ error: 'Not connected to Google Cloud. Call /connect first.' });
  }

  try {
    const accessToken = await getFhirAccessToken();
    const searchUrl = `${FHIR_BASE_URL}/Practitioner`;



    const response = await axios.get(searchUrl, {
      headers: {
        Authorization: `Bearer ${accessToken}`, // Use the getAccessToken function
        Accept: 'application/fhir+json', // Ensure the request is FHIR-compliant
      },
    });

    const practitioners = await handleBlobResponse(response.data);
   // console.log('Fetched all practitioners:', JSON.stringify(practitioners));
    res.json(practitioners);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch practitioners', details: error.message });
  }
});

// Delete a Practitioner by ID
router.delete('/delete/:id', async (req, res) => {
    if (!auth) {
      return res.status(400).json({ error: 'Not connected to Google Cloud. Call /connect first.' });
    }
  
    const practitionerId = req.params.id;
    
    try {
      const name = `projects/${PROJECT_ID}/locations/${LOCATION}/datasets/${DATASET_ID}/fhirStores/${FHIR_STORE_ID}/fhir/Practitioner/${practitionerId}`;
  
      await healthcare.projects.locations.datasets.fhirStores.fhir.delete({
        name: name,
        auth: auth,
      });
  
      res.status(200).json({ message: `Practitioner with ID ${practitionerId} deleted successfully` });
    } catch (error) {
      res.status(500).json({ message: 'Failed to delete practitioner', error: error.message });
    }
  });


  // Get all Practitioner Roles for a specific Practitioner ID
router.get('/practitioner/:practitionerId/role', async (req, res) => {
  if (!auth) {
    return res.status(400).json({ error: 'Not connected to Google Cloud. Call /connect first.' });
  }

  const practitionerId = req.params.practitionerId;

  try {
    const parent = `projects/${PROJECT_ID}/locations/${LOCATION}/datasets/${DATASET_ID}/fhirStores/${FHIR_STORE_ID}`;

    // Search PractitionerRole by the practitioner reference ID
    const response = await healthcare.projects.locations.datasets.fhirStores.fhir.search({
      parent,
      resourceType: 'PractitionerRole',
      auth: auth,
      params: {
        'practitioner': `Practitioner/${practitionerId}`, // Filter by practitioner reference
      },
    });

    const practitionerRoles = await handleBlobResponse(response.data);
    res.json(practitionerRoles);
  } catch (error) {
    res.status(500).json({ error: `Failed to fetch roles for practitioner ${practitionerId}`, details: error.message });
  }
});


//Get One Practitioner
router.get('/:practitionerId', async (req, res) => {
  if (!auth) {
    return res.status(400).json({ error: 'Not connected to Google Cloud. Call /connect first.' });
  }

  const { practitionerId } = req.params;

  if (!practitionerId) {
    return res.status(400).json({ error: 'Practitioner ID is required.' });
  }

  try {

    const searchUrl = `${FHIR_BASE_URL}/Practitioner?practitioner=${practitionerId}`;
    const accessToken = await getFhirAccessToken();

    // Fetch Practitioner details
 /*   const practitionerResponse = await healthcare.projects.locations.datasets.fhirStores.fhir.read({
      name: practitionerUrl,
      auth: auth,
    }); */

    const practitionerResponse = await axios.get(searchUrl, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: 'application/fhir+json',
      },
    });

    const practitioner = await handleBlobResponse(practitionerResponse.data);
    res.json(practitioner);
  } catch (error) {
    console.error('Error fetching Practitioner:', error);
    res.status(500).json({ error: 'Failed to fetch Practitioner', details: error.message });
  }
});

export default router;
