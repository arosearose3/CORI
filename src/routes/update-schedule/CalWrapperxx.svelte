<script>
    import { currentPractitioner } from '$lib/practitionerStore.js';
    import AvailabilityEditor from './Availability.svelte';
  
    let availabilityResource = {};
    let resourceString = '';

//CalendarWrapper handles sending  PractitionerRole to the calendar, and receiving
//updates to the calandar info, and submits to the FHIR server on Submit. 

    function createPractitionerRoleResource( availabilityResource) {
      const resource = {
  resourceType: "PractitionerRole",
  id: $currentPractitioner.id || undefined,
  active: true,
  practitioner: {
    reference: `Practitioner/${$currentPractitioner.practitioner.id}`,
    display: $currentPractitioner.practitioner.name
  },
  organization: {
    reference: `Organization/${$currentPractitioner.organizationId}`,
    display: $currentPractitioner.organizationName
  },
  availableTime: availabilityResource
};
      // Remove any undefined or null values
      const cleanResource = JSON.parse(JSON.stringify(resource));
      // Remove any newline characters or other unwanted whitespace
      const cleanString = JSON.stringify(cleanResource).replace(/\\n/g, "").replace(/\s+/g, " ");
      return cleanString;
}


    function handleAvailabilityUpdate(event) {
     console.log('Availability updated:', event.detail);
    availabilityResource = event.detail;
    resourceString = createPractitionerRoleResource(availabilityResource);
     console.log('Resource:', availabilityResource);
  }
  


    async function handleSubmit() {
      // patch parts together to make the FHIR Resource to update. 
      // updating an existing PractitionerRole to include the availability. 


      try {
        const response = await fetch('api/updateRole', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: resourceString,
        });
  
        if (!response.ok) {
          throw new Error('Failed to update availability');
        }
  
        const result = await response.json();
        console.log('Availability updated successfully:', result);
        // You might want to show a success message to the user here
      } catch (error) {
        console.error('Error updating availability:', error);
        // You might want to show an error message to the user here
      }
    }
  

  </script>
  
  <div class="cal-wrapper">
    {#if $currentPractitioner.practitioner.name && $currentPractitioner.organizationName}
      <div class="practitioner-info">
        Current Practitioner: {$currentPractitioner.practitioner.name} 
        | Organization: {$currentPractitioner.organizationName}
      </div>
    {:else}
      <div class="practitioner-info">No practitioner selected</div>
    {/if}
<br>  
    
  
   
    <AvailabilityEditor on:availabilityUpdate={handleAvailabilityUpdate}/>
  <br><br>resourceString: {resourceString}
  <br>
  <button on:click={handleSubmit} disabled={!$currentPractitioner.practitioner.id}>
    Submit Availability
  </button>
   
  </div>
  
  <style>
    .cal-wrapper {
      max-width: 800px;
      margin: 0 auto;
      padding: 20px;
      position: relative;
    }
  
    .practitioner-info {
      margin-bottom: 20px;
      font-weight: bold;
    }
  
    button {
      margin-top: 20px;
      padding: 10px 20px;
      background-color: #4CAF50;
      color: white;
      border: none;
      cursor: pointer;
      font-size: 16px;
    }
  
    button:hover {
      background-color: #45a049;
    }
  
    button:disabled {
      background-color: #cccccc;
      cursor: not-allowed;
    }
  </style>