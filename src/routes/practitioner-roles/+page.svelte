<script>
    import AssociatePractitionersOrganizations from './AssociatePractitionersOrganizations.svelte';
    import AllRoles from './AllRoles.svelte';
    import { currentPractitioner } from '$lib/practitionerStore.js';

  </script>
  
  <h1>Practitioner Roles</h1>

  {#if $currentPractitioner.practitioner.name && $currentPractitioner.organizationName}
    <div>
      Current Practitioner: {$currentPractitioner.practitioner.name}
      <br>
      Organization: {$currentPractitioner.organizationName}
    </div>
  {:else}
    <div>No practitioner selected</div>
  {/if}
  
  <p>Current Practitioner Details:</p>
  <pre>{JSON.stringify($currentPractitioner, null, 2)}</pre>
  
  <div class="practitioner-roles-container">
    <div class="top-row">
      <AllRoles />
      <AssociatePractitionersOrganizations />
    </div>
    <div class="full-width">
    </div>
  </div>
  
  <style>
    .practitioner-roles-container {
      display: flex;
      flex-direction: column;
      gap: 20px;
    }
  
    .top-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 20px;
    }
  
    .full-width {
      width: 100%;
      padding: 10px;
      box-sizing: border-box;
    }
  </style>