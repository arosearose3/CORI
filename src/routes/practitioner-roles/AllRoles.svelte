<script>
  import { onMount } from 'svelte';
  import { currentPractitioner } from '$lib/practitionerStore.js';
  import { writable } from 'svelte/store';

  let roles = [];
  let sortColumn = 'practitioner';
  let sortDirection = 'asc';
  let selectedRole = null;
  let loading = true;

  onMount(async () => {
    await fetchRoles();
  });

  async function fetchRoles() {
    loading = true;
    try {
      const response = await fetch('/avail/api/role/all');
      const data = await response.json();

      if (data.entry && Array.isArray(data.entry)) {
        roles = await Promise.all(data.entry.map(async entry => {
          const role = entry.resource;
          
          // Fetch Practitioner name
          const practitionerResponse = await fetch(`/avail/api/practitioner/${role.practitioner.reference.split('/')[1]}`);
          const practitionerData = await practitionerResponse.json();
          const practitionerName = practitionerData.name?.text || 'Unknown';

          // Fetch Organization name
          const organizationResponse = await fetch(`/avail/api/organization/${role.organization.reference.split('/')[1]}`);
          const organizationData = await organizationResponse.json();
          const organizationName = organizationData.name || 'Unknown';

          return {
            id: role.id,
            practitioner: { name: practitionerName },
            organization: { name: organizationName },
            availability: role.availableTime || []
          };
        }));
        sortRoles();
      } else {
        console.error('Unexpected response format:', data);
      }
    } catch (error) {
      console.error('Error fetching roles:', error);
    } finally {
      loading = false;
    }
  }

  function sortRoles() {
    roles = roles.sort((a, b) => {
      const factor = sortDirection === 'asc' ? 1 : -1;
      if (sortColumn === 'practitioner') {
        return a.practitioner.name.localeCompare(b.practitioner.name) * factor;
      } else {
        return a.organization.name.localeCompare(b.organization.name) * factor;
      }
    });
    roles = [...roles]; // Trigger reactivity
  }

  function handleSort(column) {
    if (sortColumn === column) {
      sortDirection = sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      sortColumn = column;
      sortDirection = 'asc';
    }
    sortRoles();
  }

  function handleRoleSelection(role) {
    selectedRole = role;
    $currentPractitioner = {
      id: role.id,
      practitioner: {
        id: role.id,
        name: role.practitioner.name
      },
      organizationId: role.organization.id,
      organizationName: role.organization.name,
      availability: role.availability || null
    };
    console.log("currentPractitioner:", JSON.stringify($currentPractitioner));
  }
</script>

<div class="container">
  <h2>All Practitioner-Organization Roles</h2>

  {#if loading}
    <div class="spinner-container">
      <div class="spinner"></div>
      <p>Loading roles...</p>
    </div>
  {:else}
    <table>
      <thead>
        <tr>
          <th>Select</th>
          <th on:click={() => handleSort('practitioner')}>
            Practitioner Name
            {#if sortColumn === 'practitioner'}
              <span class="sort-indicator">{sortDirection === 'asc' ? '▲' : '▼'}</span>
            {/if}
          </th>
          <th on:click={() => handleSort('organization')}>
            Organization Name
            {#if sortColumn === 'organization'}
              <span class="sort-indicator">{sortDirection === 'asc' ? '▲' : '▼'}</span>
            {/if}
          </th>
        </tr>
      </thead>
      <tbody>
        {#each roles as role (role.id)}
          <tr>
            <td>
              <input
                type="radio"
                name="roleSelection"
                value={role.id}
                on:change={() => handleRoleSelection(role)}
                checked={selectedRole === role}
              />
            </td>
            <td>{role.practitioner.name}</td>
            <td>{role.organization.name}</td>
          </tr>
        {/each}
      </tbody>
    </table>


  {/if}
</div>

<style>
  .container {
    padding: 20px;
    background-color: #f9f9f9;
    border-radius: 8px;
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  }

  h2 {
    font-size: 1.8em;
    margin-bottom: 20px;
    color: #333;
  }

  table {
    width: 100%;
    border-collapse: collapse;
    margin-bottom: 20px;
  }

  th, td {
    padding: 10px;
    text-align: left;
    border-bottom: 1px solid #ddd;
  }

  th {
    cursor: pointer;
    background-color: #f1f1f1;
    font-weight: bold;
  }

  th.sort-indicator {
    padding-left: 5px;
  }

  tbody tr:hover {
    background-color: #f5f5f5;
  }

  .spinner-container {
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .spinner {
    border: 4px solid rgba(0, 0, 0, 0.1);
    border-radius: 50%;
    border-top: 4px solid #3498db;
    width: 24px;
    height: 24px;
    animation: spin 1s linear infinite;
    margin-right: 10px;
  }

  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }

  .current-role {
    margin-top: 20px;
    font-weight: bold;
  }

  input[type="radio"] {
    margin-right: 10px;
  }

  .sort-indicator {
    font-size: 0.8em;
    padding-left: 5px;
  }
</style>
