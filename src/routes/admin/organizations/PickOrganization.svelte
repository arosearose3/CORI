<script>
  //
  // Lists all Organizations as buttons and emits selectOrg to parent
  //
  import StaffList from './StaffList.svelte';
  import { createEventDispatcher } from 'svelte';
  export let organizations = [];
  const dispatch = createEventDispatcher();

  let currentOrgId;
  let currentOrgName;
  let orgSelected=false;

  function selectOrganization(orgId, orgName) {
    // Dispatch event with the selected organization ID
    //dispatch('OrgSelected', { orgId });

    currentOrgId = orgId;
    currentOrgName = orgName;
    orgSelected = true;

  }

  function restoreList() {
    // Reset the current selection and show the organization list again
    currentOrgId = null;
    currentOrgName = null;
    orgSelected = false;
  }

 

</script>

{#if !orgSelected}
  <div class="organization-picker">
    <h3>Select an Organization</h3>
    <ul>
      {#each organizations as org}
        <li>
          <button on:click={() => selectOrganization(org.id, org.name)}>{org.name}</button>
        </li>
      {/each}
    </ul>
  </div>
{/if}

{#if orgSelected}
-in pickOrg-
  <StaffList organizationId={currentOrgId} organizationName={currentOrgName} on:RestoreList={restoreList}/>
{/if}


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
