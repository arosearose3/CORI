<!-- AuthButtons.svelte -->
<script>
  export let isUserAuthenticated;
  export let handleLogin;
  export let handleLogout;
  export let isFhirAuthenticated;
  export let handleConnectFhir;
  export let handleDisconnectFhir;
</script>

<div class="auth-buttons">
  {#if !isUserAuthenticated}
    <button 
      class="nav-button" 
      on:click={handleLogin} 
      aria-label="Log in with Google"
    >
      Log In with Google
    </button>
  {:else}
    <button 
      class="nav-button logout" 
      on:click={handleLogout} 
      aria-label="Log out"
    >
      Log Out
    </button>
  {/if}

  {#if !isFhirAuthenticated}
    <button 
      class="nav-button" 
      on:click={handleConnectFhir} 
      aria-label="Connect to FHIR"
    >
      Connect to FHIR
    </button>
  {:else}
    <button 
      class="nav-button logout" 
      on:click={handleDisconnectFhir} 
      aria-label="Disconnect FHIR"
    >
      Disconnect FHIR
    </button>
  {/if}
</div>

<style>
  .auth-buttons {
    margin-bottom: 15px;
  }

  .nav-button {
    padding: 10px 15px;
    margin-bottom: 8px;
    background-color: #28a745;
    color: white;
    border: none;
    cursor: pointer;
    border-radius: 4px;
    width: 100%;
    text-align: left;
    font-size: 14px;
    transition: background-color 0.3s;
  }

  .nav-button.logout {
    background-color: #dc3545;
  }

  .nav-button:hover:not(:disabled) {
    background-color: #218838; /* Darker green */
  }

  .nav-button.logout:hover:not(:disabled) {
    background-color: #c82333; /* Darker red */
  }

  .nav-button:disabled {
    background-color: #ccc;
    cursor: not-allowed;
  }
</style>
