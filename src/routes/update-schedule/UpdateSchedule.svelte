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

  $: id = $page.url.searchParams.get('id');

  onMount(async () => {
    try {
      const rolesResponse = await fetch(`api/GetPractitionersRoles?id=${id}`);
      const rolesData = await rolesResponse.json();
      
      if (rolesData.practitionerRoles && Array.isArray(rolesData.practitionerRoles)) {
        practitionerRoles = rolesData.practitionerRoles;
        
        if (practitionerRoles.length === 0) {
          errorMessage = "No Roles Found.";
        } else {
          practitionerName = practitionerRoles[0].practitioner?.name || 'Unknown Practitioner';
          
          if (practitionerRoles.length === 1) {
            selectedRole = practitionerRoles[0];
            await loadCapacityForRole(selectedRole);
            updatePractitionerStore(selectedRole);
          }
        }
      } else {
        errorMessage = "Invalid data structure received from server.";
      }
    } catch (error) {
      console.error('Error fetching roles:', error);
      errorMessage = "Error fetching roles.";
    }
  });

  async function loadCapacityForRole(role) {
    try {
      const capacityResponse = await fetch(`/avail/api/GetCapacity?id=${role.id}`);
      const capacityData = await capacityResponse.json();
      role.capacity = capacityData;
    } catch (error) {
      console.error('Error fetching capacity:', error);
      errorMessage = "Error fetching capacity.";
    }
  }

  async function handleRoleSelection(role) {
    selectedRole = role;
    await loadCapacityForRole(selectedRole);
    updatePractitionerStore(role);
  }

  function updatePractitionerStore(role) {
    currentPractitioner.set({
      id: id,
      practitioner: {
        id: id,
        name: practitionerName
      },
      organizationId: role.organization?.id || null,
      organizationName: role.organization?.name || null,
      availability: role.availabilityTimes || null,
      capacity: role.capacity || null,
      PractitionerRoleId: role.id
    });
  }

  function handleCapacityChange(event) {
    const { capacityExtension } = event.detail;
    if (selectedRole) {
      selectedRole.capacity = capacityExtension[0].extension;
      updatePractitionerStore(selectedRole);
    }
  }

  function handleCalendarSubmit(availabilityData) {
    if (selectedRole) {
      selectedRole.availabilityTimes = availabilityData;
      updatePractitionerStore(selectedRole);
    }
  }

  async function handleSubmit() {
  if (!selectedRole) return;

  try {
    // Assemble the updated PractitionerRole object
    const updatedRole = {
      resourceType: "PractitionerRole",
      id: selectedRole.id,
      practitioner: { reference: `Practitioner/${selectedRole.practitioner.id}` },
      organization: { reference: `Organization/${selectedRole.organization.id}` },
      availabilityTime: selectedRole.availabilityTimes,
      extension: [
        {
          url: "https://combinebh.org/resources/FHIRResources/PractitionerCapacityFHIRExtension.html",
          extension: selectedRole.capacity
        }
      ]
    };

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
  <h1>{practitionerName}'s Schedule (in UpdateSchedule)</h1>

  {#if errorMessage}
    <p>{errorMessage}</p>
  {:else if practitionerRoles.length === 1}
    <h2>Editing Schedule for {selectedRole.organization.name}</h2>
    <button on:click={handleSubmit}>Submit</button>
    {#if updateMessage}
      <p>{updateMessage}</p>
    {/if}
    <Pick4 on:capacitychange={handleCapacityChange} capacity={selectedRole?.capacity} />
    <hr>
    <Availability availabilityTimes={selectedRole?.availabilityTimes} on:calchange={handleCalendarSubmit} />
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
      <Pick4 on:capacitychange={handleCapacityChange} capacity={selectedRole.capacity} />
      <hr>
      <Availability availabilityTimes={selectedRole.availabilityTimes} on:calchange={handleCalendarSubmit} />
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