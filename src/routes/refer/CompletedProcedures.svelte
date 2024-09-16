<script>
    export let completedProcedures = [];
  </script>
  
  <ul>
    {#each completedProcedures as procedure}
      <li>
        Procedure: {procedure.description} - Date: {procedure.date}
      </li>
    {/each}
  </ul>
  