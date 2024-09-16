<script>
  import { page } from '$app/stores';

  // Import all dashboard components
  import PatientDashboard from './refer/DashboardPatient.svelte';
  import ProviderDashboard from './refer/DashboardProvider.svelte';
  import CoordinatorDashboard from './refer/DashboardCoordinator.svelte';
  import CBODashboard from './refer/DashboardCBO.svelte';
  import AdminDashboard from './refer/DashboardAdmin.svelte';
  import TaskStateDiagram from './refer/TaskStateDiagram.svelte';
  import TaskAnimateProvenance from './refer/TaskAnimateProvenance.svelte';

  let currentRoute;
  let selectedDashboard = null;

  // State for connection status and loading
  let connectStatus = 'Connect FHIR';
  let isLoading = false;

  const apiBase = '/avail';

  // Reactive block to update current route based on URL changes
  $: {
    currentRoute = $page.url.pathname;
  }

  // Function to select the dashboard
  function showDashboard(dashboard = null) {
    selectedDashboard = dashboard;
  }

  // Refactored function to handle FHIR connection using utility endpoint
  async function handleConnect() {
    isLoading = true;
    try {
      const response = await fetch(`${apiBase}/api/connect`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });

      if (response.ok) {
        const result = await response.json();
        connectStatus = 'Connected';
        console.log(result.message);
      } else {
        const errorMsg = await response.text();
        connectStatus = 'Could not connect';
        console.error('Connection failed:', errorMsg);
      }
    } catch (error) {
      connectStatus = 'Could not connect';
      console.error('Error:', error);
    } finally {
      isLoading = false;
    }
  }
</script>

<!-- Layout Structure -->
<div class="app-container">
  <!-- Sidebar Navigation -->
  <nav>
    <div class="logo-section">
      <!-- Icon and Title -->
      <img src="/avail/android-chrome-192x192.png" alt="Logo" class="logo" />
      <div class="title">
        <div>Colorado</div>
        <div>Referral</div>
        <div>Information</div>
      </div>
    </div>

    <button on:click={handleConnect} disabled={isLoading}>
      {#if isLoading}
        <span class="spinner"></span>
      {/if}
      {connectStatus}
    </button>

    <ul>
      <!-- Current navigation elements (child pages) -->
      <li class:active={$page.url.pathname === `${apiBase}/organizations`}>
        <a href="{apiBase}/organizations">Organizations</a>
      </li>
      <li class:active={$page.url.pathname === `${apiBase}/practitioners`}>
        <a href="{apiBase}/practitioners">Practitioners</a>
      </li>
      <li class:active={$page.url.pathname === `${apiBase}/practitioner-roles`}>
        <a href="{apiBase}/practitioner-roles">Practitioner Roles</a>
      </li>
      <li class:active={$page.url.pathname === `${apiBase}/refer`}>
        <a href="{apiBase}/refer">Referrals</a>
      </li>

      <!-- Links to dashboards -->
      <li>
        <a href="#" on:click={() => showDashboard('patient')}>Patient Dashboard</a>
      </li>
      <li>
        <a href="#" on:click={() => showDashboard('provider')}>Provider Dashboard</a>
      </li>
      <li>
        <a href="#" on:click={() => showDashboard('coordinator')}>Coordinator Dashboard</a>
      </li>
      <li>
        <a href="#" on:click={() => showDashboard('cbo')}>CBO Dashboard</a>
      </li>
      <li>
        <a href="#" on:click={() => showDashboard('admin')}>Admin Dashboard</a>
      </li>
    </ul>
  </nav>

  <!-- Main content -->
  <main>
    <!-- Render dashboards if selected -->
    {#if selectedDashboard === 'patient'}
      <PatientDashboard />
    {/if}

    {#if selectedDashboard === 'provider'}
      <ProviderDashboard />
    {/if}

    {#if selectedDashboard === 'coordinator'}
      <CoordinatorDashboard />
    {/if}

    {#if selectedDashboard === 'cbo'}
      <CBODashboard />
    {/if}

    {#if selectedDashboard === 'admin'}
      <AdminDashboard />
    {/if}

    <!-- Render child pages in the slot -->
    {#if !selectedDashboard}
      <slot />
    {/if}
  </main>
</div>

<!-- Styling -->
<style>
  :global(body) {
    font-family: 'Roboto', sans-serif;
  }

  .app-container {
    display: flex;
    height: 100vh;
  }

  nav {
    width: 200px;
    background-color: #f0f0f0;
    padding: 20px;
  }

  .logo-section {
    display: flex;
    flex-direction: column;
    align-items: flex-start; /* Ensure items are left-aligned */
  }

  .logo {
    width: 70px; /* Adjust size of the logo */
    height: auto;
    margin-bottom: 10px; /* Space between logo and text */
  }



  .title div {
    font-size: 12px;
    line-height: 1.5; /* Adjust line height */
    text-align: left; /* Left-align text */
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

  li a {
    text-decoration: none;
    color: black;
  }

  li.active a {
    color: #007bff;
  }

  li a:hover {
    text-decoration: underline;
  }

  button {
    width: 100%;
    padding: 10px;
    margin-bottom: 20px;
    margin-top: 20px;
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
