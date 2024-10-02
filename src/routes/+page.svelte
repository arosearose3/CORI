<script>
    import { page } from '$app/stores';
  
    $: console.log('Received URL in SvelteKit:', $page.url.pathname);
  </script>
  
  <h1>Welcome to the Application</h1>