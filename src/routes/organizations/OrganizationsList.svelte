<script>
  import { onMount } from 'svelte';

  let organizations = [];

  onMount(async () => {
    try {
      const response = await fetch('/avail/api/organization/all');
      if (response.ok) {
        const data = await response.json();
        // Check if data has an 'entry' array and map the organization resources
        if (data.entry && Array.isArray(data.entry)) {
          organizations = data.entry.map(entry => entry.resource);
        } else {
          console.error('No organizations found or invalid response format');
        }
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
        <li>
          <strong>{org.name}</strong>
          <br />
          Contact: {org.contact ? org.contact[0].name.text : 'No contact available'}
          <br />
          Phone: {org.contact && org.contact[0].telecom ? org.contact[0].telecom.find(t => t.system === 'phone')?.value || 'No phone' : 'No phone'}
          <br />
          Email: {org.contact && org.contact[0].telecom ? org.contact[0].telecom.find(t => t.system === 'email')?.value || 'No email' : 'No email'}
        </li>
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
