import express from 'express';
import { auth, healthcare, PROJECT_ID, LOCATION, DATASET_ID, FHIR_STORE_ID, handleBlobResponse } from '../serverutils.js';
import axios from 'axios';
import { google } from 'googleapis';  // Assuming you use Google API for authentication
import { getFhirAccessToken } from '../src/lib/auth/auth.js'; // Adjust the path as needed

import { BASE_PATH } from '../serverutils.js'; // Adjust the path as necessary

const base = BASE_PATH;
const router = express.Router();
const FHIR_BASE_URL = `https://healthcare.googleapis.com/v1/projects/${PROJECT_ID}/locations/${LOCATION}/datasets/${DATASET_ID}/fhirStores/${FHIR_STORE_ID}/fhir`;


//find all PractionerRole resources for a single Org

router.get('/withOrganization', async (req, res) => {
  try {
    const { organizationId } = req.query;

    // Validate that the Organization ID is provided
    if (!organizationId) {
      return res.status(400).json({ error: 'Organization ID is required.' });
    }

    // Get the OAuth2 access token
    const accessToken = await getFhirAccessToken();

    // Construct the search URL for PractitionerRoles with the specific organization
    const searchUrl = `${FHIR_BASE_URL}/PractitionerRole?organization=Organization/${organizationId}`;

    console.log ("role/withOrg searchUrl:"+searchUrl);

    // Make the GET request to fetch the PractitionerRoles
    const response = await axios.get(searchUrl, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: 'application/fhir+json', // Ensure the response is FHIR-compliant JSON
      },
    });

    // Handle the response and return the FHIR Bundle
    const practitionerRoles = response.data;
    res.status(200).json(practitionerRoles);

  } catch (error) {
    console.error('Error fetching PractitionerRoles with Organization:', error.message);
    res.status(500).json({ error: 'Failed to fetch PractitionerRoles', details: error.message });
  }
});


//-------------------------------------------------
// Update PractitionerRole
router.put('/update', async (req, res) => {
  console.log ("role/update init");
  
    const updatedRole = req.body;
    const accessToken = await getFhirAccessToken();
    const searchUrl = `${FHIR_BASE_URL}/PractitionerRole/${updatedRole.id}`;
console.log ("role/update search:"+searchUrl);
console.log ("role/update obj:"+JSON.stringify(updatedRole));

try {
    // Make the request using axios
    const response = await axios.put(searchUrl, updatedRole, {
      headers: {
        Authorization: `Bearer ${accessToken}`, // Use the obtained access token
        'Content-Type': 'application/fhir+json', // Set content type to FHIR-compliant JSON
        Accept: 'application/fhir+json', // Ensure the response is also FHIR-compliant
      },
    });


    // Return the full updated PractitionerRole
    res.status(200).json(response.data); // Ensure you're returning the full updated resource
  } catch (error) {
    console.error('Error updating PractitionerRole:', error.message);
    res.status(500).json({ message: 'Failed to update practitioner role', error: error.message });
  }
});


router.patch('/patchAvailability', async (req, res) => {
  console.log("patchAvailability 1");
  const { practitionerRole, availableTime } = req.body;

  // Validate that the required data is provided
  if (!practitionerRole || !availableTime) {
    return res.status(400).json({ error: 'PractitionerRole and availableTime object are required.' });
  }
  console.log("patchAvailability 2");

  if (!practitionerRole.id) {
    return res.status(400).json({ error: 'PractitionerRole.id is required.' });
  }
  console.log("patchAvailability 3");

  let patchResource;
  console.log("patchAvailability PR:" + JSON.stringify(practitionerRole));
  console.log("patchAvailability availableTime:" + JSON.stringify(availableTime));

  try {
    // Check if availableTime already exists
    const hasAvailableTime = Array.isArray(practitionerRole.availableTime) && practitionerRole.availableTime.length > 0;
    console.log("patchAvailability 4");

    if (!hasAvailableTime) {
      // If availableTime does not exist, add it as a new element
      patchResource = [
        {
          op: 'add',
          path: '/availableTime', // Add availableTime as a new field
          value: availableTime, // The availableTime object to add
        },
      ];
    } else {
      // If availableTime exists, replace it with the provided availableTime object
      patchResource = [
        {
          op: 'replace',
          path: '/availableTime',
          value: availableTime, // Replace the existing availableTime with the new data
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
    console.log("patchAvailability 5");

    // Handle the response and send it back
    const responseJ = await handleBlobResponse(response.data);
    res.json(responseJ);
  } catch (error) {
    console.error('Error updating PractitionerRoles:', error.message);
    res.status(500).json({ error: 'Failed to update PractitionerRoles', details: error.message });
  }
});


router.patch('/patchCapacity', async (req, res) => {
  // 9/29/24 pulled PATCH as it does not work if there is no extension, no completely
  // replacing the PractitionerRole resource with the appended or replaced Capacity
  // 
  const { practitionerRole, capacity } = req.body;
  if (!practitionerRole || !capacity) {
    return res.status(400).json({ error: 'practitionerRole and Capacity object are required.' });
  }
  if (!practitionerRole.id) {
    return res.status(400).json({ error: 'practitionerRole.id is required.' });
  }

  let patchResource;
  console.log ("patch PR:"+JSON.stringify(practitionerRole));
  console.log ("patch capacity:"+JSON.stringify(capacity));
  try {

    if (!practitionerRole.extension) {
      practitionerRole.extension = [];  // Initialize if it's undefined
    }
    // Find the index of the extension with the specific URL
    const extensionIndex = practitionerRole.extension?.findIndex(
      (ext) =>
        ext.url === 'https://combinebh.org/resources/FHIRResources/PractitionerCapacityFHIRExtension.html'
    ) ?? -1;

    if (extensionIndex === -1) {
      practitionerRole.extension.push(capacity);
    } else {
      practitionerRole.extension[extensionIndex] = capacity;
    }
    
    // Proceed with PUT request to replace the entire resource
    const updateResponse = await fetch(`${base}/api/role/update`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(practitionerRole)
    });


    // Check if the PUT request was successful
    if (!updateResponse.ok) {
      throw new Error('Failed to update PractitionerRole.');
    }

    // Parse the response from the `/update` endpoint
    const updatedPractitionerRole = await updateResponse.json();
    
    // Return the updated PractitionerRole to the client
    res.status(200).json({
      message: 'PractitionerRole capacity updated successfully',
      data: updatedPractitionerRole
    });

  } catch (error) {
    console.error('patchcap/Error updating PractitionerRole:', error.message);
    res.status(500).json({
      error: 'patchcap/Failed to update PractitionerRole',
      details: error.message
    });
  }
});


// pathRoles expects a Practitioner and Organization, and will create a new PractitionerRole if there isn't one, with roles.
// if there is one, it will add or replace roles. 

router.patch('/patchRoles', async (req, res) => {
  try {
    const { organization, practitioner, roles } = req.body;
    const practitionerId = practitioner.reference.replace('Practitioner/', '');
    const organizationId = organization.reference.replace('Organization/', '');

    if (!practitionerId || !organizationId || !Array.isArray(roles)) {
      return res.status(400).json({ error: 'Practitioner ID, Organization ID, and roles are required.' });
    }

    // Get the OAuth2 access token
    const accessToken = await getFhirAccessToken();

    // Find the existing PractitionerRole
    let practitionerRoleId;
    try {
      const findResponse = await axios.get(`http://localhost:8080/avail/api/role/findPractitionerRole`, {
        params: { practitioner: `Practitioner/${practitionerId}`, organizationId },
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      const { practitionerRoleId: foundRoleId } = await handleBlobResponse(findResponse.data);
      practitionerRoleId = foundRoleId;
    } catch (findError) {
      // If not found, handle it in the next block
      if (!findError.response || findError.response.status !== 404) {
        console.error('Error finding PractitionerRole:', findError.message);
        return res.status(500).json({ message: 'Failed to find PractitionerRole', error: findError.message });
      }
    }

 // If the PractitionerRole exists, attempt to patch it
if (practitionerRoleId) {
  try {
    const patchResource = [
      // First attempt to replace the /code path
      {
        op: 'replace',
        path: '/code',
        value: roles.map(role => ({
          coding: [{ system: 'https://combinebh.org/cori-value-set/', code: role }],
        })),
      },
      // Fallback to add the /code path if replace fails
      {
        op: 'add',
        path: '/code',
        value: roles.map(role => ({
          coding: [{ system: 'https://combinebh.org/cori-value-set/', code: role }],
        })),
      },
    ];

    const patchUrl = `${FHIR_BASE_URL}/PractitionerRole/${practitionerRoleId}`;
    const accessToken = await getFhirAccessToken();

    const patchResponse = await axios.patch(patchUrl, patchResource, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json-patch+json',
        Accept: 'application/fhir+json',
      },
    });

    return res.status(200).json({ message: 'PractitionerRole patched successfully', data: patchResponse.data });
  } catch (patchError) {
    console.error('Error patching PractitionerRole:', patchError.message);
    return res.status(500).json({ message: 'Failed to patch PractitionerRole', error: patchError.message });
  }
}

    // If no existing PractitionerRole is found, create a new one
    const createRoleResource = {
      resourceType: 'PractitionerRole',
      practitioner: { reference: `Practitioner/${practitionerId}` },
      organization: { reference: `Organization/${organizationId}` },
      code: roles.map(role => ({
        coding: [{ system: 'https://combinebh.org/cori-value-set/', code: role }],
      })),
      active: true,
    };

    try {

    
      const createUrl = `${FHIR_BASE_URL}/PractitionerRole`;
      const accessToken = await getFhirAccessToken();


      
      const createResponse = await axios.post(createUrl, createRoleResource, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/fhir+json',
        },
      });

      return res.status(201).json({ message: 'PractitionerRole created successfully', data: createResponse.data });
    } catch (createError) {
      console.error('Error creating PractitionerRole:', createError.message);
      return res.status(500).json({ message: 'Failed to create PractitionerRole', error: createError.message });
    }
  } catch (error) {
    console.error('Error processing request:', error.message);
    res.status(500).json({ message: 'An error occurred while processing the request.', error: error.message });
  }
});


// Get all PractitionerRoles
router.get('/all', async (req, res) => {
  try {
 

    const url = `${FHIR_BASE_URL}/PractitionerRole`;
    const accessToken = await getFhirAccessToken();

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

    const url = `${FHIR_BASE_URL}/PractitionerRole?practitioner=${practitioner}`;
    const accessToken = await getFhirAccessToken();


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

// Get a specific PractitionerRole by its ID
router.get('/getOne', async (req, res) => {
  try {
    const { id } = req.query; // Get the PractitionerRole ID from the query parameters
    if (!id) {
      return res.status(400).json({ error: 'PractitionerRole ID is required.' });
    }

    // Construct the FHIR API URL using the provided PractitionerRole ID
    const url = `${FHIR_BASE_URL}/PractitionerRole/${id}`;
    const accessToken = await getFhirAccessToken();

    // Make a GET request to fetch the PractitionerRole from the FHIR server
    const response = await axios.get(url, {
      headers: {
        Authorization: `Bearer ${accessToken}`, // Pass the access token in the request headers
        Accept: 'application/fhir+json', // Set the appropriate headers to receive a FHIR-compliant JSON response
      },
    });

    // Handle the response and parse the JSON data
    const practitionerRole = await handleBlobResponse(response.data);

    // Send the retrieved PractitionerRole object back to the client
    res.status(200).json(practitionerRole);
  } catch (error) {
    console.error('Error fetching PractitionerRole:', error.message);
    res.status(500).json({ error: 'Failed to fetch PractitionerRole', details: error.message });
  }
});

// Create a new PractitionerRole with a PractitionerId and an OrganizationId
router.post('/create', async (req, res) => {
  try {
    const { practitionerId, organizationId } = req.body; // Extract the practitioner and organization IDs from the request body

    // Validate that the required IDs are provided
    if (!practitionerId || !organizationId) {
      return res.status(400).json({ error: 'Practitioner ID and Organization ID are required.' });
    }

    // Construct the PractitionerRole resource
    const practitionerRoleResource = {
      resourceType: 'PractitionerRole',
      practitioner: { reference: `Practitioner/${practitionerId}` },
      organization: { reference: `Organization/${organizationId}` },
      active: true,
    };

    // Get the OAuth2 access token
    const accessToken = await getFhirAccessToken();

    // Define the FHIR API URL for creating the PractitionerRole
    const createUrl = `${FHIR_BASE_URL}/PractitionerRole`;

    // Log the creation request details for debugging
    console.log('Creating PractitionerRole:', JSON.stringify(practitionerRoleResource));
    
    // Send a POST request to create the PractitionerRole resource on the FHIR server
    const createResponse = await axios.post(createUrl, practitionerRoleResource, {
      headers: {
        Authorization: `Bearer ${accessToken}`, // Include the access token in the request headers
        'Content-Type': 'application/fhir+json', // Specify that the request body is FHIR-compliant JSON
        Accept: 'application/fhir+json', // Expect a FHIR-compliant JSON response
      },
    });

    // Handle the response and send back the created PractitionerRole resource
    res.status(201).json({ message: 'PractitionerRole created successfully', data: createResponse.data });
  } catch (error) {
    console.error('Error creating PractitionerRole:', error.message);
    res.status(500).json({ error: 'Failed to create PractitionerRole', details: error.message });
  }
});

// Delete a PractitionerRole by its ID
router.delete('/delete', async (req, res) => {
  try {
    const { practitionerRoleId } = req.query; // Extract the PractitionerRole ID from the query parameters

    // Validate that the PractitionerRole ID is provided
    if (!practitionerRoleId) {
      return res.status(400).json({ error: 'PractitionerRole ID is required.' });
    }

    // Construct the FHIR API URL using the provided PractitionerRole ID
    const deleteUrl = `${FHIR_BASE_URL}/PractitionerRole/${practitionerRoleId}`;
    const accessToken = await getFhirAccessToken();

    // Log the delete request details for debugging
    console.log('Deleting PractitionerRole with ID:', practitionerRoleId);

    // Make a DELETE request to remove the PractitionerRole from the FHIR server
    const deleteResponse = await axios.delete(deleteUrl, {
      headers: {
        Authorization: `Bearer ${accessToken}`, // Pass the access token in the request headers
        Accept: 'application/fhir+json', // Set the appropriate headers to receive a FHIR-compliant JSON response
      },
    });

    // Check the response status to confirm the deletion
    if (deleteResponse.status === 204) {
      // 204 No Content indicates successful deletion
      res.status(200).json({ message: 'PractitionerRole deleted successfully' });
    } else {
      // Handle unexpected response status codes
      res.status(deleteResponse.status).json({
        error: 'Unexpected response from FHIR server during deletion',
        details: deleteResponse.statusText,
      });
    }
  } catch (error) {
    console.error('Error deleting PractitionerRole:', error.message);
    res.status(500).json({ error: 'Failed to delete PractitionerRole', details: error.message });
  }
});


export default router;
