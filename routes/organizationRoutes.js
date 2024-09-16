import express from 'express';
import { auth, healthcare, PROJECT_ID, LOCATION, DATASET_ID, FHIR_STORE_ID, handleBlobResponse } from '../serverutils.js';

const router = express.Router();


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
router.get('/all', async (req, res) => {
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

    const organizations = await handleBlobResponse(response.data);
    res.json(organizations);
  } catch (error) {
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

  try {
    const parent = `projects/${PROJECT_ID}/locations/${LOCATION}/datasets/${DATASET_ID}/fhirStores/${FHIR_STORE_ID}`;
    const organizationUrl = `${parent}/fhir/Organization/${organizationId}`;

    // Fetch Organization details
    const organizationResponse = await healthcare.projects.locations.datasets.fhirStores.fhir.read({
      name: organizationUrl,
      auth: auth,
    });

    const organization = await handleBlobResponse(organizationResponse.data);
    res.json(organization);
  } catch (error) {
    console.error('Error fetching Organization:', error);
    res.status(500).json({ error: 'Failed to fetch Organization', details: error.message });
  }
});


export default router;
