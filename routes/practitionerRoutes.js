import express from 'express';
import { auth, healthcare, PROJECT_ID, LOCATION, DATASET_ID, FHIR_STORE_ID, handleBlobResponse } from '../serverutils.js';

const router = express.Router();





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
    const parent = `projects/${PROJECT_ID}/locations/${LOCATION}/datasets/${DATASET_ID}/fhirStores/${FHIR_STORE_ID}`;
    const response = await healthcare.projects.locations.datasets.fhirStores.fhir.search({
      parent,
      resourceType: 'Practitioner',
      auth: auth,
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
    const parent = `projects/${PROJECT_ID}/locations/${LOCATION}/datasets/${DATASET_ID}/fhirStores/${FHIR_STORE_ID}`;
    const practitionerUrl = `${parent}/fhir/Practitioner/${practitionerId}`;

    // Fetch Practitioner details
    const practitionerResponse = await healthcare.projects.locations.datasets.fhirStores.fhir.read({
      name: practitionerUrl,
      auth: auth,
    });

    const practitioner = await handleBlobResponse(practitionerResponse.data);
    res.json(practitioner);
  } catch (error) {
    console.error('Error fetching Practitioner:', error);
    res.status(500).json({ error: 'Failed to fetch Practitioner', details: error.message });
  }
});

export default router;
