<script>
  import { onMount } from 'svelte';
  import Pick4 from './Pick4.svelte';
  import { page } from '$app/stores';
  import { currentPractitioner } from '$lib/practitionerStore.js';
  import Availability from './Availability.svelte';

  let id;
  let practitionerRoles = [];
  let selectedRole = null;
  let errorMessage = '';
  let practitionerName = '';
  let updateMessage = '';
  let capacityData = null;
  let availabilityData = null; // Keeping `availabilityData` consistent for available time.

  $: id = $page.url.searchParams.get('id');

  // Set availability and capacity data reactively when selectedRole changes
  $: if (selectedRole) {
    capacityData = selectedRole.capacity;
    availabilityData = selectedRole.availableTime || []; // Use `availableTime` consistently.
  }

    // Helper function to process the roles response from the server
    function processRolesResponse(data) {
  const roles = [];

  if (data.entry && Array.isArray(data.entry)) {
    data.entry.forEach(entry => {
      const role = entry.resource;
      const practitionerId = role.practitioner?.reference?.split('/')[1] || null;
      const organizationId = role.organization?.reference?.split('/')[1] || null;

      // Find capacity extension if it exists
      const capacityExtension = role.extension?.find(ext => 
        ext.url === "https://combinebh.org/resources/FHIRResources/PractitionerCapacityFHIRExtension.html"
      );

      const capacity = capacityExtension ? capacityExtension.extension : [];

      roles.push({
        id: role.id,
        practitionerId,
        organizationId,
        availableTime: role.availableTime || [],
        capacity, // Add capacity to the role
      });
    });
  }

  return roles;
}


  // Load the practitioner's roles and handle the selection
   // Load the practitioner's roles and handle the selection
  onMount(async () => {
    try {
      const rolesResponse = await fetch(`/avail/api/role/PractitionerRole?practitioner=Practitioner/${id}`);
      const rolesData = await rolesResponse.json();

      if (rolesData.resourceType === 'Bundle') {
        practitionerRoles = processRolesResponse(rolesData);

        if (practitionerRoles.length === 0) {
          errorMessage = "No Roles Found.";
        } else {
          // Set practitioner name from the first role
          practitionerName = practitionerRoles[0].practitionerId || 'Unknown Practitioner';

          // If only one role, auto-select it
          if (practitionerRoles.length === 1) {
            selectedRole = practitionerRoles[0];
            loadCapacityForRole2(selectedRole);
            updatePractitionerStore(selectedRole);
            console.log("Selected Role:", JSON.stringify(selectedRole));
          }
        }
      } else {
        errorMessage = "No server connection or invalid data structure received from server.";
      }
    } catch (error) {
      console.error('Error fetching roles:', error);
      errorMessage = "Error fetching roles.";
    }
  });

  // Load capacity for the selected role
  async function loadCapacityForRole(role) {
    try {
      const capacityResponse = await fetch(`/avail/api/GetCapacity?id=${role.id}`);
      const capacityResponseData = await capacityResponse.json();
      role.capacity = capacityResponseData.capacity;
      capacityData = role.capacity; // Update reactive capacity data
      console.log('Capacity data:', capacityData);
    } catch (error) {
      console.error('Error fetching capacity:', error);
      errorMessage = "Error fetching capacity.";
    }
  }

  /**
 * Load capacity data for a PractitionerRole if it's not already present.
 * This function assumes that the PractitionerRole object already contains the capacity data.
 *
 * @param {Object} role - The PractitionerRole object.
 * @returns {Object} - The capacity data for the role, or null if no capacity is found.
 */
function loadCapacityForRole2(role) {
  // Check if the PractitionerRole has the capacity extension already
  const capacityExtension = role.extension?.find(ext =>
    ext.url === "https://combinebh.org/resources/FHIRResources/PractitionerCapacityFHIRExtension.html"
  );

  // If the capacity extension exists, return the capacity data
  if (capacityExtension) {
    return capacityExtension.extension;
  }

  // If no capacity data is found, return null
  return null;
}

  // Load availability for the selected role
  async function loadAvailabilityForRole(role) {
    try {
      role.availableTime = role.availableTime || []; // Stick to `availableTime`
      availabilityData = role.availableTime;
      console.log('Availability data:', availabilityData);
    } catch (error) {
      console.error('Error setting availability:', error);
      errorMessage = "Error setting availability.";
    }
  }

  // Handle role selection
  async function handleRoleSelection(role) {
    selectedRole = role;
    await loadCapacityForRole2(selectedRole);
    await loadAvailabilityForRole(selectedRole);
    updatePractitionerStore(role);
  }

  // Update the practitioner store with the selected role
  function updatePractitionerStore(role) {
    currentPractitioner.set({
      id: id,
      practitioner: {
        id: id,
        name: practitionerName
      },
      organizationId: role.organization?.id || null,
      organizationName: role.organization?.name || null,
      availability: role.availableTime || null, // Consistently using `availableTime`
      capacity: role.capacity || null,
      PractitionerRoleId: role.id
    });
  }

  // Handle capacity change from Pick4 component
  function handleCapacityChange(event) {
    const { capacityExtension } = event.detail;
    if (selectedRole) {
      selectedRole.capacity = capacityExtension[0].extension;
      capacityData = selectedRole.capacity; // Update reactive variable
      updatePractitionerStore(selectedRole);
    }
  }

  // Handle availability update from Availability component
  function handleAvailabilityUpdate(event) {
    const newAvailability = event.detail;
    
    // Ensure selectedRole is not null or undefined
    if (selectedRole) {
      // Update selectedRole's availableTime and ensure Svelte detects changes
      selectedRole = {
        ...selectedRole,
        availableTime: newAvailability // Consistently using `availableTime`
      };
      
      // Update the reactive `availabilityData` variable so the UI updates
      availabilityData = newAvailability;
      
      // Update practitioner store to persist the changes
      updatePractitionerStore(selectedRole);

      console.log('Updated availability data:', JSON.stringify(selectedRole.availableTime));
    } else {
      console.error('selectedRole is null or undefined in handleAvailabilityUpdate.');
    }
  }

  // Handle form submission and send the updated role to the server
  async function handleSubmit() {
    if (!selectedRole) return;

    try {
      // Assemble the updated PractitionerRole object
      const updatedRole = {
        resourceType: "PractitionerRole",
        id: selectedRole.id,
        practitioner: { reference: `Practitioner/${selectedRole.practitioner.id}` },
        organization: { reference: `Organization/${selectedRole.organization.id}` },
        availableTime: selectedRole.availableTime // Correct usage of availableTime
      };

      // Log the availableTime to ensure it's correctly populated
      console.log("Submitting updated role with availableTime:", JSON.stringify(selectedRole.availableTime));
      
      // Only include capacity extension if it's not empty
      if (selectedRole.capacity && Object.keys(selectedRole.capacity).length > 0) {
        updatedRole.extension = [
          {
            url: "https://combinebh.org/resources/FHIRResources/PractitionerCapacityFHIRExtension.html",
            extension: selectedRole.capacity
          }
        ];
      }

      const response = await fetch('/avail/api/updateRole', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedRole),
      });

      if (!response.ok) {
        throw new Error('Failed to update the practitioner role.');
      }

      const result = await response.json();
      console.log(result.message);
      updateMessage = "Capacity and Availability updated.";
    } catch (error) {
      console.error(error);
      updateMessage = "Failed to update Capacity and/or Availability.";
    }
  }
</script>

<div>
  {#if practitionerRoles.length > 0}
  <h2>{practitionerName}'s Capacity and Availability</h2>
  {:else}
  <h3>No practitioner loaded. Try connecting to the server.</h3>
  {/if}

  {#if errorMessage}
    <p>{errorMessage}</p>
  {:else if practitionerRoles.length === 1}
    <h2>Editing Schedule for {selectedRole.organization.name}</h2>
    <button on:click={handleSubmit}>Submit</button>
    {#if updateMessage}
      <p>{updateMessage}</p>
    {/if}
   
      <Pick4 on:capacitychange={handleCapacityChange} capacity={capacityData} />
  
    <hr>
    {#if availabilityData}
      <Availability initialAvailability={availabilityData} on:availabilityUpdate={handleAvailabilityUpdate} />
    {:else}
      <p>Loading availability data...</p>
    {/if}
  {:else if practitionerRoles.length > 1}
    <h2>Select an Organization</h2>
    <form>
      {#each practitionerRoles as role}
        <label>
          <input type="radio" name="organization" value={role.id} on:change={() => handleRoleSelection(role)} />
          {role.organization.name}
        </label><br/>
      {/each}
    </form>

    {#if selectedRole}
      <h3>Editing Schedule for {selectedRole.organization.name}</h3>
      <button on:click={handleSubmit}>Submit</button>
      {#if updateMessage}
        <p>{updateMessage}</p>
      {/if}
      {#if capacityData}
        <Pick4 on:capacitychange={handleCapacityChange} capacity={capacityData} />
      {:else}
        <p>Loading capacity data...</p>
      {/if}
      <hr>
      {#if availabilityData}
      <Availability initialAvailability={availabilityData} on:availabilityUpdate={handleAvailabilityUpdate} />
      {:else}
      <p>Loading availability data...</p>
     {/if}
    {/if}
  {/if}
</div>

<style>
  h1 {
    font-size: 1.8em;
    color: #333;
    margin-bottom: 20px;
  }

  h2 {
    font-size: 1.5em;
    color: #444;
    margin-top: 20px;
  }

  h3 {
    font-size: 1.3em;
    color: #555;
    margin-top: 15px;
  }

  form {
    margin-top: 15px;
  }

  label {
    display: block;
    margin-bottom: 10px;
  }

  input[type="radio"] {
    margin-right: 10px;
  }

  button {
    margin-bottom: 10px;
    padding: 5px 10px;
    background-color: #4CAF50;
    color: white;
    border: none;
    cursor: pointer;
  }

  button:hover {
    background-color: #45a049;
  }
</style>