// practitionerRoleService.js
import axios from 'axios';
import { BASE_PATH } from '../serverutils.js'; // Adjust the path as necessary
import { getFhirAccessToken } from '../src/lib/auth/auth.js'; 
const FHIR_BASE_URL = `https://healthcare.googleapis.com/v1/projects/${PROJECT_ID}/locations/${LOCATION}/datasets/${DATASET_ID}/fhirStores/${FHIR_STORE_ID}/fhir`;


import { auth, healthcare, PROJECT_ID, LOCATION, DATASET_ID, FHIR_STORE_ID, handleBlobResponse } from '../serverutils.js';




/**
 * Fetches PractitionerRoles for a given organization from the FHIR server.
 * @param {string} organizationId - The ID of the organization to search for.
 * @returns {Promise<object>} - The PractitionerRole FHIR Bundle or an error object.
 */
export async function service_getPractitionerRolesByOrganization(organizationId) {
  try {
    // Get the OAuth2 access token
    const accessToken = await getFhirAccessToken();
    
    // Construct the search URL for PractitionerRoles
    const searchUrl = `${FHIR_BASE_URL}/PractitionerRole?organization=Organization/${organizationId}`;
    console.log('role/withOrg searchUrl:', searchUrl);

    // Make the GET request to fetch the PractitionerRoles
    const response = await axios.get(searchUrl, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: 'application/fhir+json', // Ensure the response is FHIR-compliant JSON
      },
    });
    const practitionerRoles = await handleBlobResponse(response.data);
    const entries = practitionerRoles.entry || []; // Handle if entry is missing or null
    return entries.map(entry => entry.resource); // Extract the resource from each entry, return ARRAY
 
   
  } catch (error) {
    console.error('Error fetching PractitionerRoles with Organization:', error.message);
    throw new Error('Failed to fetch PractitionerRoles');
  }
}


