<script>
    import AddPractitioner from './AddPractitioner.svelte';

   
    import addPractitioner from './AddPractitioner.svelte';
   
  </script>
  
  <h1>Practitioners</h1>
  
  <div class="practitioner-container">
 
    <AddPractitioner />
  
  </div>
  
  <style>
    .practitioner-container {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 20px;
    }
  </style>