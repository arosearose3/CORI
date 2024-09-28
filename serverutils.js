import { google } from 'googleapis';
import { GoogleAuth } from 'google-auth-library';
import dotenv from 'dotenv';

dotenv.config(); // Load environment variables from .env file

export const PROJECT_ID = 'combine-fhir-smart-store';
export const LOCATION = 'us-central1';
export const DATASET_ID = 'COMBINE-FHIR-v1';
export const FHIR_STORE_ID = '1';

export const healthcare = google.healthcare('v1');

// Initialize GoogleAuth with correct scopes
export const auth = new GoogleAuth({
  scopes: ['https://www.googleapis.com/auth/cloud-platform'],
});

// Function to connect to Google Cloud (for testing purposes)
export const connectToGoogleCloud = async () => {
  try {
    const authClient = await auth.getClient(); // Obtain the authenticated client
    // Test request to validate connection to Google Cloud
    await authClient.request({ url: 'https://www.googleapis.com/auth/cloud-platform' });
    console.log('Connected to Google Cloud successfully');
    return { success: true, message: 'Connected to Google Cloud' };
  } catch (error) {
    console.error('Error connecting to Google Cloud:', error.message);
    return { success: false, error: error.message };
  }
};

// Function to get the OAuth2 access token
export const getAccessToken = async () => {
  try {
    console.log('Attempting to obtain Google Cloud access token...');
    const authClient = await auth.getClient(); // Ensure the client is correctly set up

    // Check the type of the client to verify it's configured correctly
    if (!authClient) {
      throw new Error('Authentication client is not initialized.');
    }

    const tokenResponse = await authClient.getAccessToken();
    if (!tokenResponse || !tokenResponse.token) {
      throw new Error('Access token is missing from the response.');
    }

    console.log('Access token retrieved successfully:', tokenResponse.token);
    return tokenResponse.token;
  } catch (error) {
    console.error('Error obtaining Google Cloud access token:', error.message);
    throw new Error('Failed to get Google Cloud access token');
  }
};

// Function to handle blob responses (for some APIs that return blob)
export const handleBlobResponse = async (responseData) => {
  if (responseData && responseData[Symbol.toStringTag] === 'Blob') {
    const buffer = await responseData.arrayBuffer();
    return JSON.parse(Buffer.from(buffer).toString('utf-8'));
  } else if (typeof responseData === 'object' && responseData !== null) {
    return responseData;
  } else {
    throw new Error('Unexpected response type');
  }
};
