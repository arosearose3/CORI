// practitionerService.js

import axios from 'axios';
import { BASE_PATH } from '../serverutils.js'; // Adjust the path as necessary
import { getFhirAccessToken } from '../src/lib/auth/auth.js'; 
import { auth, healthcare, PROJECT_ID, LOCATION, DATASET_ID, FHIR_STORE_ID, handleBlobResponse } from '../serverutils.js';


const FHIR_BASE_URL = `https://healthcare.googleapis.com/v1/projects/${PROJECT_ID}/locations/${LOCATION}/datasets/${DATASET_ID}/fhirStores/${FHIR_STORE_ID}/fhir`;



/**
 * Fetches a Practitioner by ID from the FHIR server.
 * @param {string} practitionerId - The ID of the practitioner to fetch.
 * @returns {Promise<object|null>} - The Practitioner data or null if an error occurs. As an ARRAY
 */
export async function service_getPractitionerById(practitionerId) {
  try {
    const accessToken = await getFhirAccessToken();
    const practitionerResponse = await axios.get(`${FHIR_BASE_URL}/Practitioner/${practitionerId}`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: 'application/fhir+json',
      },
    });

    const practitioner = await handleBlobResponse(practitionerResponse.data);
    return practitioner;

  } catch (error) {
    console.error(`Failed to fetch Practitioner with ID ${practitionerId}:`, error.message);
    return null; // Return null or handle missing practitioners as needed
  }
}


