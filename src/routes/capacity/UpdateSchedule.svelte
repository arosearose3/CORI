<script>
  import { onMount } from 'svelte';
  import { user, hasFetchedPractitionerData, updateAbilities } from '$lib/stores.js';

  import Pick4 from './Pick4.svelte';
  import Availability from './Availability.svelte';
  import { base } from '$app/paths';

  // Component state variables
  let capacityData = null;
  let availabilityData = null;
  let practitionerName = '';
  let updateMessage = '';
  let errorMessage = '';
  let practitionerRole = null;
  let isDataReady = false;
  let currentRoles = [];

  export let currentPractitionerRoleId;

  // Fetch PractitionerRole details when component mounts or ID changes
  $: if (currentPractitionerRoleId && !isDataReady) {
    console.log('Fetching PractitionerRole data for ID:', currentPractitionerRoleId);
    fetchPractitionerRole(currentPractitionerRoleId);
  }

  // React to changes in the user store
  $: if ($user.practitioner && isDataReady) {
    practitionerName = $user.practitioner.name || 'Unknown Practitioner';
    currentRoles = $user.practitioner.roles || [];
    console.log('Practitioner data ready. Name:', practitionerName, 'Roles:', currentRoles);
  }

  onMount(() => {
    console.log('Component mounted. Initial roles:', $user.practitioner?.roles);
  });

  async function fetchPractitionerRole(practitionerRoleId) {
    console.log('Fetching PractitionerRole, ID:', practitionerRoleId);
    
    try {
      const response = await fetch(`${base}/api/role/getOne?id=${practitionerRoleId}`);
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const data = await response.json();
      console.log('Fetched PractitionerRole data:', data);

      if (data.resourceType === 'PractitionerRole' || (data.resourceType === 'Bundle' && data.entry && data.entry.length > 0)) {
        practitionerRole = data.resourceType === 'PractitionerRole' ? data : data.entry[0].resource;
        
        capacityData = practitionerRole.extension?.find(
          (ext) => ext.url === 'https://combinebh.org/resources/FHIRResources/PractitionerCapacityFHIRExtension.html'
        )?.extension || [];
        
        availabilityData = practitionerRole.availableTime || [];
        
        // Ensure roles are preserved
        const roles = (practitionerRole.code || [])
          .flatMap(c => c.coding || [])
          .filter(coding => coding.system === 'https://combinebh.org/cori-value-set/')
          .map(coding => coding.code)
          .filter(Boolean);

        console.log('Roles extracted from PractitionerRole:', roles);

        // Update the user store with the fetched data
        user.update(store => {
          const updatedStore = {
            ...store,
            practitioner: {
              ...store.practitioner,
              PractitionerRoleId: practitionerRole.id,
              capacity: capacityData,
              availability: availabilityData,
              roles: store.practitioner.roles // Explicitly preserve roles
            }
          };

          // Only update roles if we have new roles and they're different from the current roles
          if (roles.length > 0 && JSON.stringify(roles) !== JSON.stringify(store.practitioner.roles)) {
            updatedStore.practitioner.roles = roles;
            console.log('Updating roles in store:', roles);
          } else {
            console.log('Keeping existing roles:', store.practitioner.roles);
          }
          
          updateAbilities(updatedStore.practitioner.roles);
  
          return updatedStore;
        });

        isDataReady = true;
      } else {
        throw new Error('Invalid PractitionerRole data structure');
      }
    } catch (error) {
      console.error('Error fetching PractitionerRole:', error);
      errorMessage = `Error fetching PractitionerRole: ${error.message}`;
    }
  }

  async function handleSubmit() {
    if (!practitionerRole) {
      errorMessage = 'No PractitionerRole data available.';
      return;
    }

    try {
      // Ensure practitionerRole has the correct structure
      if (!practitionerRole.resourceType) {
        practitionerRole.resourceType = 'PractitionerRole';
      }

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

      // Update the user store with the new capacity data, preserving roles
      user.update(store => ({
        ...store,
        practitioner: {
          ...store.practitioner,
          capacity: capacityData,
          roles: store.practitioner.roles // Explicitly preserve roles
        }
      }));

      console.log('Roles after capacity update:', $user.practitioner.roles);

    } catch (error) {
      console.error('Error updating capacity:', error);
      errorMessage = `Error updating capacity: ${error.message}`;
    }

    // Handle patching availability
    if (availabilityData && availabilityData.length > 0) {
      try {
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
        updateMessage += ' and availability';
        console.log('Successfully updated availability:', availabilityDataResponse);

        // Update the user store with the new availability data, preserving roles
        user.update(store => ({
          ...store,
          practitioner: {
            ...store.practitioner,
            availability: availabilityData,
            roles: store.practitioner.roles // Explicitly preserve roles
          }
        }));

        console.log('Roles after availability update:', $user.practitioner.roles);

      } catch (error) {
        console.error('Error updating availability:', error);
        errorMessage = `Error updating availability: ${error.message}`;
      }
    } else {
      console.log('No availability data to update.');
    }
  }

  function handleCapacityChange(event) {
    const { capacityExtension } = event.detail;
    capacityData = capacityExtension[0].extension;
  }

  function handleAvailabilityUpdate(event) {
    availabilityData = event.detail;
  }
</script>

<div>
  <h3>Capacity and Availability for {practitionerName}</h3>
  <p>Current Roles: {currentRoles.join(', ')}</p>
  
  <button on:click={handleSubmit}>Submit</button>
  {#if updateMessage}
    <p>{updateMessage}</p>
  {/if}

  {#if isDataReady}
    <Pick4 on:capacitychange={handleCapacityChange} capacity={capacityData} />
    <br><hr /><br>
    <Availability initialAvailability={availabilityData} on:availabilityUpdate={handleAvailabilityUpdate} />
  {:else}
    <p>Loading...</p>
  {/if}

  {#if errorMessage}
    <p class="error">{errorMessage}</p>
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
