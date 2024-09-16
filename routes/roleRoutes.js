import express from 'express';
import { auth, healthcare, PROJECT_ID, LOCATION, DATASET_ID, FHIR_STORE_ID, handleBlobResponse } from '../serverutils.js';
import axios from 'axios';



const router = express.Router();

// Get all Practitioner Roles
router.get('/all', async (req, res) => {
  if (!auth) {
    return res.status(400).json({ error: 'Not connected to Google Cloud. Call /connect first.' });
  }

  try {
    const parent = `projects/${PROJECT_ID}/locations/${LOCATION}/datasets/${DATASET_ID}/fhirStores/${FHIR_STORE_ID}`;
    const response = await healthcare.projects.locations.datasets.fhirStores.fhir.search({
      parent,
      resourceType: 'PractitionerRole',
      auth: auth,
    });

    const roles = await handleBlobResponse(response.data);
    res.json(roles);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch practitioner roles', details: error.message });
  }
});

// Update a PractitionerRole
router.put('/update', async (req, res) => {
  if (!auth) {
    return res.status(400).json({ error: 'Not connected to Google Cloud. Call /connect first.' });
  }

  try {
    const updatedRole = req.body;

    const parent = `projects/${PROJECT_ID}/locations/${LOCATION}/datasets/${DATASET_ID}/fhirStores/${FHIR_STORE_ID}`;
    const name = `${parent}/fhir/PractitionerRole/${updatedRole.id}`;

    const response = await healthcare.projects.locations.datasets.fhirStores.fhir.update({
      name,
      requestBody: updatedRole,
      auth: auth,
    });

    res.status(200).json({ message: 'PractitionerRole updated successfully', data: response.data });
  } catch (error) {
    res.status(500).json({ message: 'Failed to update practitioner role', error: error.message });
  }
});


// Get Capacity extension for a PractitionerRole
router.get('/capacity', async (req, res) => {
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
        auth: auth,
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

  // Get all PractitionerRole resources for a specific Practitioner
  // uses http get rather than .search because google is returning all the Roles, and not filtering for provider id
  
router.get('/PractitionerRole', async (req, res) => {
    if (!auth) {
      return res.status(400).json({ error: 'Not connected to Google Cloud. Call /connect first.' });
    }
  
    const { practitioner } = req.query; // Extract the practitioner reference from the query parameter
  
    if (!practitioner) {
      return res.status(400).json({ error: 'Practitioner reference is required.' });
    }
  
    try {
      const url = `https://healthcare.googleapis.com/v1/projects/${PROJECT_ID}/locations/${LOCATION}/datasets/${DATASET_ID}/fhirStores/${FHIR_STORE_ID}/fhir/PractitionerRole?practitioner=${practitioner}`;
  
      console.log("Requesting URL: ", url);
  
      // Make the HTTP GET request using axios
      const response = await axios.get(url, {
        headers: {
          Authorization: `Bearer ${await auth.getAccessToken()}`, // Ensure the token is included in the header
        }
      });
  
      // Handle and process the response
      const practitionerRoles = await handleBlobResponse(response.data);
      res.json(practitionerRoles);
    } catch (error) {
      console.error('Error fetching PractitionerRoles:', error.response ? error.response.data : error.message);
      res.status(500).json({ error: 'Failed to fetch PractitionerRoles', details: error.message });
    }
  });
  

export default router;
