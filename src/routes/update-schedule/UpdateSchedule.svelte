<script>
  import { onMount } from 'svelte';
  import Pick4 from './Pick4.svelte';
  import Availability from './Availability.svelte';

  export let currentPractitionerId; // Accept practitioner ID as a prop

  let id;
  let practitionerRoles = [];
  let selectedRole = null;
  let errorMessage = '';
  let practitionerName = '';
  let updateMessage = '';
  let capacityData = null;
  let availabilityData = null;

  // Fetch the practitioner ID from the URL
  onMount(() => {
    
    id = currentPractitionerId;
    if (id) {
      fetchRoles(id);
    } else {
      errorMessage = "No Practitioner ID provided.";
    }
  });

  // Process roles response and set roles
  async function fetchRoles(practitionerId) {
    try {
      const rolesResponse = await fetch(`/avail/api/role/PractitionerRole?practitioner=Practitioner/${practitionerId}`);
      const rolesData = await rolesResponse.json();
      if (rolesData.resourceType === 'Bundle') {
        practitionerRoles = processRolesResponse(rolesData);
        if (practitionerRoles.length > 0) {
          fetchPractitioner(practitionerRoles[0].practitionerId);
          if (practitionerRoles.length === 1) {
            handleRoleSelection(practitionerRoles[0]);
          }
        } else {
          errorMessage = "No Roles Found.";
        }
      } else {
        errorMessage = "Invalid data received from server.";
      }
    } catch (error) {
      console.error('Error fetching roles:', error);
      errorMessage = "Error fetching roles.";
    }
  }

  // Process the roles response to extract relevant information
  function processRolesResponse(data) {
    return data.entry.map(entry => {
      const role = entry.resource;
      const practitionerId = role.practitioner?.reference?.split('/')[1];
      const organizationId = role.organization?.reference?.split('/')[1];
      const capacity = role.extension?.find(ext =>
        ext.url === "https://combinebh.org/resources/FHIRResources/PractitionerCapacityFHIRExtension.html"
      )?.extension || [];
      return {
        id: role.id,
        practitionerId,
        organizationId,
        availableTime: role.availableTime || [],
        capacity,
      };
    });
  }

  // Fetch practitioner details
  async function fetchPractitioner(practitionerId) {
    console.log("update sched, fetchPract, practitionerId:" + practitionerId);
    try {
        const response = await fetch(`/avail/api/practitioner/${practitionerId}`);
        const data = await response.json();

        console.log("update sched, fetchPract, data:" + JSON.stringify(data));

        // Construct practitionerName using 'given' and 'family' fields
        const givenNames = data.name?.[0]?.given?.join(' ') || '';
        const familyName = data.name?.[0]?.family || '';
      //  practitionerName = `${givenNames} ${familyName}`.trim() || 'Unknown Practitioner';
      practitionerName = `${givenNames}`|| 'Unknown Practitioner';
    } catch (error) {
        console.error('Error fetching practitioner:', error);
        practitionerName = 'Unknown Practitioner';
    }
}

  // Fetch organization details
  async function fetchOrganization(organizationId) {
    try {
      const response = await fetch(`/avail/api/organization/${organizationId}`);
      const data = await response.json();
      selectedRole.organization = {
        id: organizationId,
        name: data.name || 'Unknown Organization',
      };
    } catch (error) {
      console.error('Error fetching organization:', error);
      selectedRole.organization.name = 'Unknown Organization';
    }
  }

  // Handle role selection
  async function handleRoleSelection(role) {
    selectedRole = role;
    capacityData = role.capacity;
    availabilityData = role.availableTime;
    await fetchOrganization(role.organizationId);
  }

  // Handle form submission to update role
  async function handleSubmit() {
    if (!selectedRole) return;
    try {
      const updatedRole = {
        resourceType: "PractitionerRole",
        id: selectedRole.id,
        practitioner: { reference: `Practitioner/${selectedRole.practitionerId}` },
        organization: { reference: `Organization/${selectedRole.organizationId}` },
        availableTime: selectedRole.availableTime,
      };

      if (selectedRole.capacity && selectedRole.capacity.length > 0) {
        updatedRole.extension = [
          {
            url: "https://combinebh.org/resources/FHIRResources/PractitionerCapacityFHIRExtension.html",
            extension: selectedRole.capacity
          }
        ];
      }

      const response = await fetch('/avail/api/role/update', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedRole),
      });

      if (!response.ok) throw new Error('Failed to update the practitioner role.');

      const result = await response.json();
      updateMessage = "Capacity and Availability updated.";
    } catch (error) {
      console.error(error);
      updateMessage = "Failed to update Capacity and/or Availability.";
    }
  }

  // Handle capacity change from Pick4 component
  function handleCapacityChange(event) {
    const { capacityExtension } = event.detail;
    if (selectedRole) {
      selectedRole.capacity = capacityExtension[0].extension;
      capacityData = selectedRole.capacity;
    }
  }

  // Handle availability update from Availability component
  function handleAvailabilityUpdate(event) {
    const newAvailability = event.detail;
    if (selectedRole) {
      selectedRole.availableTime = newAvailability;
      availabilityData = newAvailability;
    }
  }
</script>

<div>
  {#if practitionerRoles.length > 0}
    <h2>{practitionerName}'s Capacity and Availability</h2>
  {:else}
    <h3>{errorMessage}</h3>
  {/if}

  {#if practitionerRoles.length === 1}
    <h2>Editing Schedule for {selectedRole.organization?.name}</h2>
    <button on:click={handleSubmit}>Submit</button>
    {#if updateMessage}
      <p>{updateMessage}</p>
    {/if}
    <Pick4 on:capacitychange={handleCapacityChange} capacity={capacityData} />
    <hr>
    <Availability initialAvailability={availabilityData} on:availabilityUpdate={handleAvailabilityUpdate} />
  {:else if practitionerRoles.length > 1}
    <h2>Select an Organization</h2>
    <form>
      {#each practitionerRoles as role}
        <label>
          <input type="radio" name="organization" value={role.id} on:change={() => handleRoleSelection(role)} />
          {role.organizationId}
        </label><br />
      {/each}
    </form>
    {#if selectedRole}
      <h3>Editing Schedule for {selectedRole.organization?.name}</h3>
      <button on:click={handleSubmit}>Submit</button>
      {#if updateMessage}
        <p>{updateMessage}</p>
      {/if}
      <Pick4 on:capacitychange={handleCapacityChange} capacity={capacityData} />
      <hr>
      <Availability initialAvailability={availabilityData} on:availabilityUpdate={handleAvailabilityUpdate} />
    {/if}
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
