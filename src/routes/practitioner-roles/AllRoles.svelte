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
      const response = await fetch('/avail/api/allRoles');
      roles = await response.json();
      console.log("roles:" + JSON.stringify(roles));
      sortRoles();
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
      id: role.practitioner.id,
      name: role.practitioner.name
    },
    organizationId: role.organization.id,
    organizationName: role.organization.name,
    availability: role.availability || null,
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

    <div class="current-role">
      <strong>Current Provider Role:</strong>
      {#if $currentPractitioner.practitioner.name}
        {$currentPractitioner.practitioner.name} at {$currentPractitioner.organizationName}
      {:else}
        No role selected
      {/if}
    </div>
  {/if}
</div>

<style>
  /* ... (styles remain unchanged) ... */
</style>