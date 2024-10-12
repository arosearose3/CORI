<script>
    //
    // this presents a Fetch button and an org name, 
    // and fetches staff when button is pressed.
    //

    import { onMount } from 'svelte';
    import axios from 'axios';
    import { base } from '$app/paths'; // Import base path
    
    import { createEventDispatcher } from 'svelte';

    const dispatch = createEventDispatcher();

  
    export let organizationId ; 
    export let organizationName;
    let staff = [];
    let loading = false;
    let error = null;
  
    function handleRestoreList() {
    // Emit the RestoreList event to tell the parent to show the org list again
    dispatch('RestoreList');
  }

    // Function to fetch staff from the server
    async function fetchStaff() {
      loading = true;
      error = null;
      try {
        const response = await axios.get(`${base}/api/practitioner/getStaffForOrg`, {
          params: {
            organizationId,
          },
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/fhir+json',
          },
        });
  
        // Extract staff data from the response
        const { entry } = response.data;
  
        // Map the entries into a usable format
        staff = entry.map(item => {
          const practitioner = item.resource;
          return {
            givenNames: practitioner.name?.[0]?.given?.join(' ') || 'Unknown',
            familyName: practitioner.name?.[0]?.family || 'Unknown',
            dob: practitioner.birthDate || 'Unknown',
            npi: practitioner.identifier?.find(id => id.system === 'http://hl7.org/fhir/sid/us-npi')?.value || 'Unknown',
          };
        });
      } catch (e) {
        error = e.response ? e.response.data : e.message;
        console.error('Error fetching staff:', error);
      } finally {
        loading = false;
      }
    }
  </script>
  
  <button on:click="{fetchStaff}" disabled={loading}>
    {#if loading}Loading...{/if}
    {#if !loading}Fetch Staff for {organizationName}{/if}
  </button>
  
  {#if error}
    <p class="error">Error: {error}</p>
  {/if}
  
  <button on:click={handleRestoreList}>Back to Organization List</button>
  
  {#if staff.length > 0}
    <table>
      <thead>
        <tr>
          <th>Name</th>
          <th>Date of Birth</th>
          <th>NPI</th>
        </tr>
      </thead>
      <tbody>
        {#each staff as member}
          <tr>
            <td>{member.givenNames} {member.familyName}</td>
            <td>{member.dob}</td>
            <td>{member.npi}</td>
          </tr>
        {/each}
      </tbody>
    </table>
  {:else if !loading}
    <p>No staff data available. Click "Fetch Staff" to retrieve the data.</p>
  {/if}
  
  <style>
    .error {
      color: red;
    }
  
    table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 1em;
    }
  
    th, td {
      border: 1px solid #ddd;
      padding: 8px;
      text-align: left;
    }
  
    th {
      background-color: #f4f4f4;
    }
  
    button {
      margin-top: 1em;
    }
  </style>
  