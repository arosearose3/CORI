// src/lib/auth/googleUserAuth.js

import { actions } from '$lib/stores.js';
import { writable } from 'svelte/store';
import { goto } from '$app/navigation'; // Import here if using in this module

/**
 * Writable store to manage user authentication errors.
 */
export const authError = writable(null);

/**
 * Initializes Google User Authentication.
 */
export async function initGoogleAuth() {
  console.log('Initializing Google User Authentication...');
  // Add your initialization logic here, such as loading Google API client
  // Example:
  // await gapi.client.init({
  //   clientId: 'YOUR_CLIENT_ID',
  //   scope: 'profile email',
  // });
}

/**
 * Handles Google User Authentication.
 */
export async function handleGoogleAuth() {
  console.log('handleGoogleAuth called');
  await startGoogleAuth();
}

/**
 * Initiates the Google Authentication flow by fetching the auth URL and opening a popup window.
 * Monitors the popup window and checks authentication status upon closure.
 */
async function startGoogleAuth() {
  console.log('startGoogleAuth function called');
  authError.set(null); // Reset any previous errors

  try {
    const API_URL = '/avail';
    const response = await fetch(`${API_URL}/auth/google/url`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include' // Include credentials if necessary
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

    // Open the Google authentication popup window
    const authWindow = window.open(url, 'googleAuth', 'width=500,height=600');

    if (!authWindow) {
      throw new Error('Failed to open Google auth window. Please check your pop-up blocker settings.');
    }

    console.log('Google Auth window opened.');

    // Polling to detect when the auth window is closed
    const pollTimer = setInterval(async () => {
      if (authWindow.closed) {
        clearInterval(pollTimer);
        console.log('Google Auth window closed, rechecking status...');
        const isAuthenticated = await checkAuthStatus();
        if (isAuthenticated) {
          console.log('User authenticated successfully.');
          // Optionally, navigate to a specific page
          // goto('/avail');
        } else {
          console.log('User authentication failed or was canceled.');
        }
      }
    }, 500);
  } catch (err) {
    console.error('Error in startGoogleAuth:', err);
    authError.set(err.message); // Update the error store with the error message
  }
}

/**
 * Checks the current user authentication status by querying the backend.
 * Updates the user store based on the response.
 *
 * @returns {Promise<boolean>} - Returns true if authenticated, else false.
 */
export async function checkAuthStatus() {
  console.log('Checking user authentication status...');
  try {
    const response = await fetch(`/avail/auth/user`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include' // Include credentials if necessary
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
        roles: data.user.roles || [] // Ensure roles are included
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
 */
export async function logoutGoogleUser() {
  try {
    const response = await fetch('/avail/auth/logout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include' // Include credentials if necessary
    });

    if (response.ok) {
      actions.clearUserStore();
      console.log('User logged out successfully.');
      goto('/'); // Redirect to home or login page
    } else {
      const errorMsg = await response.text();
      throw new Error(`Logout failed: ${response.status} ${response.statusText} - ${errorMsg}`);
    }
  } catch (error) {
    console.error('Error during logout:', error);
    authError.set('Logout failed. Please try again.');
  }
}
