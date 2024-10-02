// src/lib/auth/googleUserAuth.js

import { actions } from '$lib/stores.js';
import { writable } from 'svelte/store';
import { goto } from '$app/navigation';

/**
 * Writable store to manage user authentication errors.
 */
export const authError = writable(null);

/**
 * Initializes Google User Authentication.
 * @param {string} base - The base path of the application.
 */
export async function initGoogleAuth(base) {
  console.log('Initializing Google User Authentication with base:', base);
  await checkAuthStatus(base);
}

/**
 * Handles Google User Authentication.
 * @param {string} base - The base path of the application.
 */
export async function handleGoogleAuth(base) {
  try {
    const response = await fetch(`${base}/auth/google/url`);
    if (!response.ok) {
      throw new Error('Failed to get auth URL');
    }
    const data = await response.json();
    
    // Redirect to Google login
    window.location.href = data.url;

    // This return statement won't actually be reached due to the redirect
    return { success: true };
  } catch (error) {
    console.error('Error during Google authentication:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Initiates the Google Authentication flow by fetching the auth URL and redirecting.
 * @param {string} base - The base path of the application.
 */
async function startGoogleAuth(base) {
  console.log('startGoogleAuth function called with base:', base);
  authError.set(null); // Reset any previous errors

  try {
    const response = await fetch(`${base}/auth/google/url`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include', // Include credentials if necessary
    });

    if (!response.ok) {
      const errorMsg = await response.text();
      throw new Error(`Failed to get Google auth URL: ${response.status} ${response.statusText} - ${errorMsg}`);
    }

    const { url } = await response.json();
    console.log('Received Google auth URL:', url);

    if (!url) {
      throw new Error('Received empty Google auth URL');
    }

    // Redirect to the Google authentication URL
    window.location.href = url;
  } catch (err) {
    console.error('Error in startGoogleAuth:', err);
    authError.set(err.message); // Update the error store with the error message
  }
}

/**
 * Checks the current user authentication status by querying the backend.
 * Updates the user store based on the response.
 *
 * @param {string} base - The base path of the application.
 * @returns {Promise<boolean>} - Returns true if authenticated, else false.
 */
export async function checkAuthStatus(base) {
  console.log('Checking user authentication status with base:', base);
  try {
    const response = await fetch(`${base}/auth/user`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include', // Include credentials if necessary
    });

    if (response.ok) {
      const data = await response.json();
      console.log('User data received:', data);

      // Update the user store with received data
      actions.setUser({
        id: data.user.id || null,
        email: data.user.email || null,
        name: data.user.name || null,
        picture: data.user.picture || null,
        roles: data.user.roles || [], // Ensure roles are included
      });

      console.log('User store updated.');
      return true; // User is authenticated
    } else {
      console.log('User is not authenticated. Status:', response.status);
      actions.clearUserStore(); // Clear user store
      return false; // User is not authenticated
    }
  } catch (error) {
    console.error('Error while checking user authentication status:', error);
    actions.clearUserStore(); // Clear user store on error
    authError.set('Failed to verify authentication status.');
    return false;
  }
}

/**
 * Logs out the user by calling the backend logout endpoint.
 * @param {string} base - The base path of the application.
 */
export async function logoutGoogleUser(base) {
  console.log('Logging out user with base:', base);
  try {
    const response = await fetch(`${base}/auth/logout`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include', // Include credentials if necessary
    });

    if (response.ok) {
      actions.clearUserStore();
      console.log('User logged out successfully.');
      goto(`${base}/`); // Redirect to home or login page
    } else {
      const errorMsg = await response.text();
      throw new Error(`Logout failed: ${response.status} ${response.statusText} - ${errorMsg}`);
    }
  } catch (error) {
    console.error('Error during logout:', error);
    authError.set('Logout failed. Please try again.');
  }
}
