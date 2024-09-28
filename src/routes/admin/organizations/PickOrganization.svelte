<script>
  import { createEventDispatcher } from 'svelte';
  export let organizations = [];
  const dispatch = createEventDispatcher();

  function selectOrganization(orgId) {
    // Dispatch event with the selected organization ID
    dispatch('select', { orgId });
  }
</script>

<div class="organization-picker">
  <h3>Select an Organization</h3>
  <ul>
    {#each organizations as org}
      <li>
        <button on:click={() => selectOrganization(org.id)}>{org.name}</button>
      </li>
    {/each}
  </ul>
</div>

<style>
  .organization-picker {
    padding: 20px;
    border: 1px solid #ddd;
    border-radius: 5px;
  }

  ul {
    list-style: none;
    padding: 0;
  }

  li {
    margin: 10px 0;
  }

  button {
    padding: 10px 15px;
    border: none;
    background-color: #007bff;
    color: white;
    border-radius: 5px;
    cursor: pointer;
  }

  button:hover {
    background-color: #0056b3;
  }
</style>
