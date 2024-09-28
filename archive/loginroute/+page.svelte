<script>
  import { onMount } from 'svelte';
  import { userPractitionerStore, setUser, clearUserPractitionerStore } from '$lib/stores';
  import { goto } from '$app/navigation';

  const API_URL = '/avail';
  let authWindow;
  let error = null;
  let buttonElement; // This is used to bind the login button

  // Check the current authentication status when the component mounts
  onMount(() => {
    console.log('Component mounted');
    checkAuthStatus();

    if (buttonElement) {
      console.log('Button element found in onMount');
      buttonElement.addEventListener('click', handleGoogleAuth);
    } else {
      console.log('Button element not found in onMount');
    }
  });

  // Handles Google Authentication
  function handleGoogleAuth() {
    console.log('handleGoogleAuth called');
    startGoogleAuth();
  }

  // Checks if the user is currently authenticated
  async function checkAuthStatus() {
    console.log('Checking auth status');
    try {
      const response = await fetch(`${API_URL}/auth/user`, { credentials: 'include' });
      if (response.ok) {
        const data = await response.json();
        console.log('Received user data:', data);

        setUser({
          id: data.user.id,
          email: data.user.email,
          name: data.user.name,
          picture: data.user.picture,
        });

        console.log('User data stored:', data.user);
        goto('/avail'); // Redirect to the main page if authenticated
      } else {
        console.log('Response not OK:', response.status);
        clearUserPractitionerStore(); // Clear the store if not authenticated
      }
    } catch (error) {
      console.error('Error checking auth status:', error);
      clearUserPractitionerStore(); // Clear the store on error
    }
  }

  // Initiates Google OAuth login
  async function startGoogleAuth() {
    console.log('startGoogleAuth function called');
    error = null;
    try {
      const response = await fetch(`${API_URL}/auth/google/url`);
      if (!response.ok) {
        throw new Error(`Failed to get auth URL: ${response.status} ${response.statusText}`);
      }
      const { url } = await response.json();
      console.log('Received auth URL:', url);

      if (!url) {
        throw new Error('Received empty auth URL');
      }

      authWindow = window.open(url, 'googleAuth', 'width=500,height=600');

      if (!authWindow) {
        throw new Error('Failed to open auth window. Please check your pop-up blocker settings.');
      }

      console.log('Auth window opened');

      const pollTimer = setInterval(() => {
        if (authWindow && authWindow.closed) {
          clearInterval(pollTimer);
          console.log('Auth window closed, rechecking status');
          checkAuthStatus();
        }
      }, 500);
    } catch (err) {
      console.error('Error in startGoogleAuth:', err);
      error = err.message;
    }
  }

  // Logs out the user and clears the store
  async function logout() {
    try {
      const response = await fetch(`${API_URL}/auth/logout`, {
        method: 'POST',
        credentials: 'include',
      });

      if (response.ok) {
        clearUserPractitionerStore(); // Clear the user data from the store on logout
      } else {
        console.error('Logout failed');
      }
    } catch (error) {
      console.error('Error during logout:', error);
    }
  }
</script>

<!-- Ensure the login button is properly displayed and functional -->
<div class="auth-container">
  {#if $userPractitionerStore.user !== null}
    <button on:click={logout}>Logout</button>
  {:else}
    <button bind:this={buttonElement} on:click={handleGoogleAuth}>
      Sign in with Google
    </button>
    {#if error}
      <p class="error">{error}</p>
    {/if}
  {/if}
</div>

<style>
  .auth-container {
    max-width: 300px;
    margin: 0 auto;
  }

  button {
    margin-top: 10px;
    padding: 10px;
    background-color: #007bff;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    width: 100%;
    font-size: 16px;
  }

  button:hover {
    background-color: #0056b3;
  }

  button:disabled {
    background-color: #cccccc;
    cursor: not-allowed;
  }

  .error {
    color: red;
    margin-top: 10px;
  }
</style>
