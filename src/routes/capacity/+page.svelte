<script>
  import { user } from '$lib/stores.js';
  import UpdateSchedule from './UpdateSchedule.svelte';

  let currentPractitionerRoleId = null;  //this is going to be a JSON object 
  let practitionerId = null;
  let isLoading = true;


  // Reactive statement to get user data from the nested 'user' property
  $: userData = $user.user;

  // Check if practitioner data is available and set practitionerId
  $: if (userData && userData.practitioner) {
    practitionerId = userData.practitioner.id;
    currentPractitionerRoleId = userData.PractitionerRoleId;
    isLoading = false;
    console.log('Practitioner data found. practitionerId set to:', practitionerId);
  } else {
    console.warn('User or practitioner data is not available.');
  }
</script>

<hr>
<!-- Display a loading message or handle it appropriately -->
{#if isLoading}
  <p>Loading practitioner data...</p>
  <p>Current practitionerId: {practitionerId} (should be null if still loading)</p>
{:else}
  <!-- Display the practitioner ID for debugging -->
  <p>Practitioner ID: {practitionerId}</p>
  <!-- Render the UpdateSchedule component once practitionerId is loaded -->
  <UpdateSchedule currentPractitionerRoleId={currentPractitionerRoleId} />
{/if}
<hr>
