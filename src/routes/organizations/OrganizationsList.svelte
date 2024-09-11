<script>
    import { onMount } from 'svelte';
  
    let organizations = [];
  
    onMount(async () => {
      try {
        const response = await fetch('/avail/api/allOrganizations');
        if (response.ok) {
          organizations = await response.json();
        } else {
          console.error('Failed to fetch organizations');
        }
      } catch (error) {
        console.error('Error fetching organizations:', error);
      }
    });
  </script>
  
  <div class="organizations-list">
    <h2>Organizations List</h2>
    {#if organizations.length > 0}
      <ul>
        {#each organizations as org}
          <li>{org.name}</li>
        {/each}
      </ul>
    {:else}
      <p>No organizations found.</p>
    {/if}
  </div>
  
  <style>
    .organizations-list {
      background-color: #f0f0f0;
      padding: 15px;
      border-radius: 5px;
    }
  </style>