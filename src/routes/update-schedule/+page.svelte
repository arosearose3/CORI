<script>
    import { page } from '$app/stores';
    import UpdateSchedule from './UpdateSchedule.svelte';
  
    // Use the $page store to access query parameters
    $: id = $page.url.searchParams.get('id');
  </script>
  
  <div>
    <h1>Update Schedule for ID: {id}</h1>
<hr>
<UpdateSchedule id={id} />

  </div>