import { google } from 'googleapis';
import { GoogleAuth } from 'google-auth-library';
import dotenv from 'dotenv';

dotenv.config();  // Load environment variables from .env file

export const PROJECT_ID = 'combine-fhir-smart-store';
export const LOCATION = 'us-central1';
export const DATASET_ID = 'COMBINE-FHIR-v1';
export const FHIR_STORE_ID = '1';

export const healthcare = google.healthcare('v1');
export let auth = true;

// Connect to Google Cloud
export const connectToGoogleCloud = async () => {
  try {
    if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
      auth = new GoogleAuth({
        scopes: ['https://www.googleapis.com/auth/cloud-platform'],
      });
    } else if (process.env.GOOGLE_SERVICE_ACCOUNT_KEY) {
      const serviceAccountKey = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_KEY);
      auth = new GoogleAuth({
        credentials: serviceAccountKey,
        scopes: ['https://www.googleapis.com/auth/cloud-platform'],
      });
    } else {
      console.error('No Google Cloud credentials found.');
      throw new Error('Google Cloud credentials are missing.');
    }

    await auth.getClient();
    console.log('Connected to Google Cloud');
    return { success: true, message: 'Connected to Google Cloud' };  // Ensure it returns a proper object
  } catch (error) {
    console.error('Error connecting to Google Cloud:', error.message);
    return { success: false, error: error.message };  // Return an error object
  }
};

// Handle blob responses (for some APIs that return blob)
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

// Other shared utilities can be added here...
