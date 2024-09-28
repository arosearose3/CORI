<!-- src/components/AuthButton.svelte -->

<script>
  import { onMount, onDestroy } from 'svelte';
  import { user, actions } from '$lib/stores.js';
  import { handleGoogleAuth, checkAuthStatus, authError } from '$lib/auth/googleUserAuth.js';
  import { goto } from '$app/navigation';
  import { get } from 'svelte/store';

  let errorMessage = null;

  // Subscribe to the authError store to reactively update error messages
  const unsubscribeError = authError.subscribe(value => {
    errorMessage = value;
  });

  // Subscribe to the user store to reactively handle navigation upon authentication
  const unsubscribeUser = user.subscribe(currentUser => {
    if (currentUser && currentUser.id) {
      // Navigate to '/avail' if the user is authenticated
      goto('/avail');
    }
  });

  // On component mount, check if the user is already authenticated
  onMount(async () => {
    console.log('Component mounted. Checking authentication status...');
    await checkAuthStatus();
  });

  // Cleanup subscriptions when the component is destroyed
  onDestroy(() => {
    unsubscribeError();
    unsubscribeUser();
  });
</script>

<style>
  .auth-button {
    padding: 10px 20px;
    background-color: #4285F4;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-size: 16px;
  }

  .auth-button:hover {
    background-color: #357ae8;
  }

  .error-message {
    color: red;
    margin-top: 10px;
  }
</style>

<div>
  <!-- Google Sign-In Button -->
  <button class="auth-button" on:click={handleGoogleAuth}>
    Sign in with Google
  </button>

  <!-- Display Authentication Errors -->
  {#if errorMessage}
    <div class="error-message">{errorMessage}</div>
  {/if}
</div>
