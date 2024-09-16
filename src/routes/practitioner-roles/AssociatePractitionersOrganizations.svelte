<script>
  import { onMount } from 'svelte';

  let practitioners = [];
  let organizations = [];
  let associations = [];
  let message = '';

  // Fetch practitioners and organizations when the component is mounted
  onMount(async () => {
    await fetchPractitioners();
    await fetchOrganizations();
  });

  // Function to fetch practitioners and transform the FHIR response
  async function fetchPractitioners() {
    try {
      const response = await fetch('/avail/api/practitioner/all');
      const data = await response.json();

      // Check if the response is a FHIR bundle and has entries
      if (data.resourceType === 'Bundle' && Array.isArray(data.entry)) {
        practitioners = data.entry.map(entry => {
          const practitioner = entry.resource;
          return {
            id: practitioner.id || '',
            displayName: `${practitioner.name[0]?.given?.join(' ') || ''} ${practitioner.name[0]?.family || ''}`,
          };
        });
      } else {
        throw new Error('Invalid Practitioner FHIR Bundle format');
      }
    } catch (error) {
      console.error('Error fetching practitioners:', error);
      message = 'Error fetching practitioners. Please try again.';
    }
  }

  // Function to fetch organizations and transform the FHIR response
  async function fetchOrganizations() {
    try {
      const response = await fetch('/avail/api/organization/all');
      const data = await response.json();

      // Check if the response is a FHIR bundle and has entries
      if (data.resourceType === 'Bundle' && Array.isArray(data.entry)) {
        organizations = data.entry.map(entry => {
          const organization = entry.resource;
          return {
            id: organization.id || '',
            name: organization.name || 'Unnamed Organization',
          };
        });
      } else {
        throw new Error('Invalid Organization FHIR Bundle format');
      }
    } catch (error) {
      console.error('Error fetching organizations:', error);
      message = 'Error fetching organizations. Please try again.';
    }
  }

  // Function to add a new practitioner-organization association
  function addAssociation() {
    associations = [...associations, { practitionerId: '', organizationId: '' }];
  }

  // Function to remove an association from the list
  function removeAssociation(index) {
    associations = associations.filter((_, i) => i !== index);
  }

  // Function to handle the form submission and update practitioner roles
  async function handleSubmit() {
    try {
      const practitionerRoles = associations.map(assoc => ({
        resourceType: 'PractitionerRole',
        practitioner: {
          reference: `Practitioner/${assoc.practitionerId}`,
        },
        organization: {
          reference: `Organization/${assoc.organizationId}`,
        },
        active: true,
      }));

      const response = await fetch('/avail/api/role/update', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ practitionerRoles }),
      });

      const result = await response.json();

      if (response.ok) {
        message = 'Associations updated successfully';
        associations = [];
      } else {
        message = `Error: ${result.error || 'Unknown error occurred'}`;
      }
    } catch (error) {
      console.error('Error in handleSubmit:', error);
      message = `Error: ${error.message || 'Unknown error occurred'}`;
    }
  }

  // Function to cancel the form and reset the associations
  function handleCancel() {
    associations = [];
    message = '';
  }
</script>

<div class="container">
  <h2>Associate Practitioners with Organizations</h2>

  <button on:click={addAssociation}>Add Association</button>

  {#each associations as association, index}
    <div class="association">
      <!-- Practitioner dropdown -->
      <select bind:value={association.practitionerId}>
        <option value="">Select Practitioner</option>
        {#each practitioners as practitioner}
          <option value={practitioner.id}>{practitioner.displayName}</option>
        {/each}
      </select>

      <!-- Organization dropdown -->
      <select bind:value={association.organizationId}>
        <option value="">Select Organization</option>
        {#each organizations as organization}
          <option value={organization.id}>{organization.name}</option>
        {/each}
      </select>

      <button on:click={() => removeAssociation(index)}>Remove</button>
    </div>
  {/each}

  <div class="actions">
    <button on:click={handleSubmit}>Submit</button>
    <button on:click={handleCancel}>Cancel</button>
  </div>

  {#if message}
    <p class="message">{message}</p>
  {/if}
</div>

<style>
  .container {
    max-width: 600px;
    margin: 0 auto;
    padding: 20px;
  }
  .association {
    display: flex;
    gap: 10px;
    margin-bottom: 10px;
  }
  select {
    flex-grow: 1;
  }
  .actions {
    margin-top: 20px;
  }
  button {
    margin-right: 10px;
  }
  .message {
    margin-top: 15px;
    padding: 10px;
    background-color: #f0f0f0;
    border-radius: 4px;
  }
</style>
