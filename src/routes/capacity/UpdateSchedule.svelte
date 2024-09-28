<script>
  import { onMount } from 'svelte';
  import { user } from '$lib/stores.js';
  import Pick4 from './Pick4.svelte';
  import Availability from './Availability.svelte';

  // Component state variables
  let selectedRole = null;
  let capacityData = null;
  let availabilityData = null;
  let practitionerName = '';
  let updateMessage = '';
  let errorMessage = '';
  let practitionerRole = null;

  export let currentPractitionerRoleId; // ID passed in from the parent component

  // Fetch PractitionerRole details from the server when component mounts or ID changes
  $: if (currentPractitionerRoleId) {
    fetchPractitionerRole(currentPractitionerRoleId);
  }

  // Fetch PractitionerRole details from the server
  async function fetchPractitionerRole(practitionerRoleId) {
    try {
      const response = await fetch(`/avail/api/role/PractitionerRole/${practitionerRoleId}`);
      const data = await response.json();

      if (data.resourceType === 'PractitionerRole') {
        practitionerRole = data;
        selectedRole = {
          id: practitionerRole.id,
          practitionerId: practitionerRole.practitioner?.reference.split('/')[1],
          organizationId: practitionerRole.organization?.reference.split('/')[1],
          availableTime: practitionerRole.availableTime || [],
          capacity: practitionerRole.extension?.find(
            (ext) =>
              ext.url ===
              'https://combinebh.org/resources/FHIRResources/PractitionerCapacityFHIRExtension.html'
          )?.extension || [],
        };
        capacityData = selectedRole.capacity;
        availabilityData = selectedRole.availableTime;
        practitionerName = $user.practitioner.name || 'Unknown Practitioner';
      } else {
        errorMessage = 'Failed to retrieve PractitionerRole.';
      }
    } catch (error) {
      console.error('Error fetching PractitionerRole:', error);
      errorMessage = 'Error fetching PractitionerRole.';
    }
  }

  // Handle form submission to update role
  async function handleSubmit() {
    if (!practitionerRole) {
      errorMessage = 'No PractitionerRole data available.';
      return;
    }

    try {
      let capacity = null;
      if (capacityData && capacityData.length > 0) {
        capacity = {
          url: 'https://combinebh.org/resources/FHIRResources/PractitionerCapacityFHIRExtension.html',
          extension: capacityData,
        };
      }

      const response = await fetch('/patchCapacity', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          practitionerRole,
          capacity,
        }),
      });

      if (!response.ok) throw new Error('Failed to update the capacity.');

      const data = await response.json();
      updateMessage = 'Successfully updated capacity';
      console.log('Successfully updated capacity:', data);
    } catch (error) {
      console.error('Error updating capacity:', error.message);
      errorMessage = 'Error updating capacity.';
    }
  }

  // Handle capacity change from Pick4 component
  function handleCapacityChange(event) {
    const { capacityExtension } = event.detail;
    if (practitionerRole) {
      capacityData = capacityExtension[0].extension;
    }
  }

  // Handle availability update from Availability component
  function handleAvailabilityUpdate(event) {
    const newAvailability = event.detail;
    if (practitionerRole) {
      practitionerRole.availableTime = newAvailability;
      availabilityData = newAvailability;
    }
  }
</script>

<hr>
<div>
  <h2>{practitionerName}'s Capacity and Availability</h2>
  {#if selectedRole}
    <h2>Editing Schedule for {selectedRole.organizationId}</h2>
    <button on:click={handleSubmit}>Submit</button>
    {#if updateMessage}
      <p>{updateMessage}</p>
    {/if}
    <Pick4 on:capacitychange={handleCapacityChange} capacity={capacityData} />
    <hr />
    <Availability initialAvailability={availabilityData} on:availabilityUpdate={handleAvailabilityUpdate} />
  {:else}
    <h3>{errorMessage}</h3>
  {/if}
</div>

<style>
  h1, h2, h3 {
    font-size: 1.5em;
    color: #333;
  }
  button {
    padding: 10px;
    margin: 10px 0;
    background-color: #4CAF50;
    color: white;
    border: none;
    cursor: pointer;
  }
  button:hover {
    background-color: #45a049;
  }
  label {
    display: block;
    margin: 10px 0;
  }
  form {
    margin-bottom: 20px;
  }
</style>
