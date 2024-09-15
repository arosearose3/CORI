<script>
    import AddPractitioner from './AddPractitioner.svelte';
    import IngestPractitioners from './IngestPractitioners.svelte';
    import AllPractitioners from './AllPractitioners.svelte';
</script>
  
  <h1>Practitioners</h1>
  
  <div class="practitioner-container">
 
    <AddPractitioner />
    <IngestPractitioners /> 
    <AllPractitioners />  
  
  </div>
  
  <style>
    .practitioner-container {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 20px;
    }
  </style>