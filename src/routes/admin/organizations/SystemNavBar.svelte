<script>
  import { onMount } from 'svelte';
  import ChooseOrg from './ChooseOrg.svelte';
  import LoadData from './LoadData.svelte';
  import SystemStatus from './SystemStatus.svelte';
  import OrgNavBar from './oneOrg/OrgNavBar.svelte';
  import AddOrganization from './AddOrganization.svelte'; 
  import AssociateProviders from './AssociateProviders.svelte'; 
  import SetRoles from './SetUserRoles.svelte'; 
  import ExclusionAdmin from './ExclusionAdmin.svelte'; // Import the ExclusionAdmin component

  import { createEventDispatcher } from 'svelte';
  const dispatch = createEventDispatcher();

  let activeView = 'orgs';
  let chosenOrg;
  let showChooseOrg = true;

  function setView(view) {
    console.log("Setting active view to:", view);  // Debugging line
    activeView = view;
  }

  function handleOrgChosen(event) {
    chosenOrg = event.detail;
    console.log('Org chosen:', chosenOrg);
    showChooseOrg = false;
  }
</script>

<!-- Navigation bar -->
<div class="navbar">
  <a class={activeView === 'orgs' ? 'active' : ''} on:click={() => setView('orgs')}>Orgs</a>
  <a class={activeView === 'status' ? 'active' : ''} on:click={() => setView('status')}>System Status</a>
  <a class={activeView === 'loadData' ? 'active' : ''} on:click={() => setView('loadData')}>Load Data</a>
  <a class={activeView === 'addOrg' ? 'active' : ''} on:click={() => setView('addOrg')}>Add Organization</a>
  <a class={activeView === 'associateProviders' ? 'active' : ''} on:click={() => setView('associateProviders')}>Associate Providers</a>
  <a class={activeView === 'setRoles' ? 'active' : ''} on:click={() => setView('setRoles')}>Set Roles</a>
  <a class={activeView === 'exclusion' ? 'active' : ''} on:click={() => setView('exclusion')}>Exclusion Files</a> <!-- Added Exclusion Files option -->
</div>

<!-- Conditional rendering for each view -->
{#if activeView === 'orgs'}
  {#if showChooseOrg}
  <ChooseOrg on:OrgChosen={handleOrgChosen} />
  {:else if chosenOrg}
  <OrgNavBar orgId={chosenOrg} />
  {/if}
{/if}

{#if activeView === 'status'}
  <SystemStatus />
{/if}

{#if activeView === 'loadData'}
  <LoadData />
{/if}

{#if activeView === 'addOrg'}
  <AddOrganization />
{/if}

{#if activeView === 'associateProviders'}
  <AssociateProviders />
{/if}

{#if activeView === 'setRoles'}
  <SetRoles />
{/if}

{#if activeView === 'exclusion'}
  <ExclusionAdmin /> <!-- Render ExclusionAdmin when Exclusion Files is selected -->
{/if}

<style>
  .navbar {
      display: flex;
      justify-content: space-around;
      background-color: #333;
      padding: 1em;
  }

  .navbar a {
      color: white;
      text-decoration: none;
      padding: 0.5em 1em;
      cursor: pointer;
  }

  .navbar a:hover {
      background-color: #555;
  }

  .active {
      background-color: #007bff;
  }
</style>
