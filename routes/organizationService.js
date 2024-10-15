import axios from 'axios';
import { BASE_PATH } from '../serverutils.js'; // Adjust the path as necessary
import { getFhirAccessToken } from '../src/lib/auth/auth.js'; 
import { auth, healthcare, PROJECT_ID, LOCATION, DATASET_ID, FHIR_STORE_ID, handleBlobResponse } from '../serverutils.js';

const FHIR_BASE_URL = `https://healthcare.googleapis.com/v1/projects/${PROJECT_ID}/locations/${LOCATION}/datasets/${DATASET_ID}/fhirStores/${FHIR_STORE_ID}/fhir`;

// Get all Organizations given a nextPageUrl 
export async function service_extractOrganizations(url, accessToken) {
    let organizations = [];
    let nextPageUrl = url;
  
    while (nextPageUrl) {
      const response = await axios.get(nextPageUrl, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Accept: 'application/fhir+json',
        },
      });
  
      const bundle = response.data;
  
      if (!bundle || bundle.resourceType !== 'Bundle' || !Array.isArray(bundle.entry)) {
        throw new Error('Invalid FHIR Bundle format');
      }
  
      // Extract Organizations
      const pageOrganizations = bundle.entry
        .map(entry => entry.resource)
        .filter(resource => resource.resourceType === 'Organization');
      
      organizations = organizations.concat(pageOrganizations);
  
      // Find the 'next' link for pagination
      const nextLink = bundle.link.find(link => link.relation === 'next');
      nextPageUrl = nextLink ? nextLink.url : null;
    }
  
    return organizations;
  }