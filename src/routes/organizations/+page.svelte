<script>
    import OrganizationsList from './OrganizationsList.svelte';
    import AddOrganization from './AddOrganization.svelte';
    import ImportOrganization from './ImportOrganization.svelte';
  </script>
  
  <h1>Organizations</h1>
  
  <div class="organizations-container">
    <OrganizationsList />
    <AddOrganization />
    <ImportOrganization />
  </div>
  
  <style>
    .organizations-container {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 20px;
    }
  </style>