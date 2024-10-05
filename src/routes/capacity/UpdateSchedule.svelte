<script>
  import { onMount } from 'svelte';
  import { user } from '$lib/stores.js';
  import Pick4 from './Pick4.svelte';
  import Availability from './Availability.svelte';
  import { base } from '$app/paths'; // Import base path

  // Component state variables

  let capacityData = null;
  let availabilityData = null;
  let practitionerName = '';
  let updateMessage = '';
  let errorMessage = '';
  let practitionerRole = null; //this will be a JSON object with the PR

  let isDataReady = false;

  export let currentPractitionerRoleId; // ID passed in from the parent component

  // Fetch PractitionerRole details from the server when component mounts or ID changes
  $: if (currentPractitionerRoleId) {
    fetchPractitionerRole(currentPractitionerRoleId);
  }

  // Fetch PractitionerRole details from the server
  async function fetchPractitionerRole(practitionerRoleId) {
    try {
      console.log ("in fetch 1 PRid:"+practitionerRoleId);


      const response = await fetch(`${base}/api/role/getOne?id=${practitionerRoleId}`);
      const data = await response.json();
      console.log ("in fetch 2 data:"+JSON.stringify(data));

      if (data.resourceType === 'PractitionerRole') {
        practitionerRole = data; // Extract the PractitionerRole resource
          const roleInfo = {
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

          console.log("Direct PractitionerRole retrieved:", JSON.stringify(roleInfo));
      capacityData = roleInfo.capacity;
      availabilityData = roleInfo.availableTime;
      console.log ("updatesched/fetchPr/ifPR availabilityData:"+JSON.stringify(availabilityData));
      practitionerName = $user.practitioner.name || 'Unknown Practitioner';
      isDataReady = true; // Mark data as ready

    }
      // Check if the response is a Bundle and extract the PractitionerRole resource
      else if (data.resourceType === 'Bundle' && data.entry && data.entry.length > 0) {
        const entry = data.entry[0]; // Get the first entry
        if (entry.resource && entry.resource.resourceType === 'PractitionerRole') {
          practitionerRole = entry.resource; // Extract the PractitionerRole resource
          let roleInfo = {
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

          console.log("Bundle PractitionerRole retrieved:", JSON.stringify(roleInfo));
        capacityData = roleInfo.capacity;
        availabilityData = roleInfo.availableTime;
        console.log ("updatesched/fetchPr/Bundle availabilityData:"+JSON.stringify(availabilityData));
        practitionerName = $user.practitioner.name || 'Unknown Practitioner';
        isDataReady = true; // Mark data as ready

      }else {
          errorMessage = 'Failed to retrieve PractitionerRole resource from the Bundle.';
        }
      } else {
        errorMessage = 'Failed to retrieve PractitionerRole. No matching entries found.';
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

      const response = await fetch(`${base}/api/role/patchCapacity`, {
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

    //now patch Availability
     // Handle patching availability
     try{
     if (availabilityData && availabilityData.length > 0) {
      const availabilityResponse = await fetch(`${base}/api/role/patchAvailability`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          practitionerRole,
          availableTime: availabilityData,
        }),
      });

      if (!availabilityResponse.ok) throw new Error('Failed to update the availability.');

      const availabilityDataResponse = await availabilityResponse.json();
      updateMessage += ' and availability'; // Update message for both patches
      console.log('Successfully updated availability:', availabilityDataResponse);
    } else {
      console.log('No availability data to update.');
    }
  } catch (error) {
    console.error('Error updating capacity or availability:', error.message);
    errorMessage = 'Error updating capacity or availability.';
  }
}

  // Handle capacity change from Pick4 component
  function handleCapacityChange(event) {
    const { capacityExtension } = event.detail;
      capacityData = capacityExtension[0].extension;
    
  }

  // Handle availability update from Availability component
  function handleAvailabilityUpdate(event) {
    const newAvailability = event.detail;
      availabilityData = newAvailability;
  }
</script>

<div>
  <h3>Capacity and Availability</h3>
 
    <button on:click={handleSubmit}>Submit</button>
    {#if updateMessage}
      <p>{updateMessage}</p>
    {/if}

  <!-- Render Availability regardless of whether data is ready or currentPractitionerRoleId is null -->
  {#if isDataReady || currentPractitionerRoleId === null}
    <Pick4 on:capacitychange={handleCapacityChange} capacity={capacityData} />
    <br><hr /><br>
    <Availability initialAvailability={availabilityData} on:availabilityUpdate={handleAvailabilityUpdate} />
  {:else}
    <p>Loading...</p> <!-- Optional loading message -->
  {/if}

  {#if errorMessage}
  <p>{errorMessage}</p>
{/if}
    <!-- <h3>{errorMessage}</h3> -->
  
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
