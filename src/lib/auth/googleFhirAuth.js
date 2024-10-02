// src/lib/auth/googleFhirAuth.js

import { writable } from 'svelte/store';
import { setUser, clearUserStore } from '$lib/stores'; // Import clearUserStore to clear state when unauthenticated
import { goto } from '$app/navigation';
import {browser} from '$app/environment';

export const authError = writable(null);

// Initialize FHIR authentication
export async function initFhirAuth(base) {
  await checkAuthStatus(base);
}

// Handle FHIR authentication by redirecting to the server's Google Auth URL
export async function handleFhirAuth(base) {
  try {
    const response = await fetch(`${base}/auth/google/url`);
    const { url } = await response.json();
    window.location.href = url; // Redirect to Google Auth URL
  } catch (error) {
    authError.set('Failed to initiate Google authentication.');
    console.error('Error initiating Google authentication:', error);
  }
}

// Check if the user is authenticated
export async function checkAuthStatus(base) {
  try {
    const response = await fetch(`${base}/auth/user`, {
      credentials: 'include',
    });

    if (response.ok) {
      const data = await response.json();
      setUser(data.user); // Set user data in the store
      authError.set(null);
      return true;
    } else {
      clearUserStore(); // Clear user store if not authenticated
      authError.set('FhirAuth.js CheckAuthStatus User not authenticated.');
      return false;
    }
  } catch (error) {
    clearUserStore(); // Clear user store on error
    authError.set('Failed to check authentication status.');
    console.error('Error checking authentication status:', error);
    return false;  
  }
}

// Disconnect from FHIR by logging out
export async function disconnectFhirAuth(base) {
  try {
    const response = await fetch(`${base}/auth/logout`, {
      method: 'POST',
      credentials: 'include',
    });
    if (response.ok) {
      clearUserStore(); // Clear user store on logout
      goto('/'); // Redirect to the home page
    } else {
      authError.set('Failed to log out.');
    }
  } catch (error) {
    authError.set('Error logging out.');
    console.error('Error logging out:', error);
  }
}
