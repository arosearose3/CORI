<script context="module">
  export async function load({ params, fetch }) {
    const practitionerId = params.practitionerId; // Assuming practitionerId is part of the URL
    return {practitionerId }
    };


  export let currentPractitionerId;

</script>

<UpdateSchedule {currentPractitionerId} />


