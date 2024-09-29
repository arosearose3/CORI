<script>
  import { onMount } from 'svelte';
  import { user } from '$lib/stores.js';
  import UpdateSchedule from './UpdateSchedule.svelte';

  let currentPractitionerRoleId = null;
  let practitionerId = null;
  let isLoading = true;

  // Subscribe to the user store to access practitioner data
  let unsubscribeUser;

  // Function to set practitioner data once it is available
  function setPractitionerData(value) {
    if (value && value.practitioner && value.practitioner.id) {
      practitionerId = value.practitioner.id;
      currentPractitionerRoleId = value.practitioner.PractitionerRoleId;
      isLoading = false;
      console.log('Practitioner data loaded:', value.practitioner);
    } else {
      console.warn('User or practitioner data is not available.');
    }
  }

  // Subscribe to the store and handle data changes
  onMount(() => {
    unsubscribeUser = user.subscribe(value => {
      setPractitionerData(value);
    });

    return () => {
      // Unsubscribe when component is destroyed to avoid memory leaks
      if (unsubscribeUser) unsubscribeUser();
    };
  });
</script>

<!-- Display a loading message or handle it appropriately -->
{#if isLoading}
  <p>Loading practitioner data...</p>
{:else}
  <UpdateSchedule currentPractitionerRoleId={currentPractitionerRoleId} /> 
{/if}

