// practitionerService.js

import axios from 'axios';
import { BASE_PATH } from '../serverutils.js'; // Adjust the path as necessary
import { getFhirAccessToken } from '../src/lib/auth/auth.js'; 
import { auth, healthcare, PROJECT_ID, LOCATION, DATASET_ID, FHIR_STORE_ID, handleBlobResponse } from '../serverutils.js';


const FHIR_BASE_URL = `https://healthcare.googleapis.com/v1/projects/${PROJECT_ID}/locations/${LOCATION}/datasets/${DATASET_ID}/fhirStores/${FHIR_STORE_ID}/fhir`;

import { UserCodes } from './userCodes.js'; // assuming UserCodes is in a separate file


// Function to get all Practitioner names and IDs
export async function service_getAllPractitionerNamesAndIds() {
  const accessToken = await getFhirAccessToken();
  if (!accessToken) {
    throw new Error('Unable to retrieve access token.');
  }

  let practitionerData = [];
  let nextUrl = `${FHIR_BASE_URL}/Practitioner?_count=100`; // Start with the first page

  try {
    while (nextUrl) {
      // Fetch the current page of Practitioners
      const response = await axios.get(nextUrl, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Accept: 'application/fhir+json',
        },
      });

     // console.log ("practService getAllNames response.data",JSON.stringify(response.data));
      const bundle = response.data;

      // Extract Practitioner names and IDs from the bundle's entries
      if (bundle.entry) {
        const practitioners = bundle.entry.map(entry => {
          const practitioner = entry.resource;
          const practitionerId = practitioner.id;
       //   console.log ("practService getAllName practName", practitioner.name[0]);

          // Extract the name from the Practitioner resource
          let fullName = 'Unknown Name';  // Default value if no name is available
          if (practitioner.name && practitioner.name.length > 0) {
            const name = practitioner.name[0];  // Use the first name in the array
            const givenNames = name.given ? name.given.join(' ') : '';
            const lastName = name.family || '';
            fullName = `${givenNames} ${lastName}`.trim();
          }

          return {
            fullName,
            practitionerId
          };
        });

        // Add practitioners from the current page to the list
        practitionerData = practitionerData.concat(practitioners);
      }

      // Find the 'next' link, if any, to fetch the next page
      const nextLink = bundle.link && bundle.link.find(link => link.relation === 'next');
      nextUrl = nextLink ? nextLink.url : null;  // If there's no 'next' link, stop
    }

    return practitionerData;

  } catch (error) {
    console.error('Error fetching all Practitioner names and IDs:', error.message);
    throw new Error(`Failed to fetch all Practitioner names and IDs: ${error.message}`);
  }
}


// Function to get all Practitioner IDs, returns a list of all the practitionerIds. 
export async function service_getAllPractitionerIds() {
  const accessToken = await getFhirAccessToken();
  if (!accessToken) {
    throw new Error('Unable to retrieve access token.');
  }

  let practitionerIds = [];
  let nextUrl = `${FHIR_BASE_URL}/Practitioner?_count=100`; // Start with the first page

  try {
    while (nextUrl) {
      // Fetch the current page of Practitioners
      const response = await axios.get(nextUrl, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Accept: 'application/fhir+json',
        },
      });

      const bundle = response.data;

      // Extract Practitioner IDs from the bundle's entries
      if (bundle.entry) {
        const ids = bundle.entry.map(entry => entry.resource.id);
        practitionerIds = practitionerIds.concat(ids);
      }

      // Find the 'next' link, if any, to fetch the next page
      const nextLink = bundle.link && bundle.link.find(link => link.relation === 'next');
      nextUrl = nextLink ? nextLink.url : null;  // If there's no 'next' link, stop
    }

    return practitionerIds;

  } catch (error) {
    console.error('Error fetching all Practitioner IDs:', error.message);
    throw new Error(`Failed to fetch all Practitioner IDs: ${error.message}`);
  }
}


// Function to update a practitioner's email based on a code
export async function service_updatePractitionerEmailFromCode(code, email) {
  // Find the practitioner ID associated with the code
  const userCodeEntry = UserCodes.find(entry => entry.code === code);
  if (!userCodeEntry) {
    throw new Error('Invalid code. Practitioner not found.');
  }
  const practitionerId = userCodeEntry.practitionerId;

  try {
    // Fetch the current Practitioner resource by ID
    const accessToken = await getFhirAccessToken();
    const practitionerUrl = `${FHIR_BASE_URL}/Practitioner/${practitionerId}`;

    const response = await axios.get(practitionerUrl, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: 'application/fhir+json',
      },
    });

    const practitioner = response.data;

    if (!practitioner) {
      throw new Error(`Practitioner with ID ${practitionerId} not found.`);
    }

    // Update the email in the practitioner's telecom field
    if (!practitioner.telecom) {
      practitioner.telecom = [];
    }

    // Check if there's already an email and update it
    const emailField = practitioner.telecom.find(contact => contact.system === 'email');
    if (emailField) {
      emailField.value = email;
    } else {
      // Add a new email entry if it doesn't exist
      practitioner.telecom.push({
        system: 'email',
        value: email,
        use: 'work'
      });
    }

    // Update the practitioner resource in FHIR
    await axios.put(practitionerUrl, practitioner, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/fhir+json',
        Accept: 'application/fhir+json',
      },
    });

    return { message: 'Email updated successfully.' };

  } catch (error) {
    console.error('Error updating email for practitioner:', error.message);
    throw new Error(`Failed to update email: ${error.message}`);
  }
}


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


