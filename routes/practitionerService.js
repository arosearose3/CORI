// practitionerService.js

import axios from 'axios';
import { BASE_PATH } from '../serverutils.js'; // Adjust the path as necessary
import { getFhirAccessToken } from '../src/lib/auth/auth.js'; 
import { auth, healthcare, PROJECT_ID, LOCATION, DATASET_ID, FHIR_STORE_ID, handleBlobResponse } from '../serverutils.js';


const FHIR_BASE_URL = `https://healthcare.googleapis.com/v1/projects/${PROJECT_ID}/locations/${LOCATION}/datasets/${DATASET_ID}/fhirStores/${FHIR_STORE_ID}/fhir`;

import { UserCodes } from './userCodes.js'; // assuming UserCodes is in a separate file
import { UserAdminCodes } from './userAdminCodes.js'; // assuming UserCodes is in a separate file

import {service_getPractitionerRoles} from './roleService.js';
import {service_createPractitionerRole} from './roleService.js';
import {service_updatePractitionerRoles} from './roleService.js';
import {service_patchPractitionerRole} from './roleService.js';
import {service_findExistingPractitionerRole} from './roleService.js';
 

export async function service_findPractitionerByEmail(email) {
  if (!email) {
    throw new Error('Email is required.');
  }
  try {
    console.log ("service_findPrByEmail, 1");
    const accessToken = await getFhirAccessToken();
    const searchUrl = `${FHIR_BASE_URL}/Practitioner?telecom=${email}`;
    const response = await axios.get(searchUrl, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: 'application/fhir+json',
      },
    });
    console.log ("service_findPrByEmail, 2");
    const practitioners = await handleBlobResponse(response.data);
    console.log ("service_findPrByEmail, 3");
    if (practitioners.entry && practitioners.entry.length > 0) {
      console.log ("service_findPrByEmail, 4");
      return practitioners.entry.map((practitioner) => practitioner.resource);
    } else {
      console.log ("service_findPrByEmail, 5");
      return null;
    }
  } catch (error) {
    console.error("Error in service_findPractitionerByEmail detailed:", {
      error: error.message,
      stack: error.stack,
      phase: error.phase || 'unknown',
      response: error.response?.data,
      email: email
    });
    throw error;
  }
}

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
export async function service_updatePractitionerEmailFromCode(code, email, namestring) {
  console.log ("service_updateEmail from Code 1 namestring:", namestring);
  // Find the practitioner ID associated with the code
  const userCodeEntry = UserCodes.find(entry => entry.code === code);
  if (userCodeEntry) {
    console.log ("service_updateEmail from Code 2");
    // code matched a code in the user Codes table (not admin)
  const practitionerId = userCodeEntry.practitionerId;
  console.log ("service_updateEmail from Code 3");

  try {
    // Fetch the current Practitioner resource by ID
    const accessToken = await getFhirAccessToken();
    const practitionerUrl = `${FHIR_BASE_URL}/Practitioner/${practitionerId}`;
    console.log ("service_updateEmail from Code 4");
    const response = await axios.get(practitionerUrl, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: 'application/fhir+json',
      },
    });
    console.log ("service_updateEmail from Code 5");
    const practitioner = response.data;

    if (!practitioner) { console.log ("service_updateEmail from Code 6");
      throw new Error(`Practitioner with ID ${practitionerId} not found.`);
    }

    // Update the email in the practitioner's telecom field
    if (!practitioner.telecom) {
      practitioner.telecom = [];
    }
    console.log ("service_updateEmail from Code 7");
    // Check if there's already an email and update it
    const emailField = practitioner.telecom.find(contact => contact.system === 'email');
    if (emailField) {
      emailField.value = email;
      console.log ("service_updateEmail from Code 8");
    } else {
      // Add a new email entry if it doesn't exist
      practitioner.telecom.push({
        system: 'email',
        value: email,
        use: 'work'
      });
      console.log ("service_updateEmail from Code 9");
    }
    // Update the practitioner resource in FHIR
    await axios.put(practitionerUrl, practitioner, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/fhir+json',
        Accept: 'application/fhir+json',
      },
    });
    console.log ("service_updateEmail from Code 10");
    return { message: 'Email updated successfully.' };
  }
  catch (error) {
    console.error('Error updating email for practitioner:', error.message);
    throw new Error(`Failed to update email: ${error.message}`);

  }

  } 

  console.log ("service_updateEmail from Code 11, code:",code);

  const userAdminCodeEntry = findAdminCodeEntry(code);
  if (userAdminCodeEntry) {
    console.log ("service_updateEmail from Code 12");
  // this is an admin code, and the other part fo the UserAdminCodes is an Org ID
  //  "code": "88pp55bco",
  //  "OrganizationId": "f3533ea1-3016-49e3-8c88-7911fd4de899"
  //   the email is in the organization 
  const orgId = userAdminCodeEntry.OrganizationId;

  console.log ("service_updateEmail from Code 12 userACE:",userAdminCodeEntry.OrganizationId);

  // first see if the practitioner exists, if not, create. 
  // then see if the PractiionerRole exists, if not create. 
  // if PR has "orgadmin" keep, else put. 
  // result - practitioner with correct email is associated with the org through a PractRole with orgadmin priv
  try {
    console.log("About to call service_findPractitionerByEmail");
    var pId = await service_findPractitionerByEmail(email);
    console.log("Completed service_findPractitionerByEmail, result:", pId);
    console.log("service_updateEmail from Code 13 userContextname:",  email, namestring);
  } catch (error) {
    console.error("Error in service_findPractitionerByEmail:", {
      message: error.message,
      stack: error.stack,
      cause: error.cause
    });
    throw error; // Re-throw if needed
  }


  if (pId === null) {
  // make a new practitioner 
  if (!auth) {
    throw new Error('Not connected to Google Cloud');
  }
  if (!email || !namestring) {
    throw new Error('User context must include name and email');
  }
  // Get access token
  const accessToken = await getFhirAccessToken();
  if (!accessToken) {
    throw new Error('Unable to retrieve access token');
  }
  try {
    console.log ("service_updateEmail from Code 14");
    let userContext = {email:email, name: namestring};
    const practitionerResource =  service_createPractitionerResource(userContext);
    console.log ("service_updateEmail from Code 15");
    console.log('Creating practitioner resource:', JSON.stringify(practitionerResource, null, 2));

    const url = `${FHIR_BASE_URL}/Practitioner`;
    const response = await axios.post(url, practitionerResource, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: 'application/fhir+json',
        'Content-Type': 'application/fhir+json'
      }
    });
    console.log ("service_updateEmail from Code 16");
    pId = response.data.id;

  } catch (error) {
    console.error(`Error in addPractitioner (requested by ${userContext?.email}):`, error);
    throw error;
  }


  } else {
  // a practitioner already exists with this email
  // possibly there are more than one with the same email, which is a problem state. 
    pId = pId[0].id;
    }

  // at this point the Practitioner is either found or created. 
  // no check for a PractitionerRole for the pId and org Id and if none, make one. 

    let practRole = await service_findExistingPractitionerRole(pId, orgId) 
    console.log ("service_updateEmail from Code 17");

    if (!practRole) {//make a practitionerRole with pId and orgId 
      console.log ("service_updateEmail from Code 18");
      practRole = await service_createPractitionerRole(pId, orgId);
      // set roles to provider, referrer, orgadmin
      let r = await service_patchPractitionerRole(practRole, ['provider','referrer','orgadmin']);
      console.log ("service_updateEmail from Code 19");
      return { message: 'Practitioner, Admin, Roles, and Email updated successfully.' };
    } else {
      let r2 = await  service_patchPractitionerRole(practRole, ['provider','referrer','orgadmin'])
      console.log ("service_updateEmail from Code 20");
      return { message: 'Practitioner, Admin, Roles, and Email updated successfully.' };
    }
  }
}
  

function findAdminCodeEntry(code) {
  if (!code) {
    throw new Error('Code is required');
  }
  // Always declare variables
  const userCodeEntry = UserAdminCodes.find(entry => entry.code === code);
  console.log("Checking admin code:", code, "Found entry:", userCodeEntry);
  return userCodeEntry || null;
}



// practitionerController.js
export async function service_addPractitioner(practitionerData) {
  if (!auth) {
    throw new Error('Not connected to Google Cloud');
  }

  // Ensure proper FHIR resource type
  practitionerData.resourceType = 'Practitioner';

  // Get access token
  const accessToken = await getFhirAccessToken();
  if (!accessToken) {
    throw new Error('Unable to retrieve access token');
  }

  try {
    const url = `${FHIR_BASE_URL}/Practitioner`;
    const response = await axios.post(url, practitionerData, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: 'application/fhir+json',
        'Content-Type': 'application/fhir+json'
      }
    });

    return {
      id: response.data.id,
      data: response.data
    };
  } catch (error) {
    console.error('Error in addPractitioner:', error);
    throw error;
  }
}


export async function service_addPractitionerFromSessionData(practitionerData, userContext) {
  if (!auth) {
    throw new Error('Not connected to Google Cloud');
  }
  // You can use the user context for authorization or logging
  console.log(`User ${userContext?.name} (${userContext?.email}) attempting to add practitioner`);

  practitionerData.resourceType = 'Practitioner';

  const accessToken = await getFhirAccessToken();
  if (!accessToken) {
    throw new Error('Unable to retrieve access token');
  }

  try {
    const url = `${FHIR_BASE_URL}/Practitioner`;
    const response = await axios.post(url, practitionerData, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: 'application/fhir+json',
        'Content-Type': 'application/fhir+json'
      }
    });

    return {
      id: response.data.id,
      data: response.data,
      createdBy: userContext?.email // Optional: track who created the practitioner
    };
  } catch (error) {
    console.error(`Error in addPractitioner (requested by ${userContext?.email}):`, error);
    throw error;
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



/**
 * Creates a FHIR-compliant Practitioner resource from user context
 * @param {Object} userContext - Contains user's name and email
 * @returns {Object} FHIR Practitioner resource
 */
function service_createPractitionerResource(userContext) {
  if (!userContext?.name || !userContext?.email) {
    throw new Error('User name and email are required');
  }

  // Split the full name into words
  const nameParts = userContext.name.trim().split(/\s+/);
  
  // Last word is family name, everything else is given names
  const familyName = nameParts[nameParts.length - 1];
  const givenNames = nameParts.slice(0, -1);

  return {
    resourceType: "Practitioner",
    name: [
      {
        use: "official",
        family: familyName,
        given: givenNames.length > 0 ? givenNames : undefined
      }
    ],
    telecom: [
      {
        system: "email",
        value: userContext.email,
        use: "work"
      }
    ]
  };
}
