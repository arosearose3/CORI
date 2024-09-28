import express from 'express';
import { auth, healthcare, PROJECT_ID, LOCATION, DATASET_ID, FHIR_STORE_ID, handleBlobResponse } from '../serverutils.js';
import axios from 'axios';
import { google } from 'googleapis';  // Assuming you use Google API for authentication
import { getFhirAccessToken } from '../src/lib/auth/auth.js'; // Adjust the path as needed

const router = express.Router();
const FHIR_BASE_URL = `https://healthcare.googleapis.com/v1/projects/${PROJECT_ID}/locations/${LOCATION}/datasets/${DATASET_ID}/fhirStores/${FHIR_STORE_ID}/fhir`;


//
// the challenge here is Update requires the entire PractitionerRole object
// Patch won't but we need to handle multiple possible extension objects.
//
//


// working on PATCH. a JSON Patch  document with a content type of application/json-patch+json
// https://jsonpatch.com/
// patch operations "op" are add, remove, replace, copy, move, test, 
//

// Patch an existing Capacity object, in a known practitionerRole
// This endpoint will take a single PractiionerRole object that has an id. 
// If no Capacity extension object is found, 'add' using patch.

router.patch('/patchCapacity', async (req, res) => {
  console.log ("patch 1");
  const { practitionerRole, capacity } = req.body;

  if (!practitionerRole || !capacity) {
    return res.status(400).json({ error: 'practitionerRole and Capacity object are required.' });
  }
  console.log ("patch 2");
  if (!practitionerRole.id) {
    return res.status(400).json({ error: 'practitionerRole.id is required.' });
  }
  console.log ("patch 3");
  let patchResource;
  console.log ("patch PR:"+JSON.stringify(practitionerRole));
  console.log ("patch capacity:"+JSON.stringify(capacity));
  try {
    // Find the index of the extension with the specific URL
    const extensionIndex = practitionerRole.extension.findIndex(
      (ext) =>
        ext.url === 'https://combinebh.org/resources/FHIRResources/PractitionerCapacityFHIRExtension.html'
    );
    console.log ("patch 4");
    if (extensionIndex === -1) {
      // If the extension is not found, add the new extension
      patchResource = [
        {
          op: 'add',
          path: '/extension/-', // '-' indicates adding to the end of the array
          value: capacity, // New extension object to add
        },
      ];
    } else {
      // If the extension is found, replace it with the new capacity object
      patchResource = [
        {
          op: 'replace',
          path: `/extension/${extensionIndex}`,
          value: capacity, // Replace with the new extension object
        },
      ];
    }

    // Prepare the PATCH request URL and headers
    const PRId = practitionerRole.id;
    const searchUrl = `${FHIR_BASE_URL}/PractitionerRole/${PRId}`;
    const accessToken = await getFhirAccessToken();

    // Perform the PATCH request
    const response = await axios.patch(searchUrl, patchResource, {
      headers: {
        'Content-Type': 'application/json-patch+json',
        Authorization: `Bearer ${accessToken}`,
        Accept: 'application/fhir+json',
      },  
    });
    console.log ("patch 5");
    // Handle the response and send it back
    const responseJ = await handleBlobResponse(response.data);
    res.json(responseJ);
  } catch (error) {
    console.error('Error updating PractitionerRoles:', error.message);
    res.status(500).json({ error: 'Failed to update PractitionerRoles', details: error.message });
  }
});


// Update or create PractitionerRoles
router.post('/updateRoles', async (req, res) => {
  try {
    const { organization, practitioner, roles } = req.body;
    const practitionerId = practitioner.reference.replace('Practitioner/', '');
    const organizationId = organization.reference.replace('Organization/', '');

    if (!practitionerId || !organizationId || !roles || roles.length === 0) {
      return res.status(400).json({ error: 'Practitioner ID, Organization ID, and at least one role are required.' });
    }

    // Construct the PractitionerRole resource payload
    let roleResource = {
      resourceType: 'PractitionerRole',
      practitioner: { reference: `Practitioner/${practitionerId}` },
      organization: { reference: `Organization/${organizationId}` },
      code: roles.map(role => ({
        coding: [{ system: 'https://combinebh.org/cori-value-set/', code: role }],
      })),
      active: true,
    };

    // Get the OAuth2 access token
    const accessToken = await getAccessToken();

    // Find the existing PractitionerRole
    const findResponse = await axios.get(`http://localhost:8080/avail/api/role/findPractitionerRole`, {
      params: { practitioner: `Practitioner/${practitionerId}`, organizationId },
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    const { practitionerRoleId } = await handleBlobResponse(findResponse.data);
    roleResource.id = practitionerRoleId;

    // Update the PractitionerRole
    const updateUrl = getFhirStoreUrl('PractitionerRole', practitionerRoleId);
    const updateResponse = await axios.put(updateUrl, roleResource, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/fhir+json',
      },
    });

    res.status(200).json({ message: 'PractitionerRole updated successfully', data: updateResponse.data });
  } catch (findError) {
    // If not found, create a new PractitionerRole
    if (findError.response && findError.response.status === 404) {
      try {
        const accessToken = await getAccessToken();
        const createUrl = getFhirStoreUrl('PractitionerRole');
        const createResponse = await axios.post(createUrl, roleResource, {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/fhir+json',
          },
        });

        res.status(201).json({ message: 'PractitionerRole created successfully', data: createResponse.data });
      } catch (createError) {
        console.error('Error creating PractitionerRole:', createError.message);
        res.status(500).json({ message: 'Failed to create PractitionerRole', error: createError.message });
      }
    } else {
      console.error('Error finding PractitionerRole:', findError.message);
      res.status(500).json({ message: 'Failed to find PractitionerRole', error: findError.message });
    }
  }
});

// Get all PractitionerRoles
router.get('/all', async (req, res) => {
  try {
    const accessToken = await getAccessToken();
    const url = getFhirStoreUrl('PractitionerRole');
    const response = await axios.get(url, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: 'application/fhir+json',
      },
    });

    const roles = await handleBlobResponse(response.data);
    res.json(roles);
  } catch (error) {
    console.error('Error fetching practitioner roles:', error.message);
    res.status(500).json({ error: 'Failed to fetch practitioner roles', details: error.message });
  }
});

// Update PractitionerRole
router.put('/update', async (req, res) => {
  try {
    const updatedRole = req.body;

    const accessToken = await getFhirAccessToken();
    const searchUrl = `${FHIR_BASE_URL}/PractitionerRole/${updatedRole.id}`;
console.log ("role/update search:"+searchUrl);
console.log ("role/update obj:"+JSON.stringify(updatedRole));

    // Make the request using axios
    const response = await axios.put(searchUrl, updatedRole, {
      headers: {
        Authorization: `Bearer ${accessToken}`, // Use the obtained access token
        'Content-Type': 'application/fhir+json', // Set content type to FHIR-compliant JSON
        Accept: 'application/fhir+json', // Ensure the response is also FHIR-compliant
      },
    });

/*     const response = await axios.put(url, updatedRole, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/fhir+json',
      },
    }); */

    res.status(200).json({ message: 'PractitionerRole updated successfully', data: response.data });
  } catch (error) {
    console.error('Error updating PractitionerRole:', error.message);
    res.status(500).json({ message: 'Failed to update practitioner role', error: error.message });
  }
});

// Get Capacity extension for a PractitionerRole
router.get('/capacity', async (req, res) => {
  try {
    const { id } = req.query;
    if (!id) {
      return res.status(400).json({ error: 'PractitionerRole ID is required.' });
    }

    const url = getFhirStoreUrl('PractitionerRole', id);
    const accessToken = await getAccessToken();

    const response = await axios.get(url, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: 'application/fhir+json',
      },
    });

    const practitionerRole = await handleBlobResponse(response.data);
    const capacityExtension = practitionerRole.extension?.find(ext =>
      ext.url === "https://combinebh.org/resources/FHIRResources/PractitionerCapacityFHIRExtension.html"
    );

    res.json({ capacity: capacityExtension ? capacityExtension.extension : null });
  } catch (error) {
    console.error('Error retrieving capacity data:', error.message);
    res.status(500).json({ error: 'Failed to retrieve capacity data', details: error.message });
  }
});

// Get PractitionerRole resources for a specific Practitioner
router.get('/PractitionerRole', async (req, res) => {
  try {
    const { practitioner } = req.query;
    if (!practitioner) {
      return res.status(400).json({ error: 'Practitioner reference is required.' });
    }

     const searchUrl = `${FHIR_BASE_URL}/PractitionerRole?practitioner=${practitioner}`;
    const accessToken = await getFhirAccessToken();

    const response = await axios.get(searchUrl, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: 'application/fhir+json',
      },
    });

    const practitionerRoles = await handleBlobResponse(response.data);
    res.json(practitionerRoles);
  } catch (error) {
    console.error('Error fetching PractitionerRoles:', error.message);
    res.status(500).json({ error: 'Failed to fetch PractitionerRoles', details: error.message });
  }
});

// Find PractitionerRole by Practitioner and Organization
router.get('/findPractitionerRole', async (req, res) => {
  try {
    const { practitioner, organizationId } = req.query;
    if (!practitioner || !organizationId) {
      return res.status(400).json({ error: 'Practitioner and Organization ID are required.' });
    }

    const url = `${getFhirStoreUrl('PractitionerRole')}?practitioner=${practitioner}`;
    const accessToken = await getAccessToken();

    const response = await axios.get(url, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: 'application/fhir+json',
      },
    });

    const practitionerRoles = await handleBlobResponse(response.data);
    const matchingRole = practitionerRoles.entry?.find(entry => entry.resource.organization?.reference === `Organization/${organizationId}`);

    if (matchingRole) {
      res.json({ practitionerRoleId: matchingRole.resource.id });
    } else {
      res.status(404).json({ message: 'No matching PractitionerRole found for the specified organization.' });
    }
  } catch (error) {
    console.error('Error finding PractitionerRole:', error.message);
    res.status(500).json({ error: 'Failed to find PractitionerRole', details: error.message });
  }
});

export default router;
