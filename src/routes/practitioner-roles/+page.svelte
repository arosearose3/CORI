<script>
    import AssociatePractitionersOrganizations from './AssociatePractitionersOrganizations.svelte';
    import AllRoles from './AllRoles.svelte';
    import AvailabilityEditor from './AvailabilityEditor2.svelte';
  </script>
  
  <h1>Practitioner Roles</h1>
  
  <div class="practitioner-roles-container">
    <div class="top-row">
      <AllRoles />
      <AssociatePractitionersOrganizations />
    </div>
    <div class="full-width">
      <AvailabilityEditor />
    </div>
  </div>
  
  <style>
    .practitioner-roles-container {
      display: flex;
      flex-direction: column;
      gap: 20px;
    }
  
    .top-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 20px;
    }
  
    .full-width {
      width: 100%;
      padding: 10px;
      box-sizing: border-box;
    }
  </style>