<script>
    import { onMount } from 'svelte';
  
    let roles = [];
    let sortColumn = 'practitioner';
    let sortDirection = 'asc';
  
    onMount(async () => {
      await fetchRoles();
    });
  
    async function fetchRoles() {
      try {
        const response = await fetch('/avail/api/allRoles');
        roles = await response.json();
        console.log ("roles:"+ JSON.stringify(roles));
        sortRoles();
      } catch (error) {
        console.error('Error fetching roles:', error);
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
  </script>
  
  <div class="container">
    <h2>All Practitioner-Organization Roles</h2>
    
    <table>
      <thead>
        <tr>
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
            <td>{role.practitioner.name}</td>
            <td>{role.organization.name}</td>
          </tr>
        {/each}
      </tbody>
    </table>
  </div>
  
  <style>
    .container {
      max-width: 800px;
      margin: 0 auto;
      padding: 20px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 20px;
    }
    th, td {
      border: 1px solid #ddd;
      padding: 8px;
      text-align: left;
    }
    th {
      background-color: #f2f2f2;
      cursor: pointer;
    }
    th:hover {
      background-color: #e6e6e6;
    }
    .sort-indicator {
      margin-left: 5px;
    }
  </style>