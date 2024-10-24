import express from 'express';
import { auth, healthcare, PROJECT_ID, LOCATION, DATASET_ID, FHIR_STORE_ID, handleBlobResponse } from '../serverutils.js';
import axios from 'axios';

import { getFhirAccessToken } from '../src/lib/auth/auth.js'; 
import { service_getPractitionerById } from './practitionerService.js';
import { service_getPractitionerRolesByOrganization} from './roleService.js';
import { service_updatePractitionerEmailFromCode } from './practitionerService.js';
import { service_getAllPractitionerIds } from './practitionerService.js'; 
import { service_getAllPractitionerNamesAndIds } from './practitionerService.js';  

import { UserCodes } from './userCodes.js'; //all the invite codes for Oct 2024 users


import { BASE_PATH } from '../serverutils.js'; // Adjust the path as necessary


const router = express.Router();
const FHIR_BASE_URL = `https://healthcare.googleapis.com/v1/projects/${PROJECT_ID}/locations/${LOCATION}/datasets/${DATASET_ID}/fhirStores/${FHIR_STORE_ID}/fhir`;


router.get('/getCodeByPractitionerId', (req, res) => {
  const { practitionerId } = req.query;
  if (!practitionerId) {
    return res.status(400).json({ error: 'practitionerId is required' });
  }
  const found = UserCodes.find(item => item.practitionerId === practitionerId);
  if (!found) {
    return res.status(404).json({ error: 'Practitioner ID not found' });
  }
  return res.json({ code: found.code });
});

router.get('/getAllPractitionerNamesAndIds', async (req, res) => {
  try {
    const practitioners = await service_getAllPractitionerNamesAndIds();
    res.status(200).json(practitioners);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/getAllIds', async (req, res) => {
  try {
    const practitionerIds = await service_getAllPractitionerIds();
    res.status(200).json(practitionerIds);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

//
// onboard new users by accepting a code from them, which we emailed them,
// and matching their code to the provider Id, and then assigning the Provider Resource the email
// then the system will recognize their email address when they log in. 

router.post('/updateEmailFromCode', async (req, res) => {
  const { code, email } = req.body;

  if (!code || !email) {
    return res.status(400).json({ error: 'Code and email are required.' });
  }

  try {
    const result = await service_updatePractitionerEmailFromCode(code, email);
    return res.status(200).json(result);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

// Update an existing Practitioner
router.put('/update/:practitionerId', async (req, res) => {
  if (!auth) {
    return res.status(400).json({ error: 'Not connected to Google Cloud. Call /connect first.' });
  }

  const { practitionerId } = req.params;
  const practitionerData = req.body;

  if (!practitionerId || !practitionerData) {
    return res.status(400).json({ error: 'Practitioner ID and data are required.' });
  }

  try {
    // Ensure the resourceType is 'Practitioner' in the update data
    practitionerData.resourceType = 'Practitioner';
    practitionerData.id = practitionerId;

    const updateUrl = `${FHIR_BASE_URL}/Practitioner/${practitionerId}`;
    const accessToken = await getFhirAccessToken();

    console.log('Practitioner Data being sent:', practitionerData);
    console.log('Practitioner ID being sent:', practitionerId);
    console.log('url sent:', updateUrl);
    // Make the PUT request to update the Practitioner resource
    const response = await axios.put(updateUrl, practitionerData, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/fhir+json',  // Ensure FHIR-compliant content type
        Accept: 'application/fhir+json',  // Ensure FHIR-compliant response
      },
    });

    // Handle the response and return the updated resource
    const updatedPractitioner = await handleBlobResponse(response.data);
    res.status(200).json({ message: 'Practitioner updated successfully', data: updatedPractitioner });
  } catch (error) {
    console.error('Error updating Practitioner:', error.response ? error.response.data : error.message);

    res.status(500).json({ error: 'Failed to update Practitioner', details: error.message });
  }
});


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



router.post('/add', async (req, res) => {
  if (!auth) {
    return res.status(400).json({ error: 'Not connected to Google Cloud. Call /connect first.' });
  }

  try {
    const practitionerData = req.body;
    practitionerData.resourceType = 'Practitioner'; // Ensure resourceType is set

    // Get the access token for FHIR API
    const accessToken = await getFhirAccessToken();
    if (!accessToken) {
      return res.status(401).json({ error: 'Unable to retrieve access token.' });
    }

    // Construct the FHIR URL
    const url = `${FHIR_BASE_URL}/Practitioner`;

    // Make the POST request using axios
    const response = await axios.post(url, practitionerData, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: 'application/fhir+json',
        'Content-Type': 'application/fhir+json'
      }
    });

    // Return the new PractitionerID from the response
    const practitionerID = response.data.id;
    res.status(201).json({ message: 'Practitioner added successfully', practitionerID });
  } catch (error) {
    console.error('Error adding practitioner:', error);
    res.status(500).json({ message: 'Failed to add practitioner', error: error.message });
  }
});


// Get all Practitioners for one Org
// Returns a JSON Object Bundle with resourceType, type and entry keypairs
router.get('/getStaffForOrg', async (req, res) => {
  const orgID = req.query.organizationId; // Use req.query.organizationId for consistency
  if (!auth) {
    return res.status(400).json({ error: 'Not connected to Google Cloud. Call /connect first.' });
  }
  try {
    const practitionerRoles = await service_getPractitionerRolesByOrganization (orgID);
   
    const practitionerIds = practitionerRoles.map(role => role.practitioner?.reference.split('/').pop());
    const practitioners = await Promise.all(
      practitionerIds.map(practitionerId => service_getPractitionerById(practitionerId))
    );
    
    const validPractitioners = practitioners.filter(practitioner => practitioner !== null);
    res.json({ resourceType: 'Bundle', type: 'collection', entry: validPractitioners.map(practitioner => ({ resource: practitioner })) });
  } catch (error) {
    console.error('Error fetching practitioners:', error);
    res.status(500).json({ error: 'Failed to fetch practitioners', details: error.message });
  }
});


// Get all Practitioners
router.get('/all', async (req, res) => {
  if (!auth) {
    return res.status(400).json({ error: 'Not connected to Google Cloud. Call /connect first.' });
  }
  try {
    const accessToken = await getFhirAccessToken();
    let allPractitioners = [];
    let nextUrl = `${FHIR_BASE_URL}/Practitioner`; // Initial search URL
    let hasMorePages = true;

    while (hasMorePages) {
      const response = await axios.get(nextUrl, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Accept: 'application/fhir+json',
        },
      });

      // Process the current page of practitioners
      const currentPagePractitioners = await handleBlobResponse(response.data);
      console.log ("Pract route currentPagePract:",JSON.stringify(currentPagePractitioners));

      allPractitioners = [...allPractitioners, ...currentPagePractitioners.entry];

      // Check if there's a next page
      const nextLink = response.data?.link?.find(link => link.relation === 'next');
      if (nextLink && nextLink.url) {
        nextUrl = nextLink.url; // Move to the next page
      } else {
        hasMorePages = false; // No more pages
      }
    }

    res.json(allPractitioners); // Return all practitioners
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch practitioners', details: error.message });
  }
});


// Delete a Practitioner by ID
router.delete('/delete/:id', async (req, res) => {
  console.log ("in delete id",req.params.id);
    if (!auth) {
      return res.status(400).json({ error: 'Not connected to Google Cloud. Call /connect first.' });
    }
  
    const practitionerId = req.params.id;
    console.log ("in delete pId:",practitionerId);
    
    try {
      const accessToken = await getFhirAccessToken();
      const searchUrl = `${FHIR_BASE_URL}/Practitioner/${practitionerId}`;
      console.log ("in delete 4 accesstoken", accessToken);
      
      console.log(`Delete URL: ${searchUrl}`);

      const response = await axios.delete(searchUrl, {
        headers: {
          Authorization: `Bearer ${accessToken}`, // Use the getAccessToken function
          Accept: 'application/fhir+json', // Ensure the request is FHIR-compliant
        },
      });
      console.log ("in delete 5");
      // Check if the response was successful
      console.log(`Delete response status: ${response.status}`);
      res.status(200).json({ message: `Practitioner with ID ${practitionerId} deleted successfully` });
    } catch (error) {
      console.error('Error deleting practitioner:', error.response ? error.response.data : error.message);
      res.status(500).json({ message: `Failed to delete practitioner with ID ${practitionerId}`, error: error.response ? error.response.data : error.message });
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


//Get One Practitioner - return just the resource
router.get('/:practitionerId', async (req, res) => {
  if (!auth) {
    return res.status(400).json({ error: 'Not connected to Google Cloud. Call /connect first.' });
  }
  const { practitionerId } = req.params;
  if (!practitionerId) {
    return res.status(400).json({ error: 'Practitioner ID is required.' });
  }
  try {
    const practitioner = await service_getPractitionerById(practitionerId);
    if (!practitioner) {
      return res.status(404).json({ error: `Practitioner with ID ${practitionerId} not found.` });
    }
    // Respond with the practitioner data
    res.json(practitioner);
  } catch (error) {
    console.error('Error fetching Practitioner:', error);
    res.status(500).json({ error: 'Failed to fetch Practitioner', details: error.message });
  }
});


// Delete one provider based on name 
router.delete('/removeUnknown', async (req, res) => {
  console.log ("in remove");
 
    console.log ("in remove after try");
    // Get the OAuth2 access token
    const accessToken = await getFhirAccessToken();

    // Construct the search URL for what's to be deleted

    const searchUrl = `${FHIR_BASE_URL}/Practitioner?name:contains=Marta`;

    console.log ("remove search:"+searchUrl);
    // Make the GET request to search for unknown Practitioners
    const searchResponse = await axios.get(searchUrl, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: 'application/fhir+json',
      },
    });

    console.log ("remove response:"+JSON.stringify(searchResponse.data));
    const practitioners = searchResponse.data.entry || [];

    if (practitioners.length === 0) {
      return res.status(200).json({ message: 'No Practitioners found.' });
    }

    // Delete each found Practitioner
    const deletionPromises = practitioners.map(practitioner => 
      axios.delete(`${FHIR_BASE_URL}/Practitioner/${practitioner.resource.id}`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Accept: 'application/fhir+json',
        },
      })
    );

    await Promise.all(deletionPromises);

    res.status(200).json({
      message: `Successfully deleted ${practitioners.length} Practitioner(s) with name "unknown".`,
      deletedCount: practitioners.length
    });
  
    console.error('Error in removeUnknown:', error.message);
    res.status(500).json({ error: 'An error occurred while removing unknown Practitioners.', details: error.message });
  
});


export default router;
