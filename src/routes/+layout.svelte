<script>
  import { page } from '$app/stores';
  import { base } from '$app/paths';
  import { onMount } from 'svelte';

  let connectStatus = 'Connect FHIR';
  let isLoading = false;
  let currentRoute;

  $: {currentRoute = $page.url.pathname;
  console.log('Current route:', currentRoute);}
  
  const noLayoutRoutes = ['/avail/update-schedule'];

  $: hideLayout = noLayoutRoutes.includes(currentRoute);

  // Define the base API path
  const apiBase = '/avail';

  async function handleConnect() {
    isLoading = true;
    try {
      console.log("connecting to " + `${apiBase}/api/connect`);
      const response = await fetch(`${apiBase}/api/connect`, { 
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      if (response.ok) {
        const result = await response.json();
        connectStatus = 'Connected';
        console.log(result.message);
      } else {
        connectStatus = 'Could not connect';
        console.error('Connection failed:', await response.text());
      }
    } catch (error) {
      connectStatus = 'Could not connect';
      console.error('Error:', error);
    } finally {
      isLoading = false;
    }
  }
</script>

<div class="app-container">
  <nav>
    <button on:click={handleConnect} disabled={isLoading}>
      {#if isLoading}
        <span class="spinner"></span>
      {/if}
      {connectStatus}
    </button>

    {#if !hideLayout}
    <ul>
      <li class:active={$page.url.pathname === `${apiBase}/organizations`}>
        <a href="{apiBase}/organizations">Organizations</a>
      </li>
      <li class:active={$page.url.pathname === `${apiBase}/practitioners`}>
        <a href="{apiBase}/practitioners">Practitioners</a>
      </li>
      <li class:active={$page.url.pathname === `${apiBase}/practitioner-roles`}>
        <a href="{apiBase}/practitioner-roles">Practitioner Roles</a>
      </li>
    </ul>
    {/if}
  </nav>
  <main>
    <slot />
  </main>
</div>

<style>
  .app-container {
    display: flex;
    height: 100vh;
  }
  nav {
    width: 200px;
    background-color: #f0f0f0;
    padding: 20px;
  }
  ul {
    list-style-type: none;
    padding: 0;
  }
  li {
    margin-bottom: 10px;
  }
  li.active a {
    font-weight: bold;
  }
  main {
    flex-grow: 1;
    padding: 20px;
  }
  button {
    width: 100%;
    padding: 10px;
    margin-bottom: 20px;
    background-color: #007bff;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
  }
  button:disabled {
    background-color: #cccccc;
    cursor: not-allowed;
  }
  .spinner {
    display: inline-block;
    width: 20px;
    height: 20px;
    border: 2px solid rgba(255,255,255,.3);
    border-radius: 50%;
    border-top-color: #fff;
    animation: spin 1s ease-in-out infinite;
    margin-right: 10px;
  }
  @keyframes spin {
    to { transform: rotate(360deg); }
  }
</style>