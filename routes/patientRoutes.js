import express from 'express';
import { auth, healthcare, PROJECT_ID, LOCATION, DATASET_ID, FHIR_STORE_ID, handleBlobResponse } from '../serverutils.js';
const router = express.Router();

//update generalPractitioner
router.post('/update', async (req, res) => {
    if (!auth) {
      return res.status(400).json({ error: 'Not connected to Google Cloud. Call /connect first.' });
    }
  
    const { id, generalPractitioner } = req.body;

    console.log ("patient/update id:"+id);
    console.log ("patient/update gp:"+JSON.stringify(generalPractitioner));

  
    if (!id || !generalPractitioner) {
      return res.status(400).json({ error: 'Patient ID and generalPractitioner are required.' });
    }
  
    try {
      // Define the FHIR Patient resource URL
      const patientUrl = `projects/${PROJECT_ID}/locations/${LOCATION}/datasets/${DATASET_ID}/fhirStores/${FHIR_STORE_ID}/fhir/Patient/${id}`;
  
      // Fetch the existing patient resource
      const readResponse = await healthcare.projects.locations.datasets.fhirStores.fhir.read({
        name: patientUrl,
        auth: auth,
      });
  

      const patient = await handleBlobResponse(readResponse.data);
    

      console.log ("patient/update URL:"+patientUrl);
      console.log ("patient/update patient:"+JSON.stringify(patient));
  
      // Ensure patient resourceType is 'Patient' (safety check)
      if (patient.resourceType !== 'Patient') {
        return res.status(400).json({ error: 'Resource fetched is not of type Patient.' });
      }
  
      // Update the generalPractitioner field with the new array
      patient.generalPractitioner = generalPractitioner;
  
      // Send the updated patient resource back to the FHIR store
      const updateResponse = await healthcare.projects.locations.datasets.fhirStores.fhir.update({
        name: patientUrl,
        requestBody: patient,
        auth: auth,
      });
  
      // Send a success response with updated patient data
      res.json({ message: 'Patient updated successfully', data: updateResponse.data });
  
    } catch (error) {
      console.error('Error updating patient:', error);
      res.status(500).json({ error: 'Failed to update patient', details: error.message });
    }
  });
  
// Endpoint to get all patients linked to a specific practitioner
router.get('/getPractitionersPatients', async (req, res) => {
  if (!auth) {
    return res.status(400).json({ error: 'Not connected to Google Cloud. Call /connect first.' });
  }

  const { practitionerId } = req.query;

  if (!practitionerId) {
    return res.status(400).json({ error: 'Practitioner ID is required.' });
  }

  try {
    const parent = `projects/${PROJECT_ID}/locations/${LOCATION}/datasets/${DATASET_ID}/fhirStores/${FHIR_STORE_ID}`;
    const searchUrl = `${parent}/fhir/Patient`;

    // Make the search request to the FHIR store
    const response = await healthcare.projects.locations.datasets.fhirStores.fhir.search({
      parent,
      resourceType: 'Patient',
      auth: auth,
      params: {
        'general-practitioner': `Practitioner/${practitionerId}`
      }
    });

    // Handle the response from the FHIR store
    const patients = await handleBlobResponse(response.data);
    res.json(patients);

  } catch (error) {
    console.error('Error fetching patients:', error);
    res.status(500).json({ error: 'Failed to fetch patients', details: error.message });
  }
});



// Add a new Patient
router.post('/add', async (req, res) => {
  if (!auth) {
    return res.status(400).json({ error: 'Not connected to Google Cloud. Call /connect first.' });
  }

  try {
    const patientData = req.body;
    patientData.resourceType = 'Patient'; // Ensure the resourceType is set to Patient
 //   patientData.id = uuidv4(); // Generate a UUID for the patient

    const parent = `projects/${PROJECT_ID}/locations/${LOCATION}/datasets/${DATASET_ID}/fhirStores/${FHIR_STORE_ID}`;
    const response = await healthcare.projects.locations.datasets.fhirStores.fhir.create({
      parent,
      type: 'Patient',
      requestBody: patientData,
      auth: auth,
    });

    res.status(201).json({ message: 'Patient added successfully', data: response.data });
  } catch (error) {
    res.status(500).json({ error: `Failed to add patient: ${error.message}` });
  }
});

// Get all Patients
router.get('/all', async (req, res) => {
    if (!auth) {
      return res.status(400).json({ error: 'Not connected to Google Cloud. Call /connect first.' });
    }
  
    try {
      const parent = `projects/${PROJECT_ID}/locations/${LOCATION}/datasets/${DATASET_ID}/fhirStores/${FHIR_STORE_ID}`;
      const response = await healthcare.projects.locations.datasets.fhirStores.fhir.search({
        parent,
        resourceType: 'Patient',
        auth: auth,
      });
  
      const patients = await handleBlobResponse(response.data);
      res.json(patients);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch patients', details: error.message });
    }
  });

  // Get one Patient by ID
router.get('/:id', async (req, res) => {
    if (!auth) {
      return res.status(400).json({ error: 'Not connected to Google Cloud. Call /connect first.' });
    }
  
    const { id } = req.params;
  
    try {
      const parent = `projects/${PROJECT_ID}/locations/${LOCATION}/datasets/${DATASET_ID}/fhirStores/${FHIR_STORE_ID}/fhir/Patient/${id}`;
      const response = await healthcare.projects.locations.datasets.fhirStores.fhir.read({
        name: parent,
        auth: auth,
      });
  
      const patient = await handleBlobResponse(response.data);
      res.json(patient);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch patient', details: error.message });
    }
  });

  
  export default router;

