<script>
    import AssignedTasks from './AssignedTasks.svelte';
    import CompletedProcedures from './CompletedProcedures.svelte';
  
    let assignedTasks = []; // Fetch assigned tasks from API or store
    let completedProcedures = []; // Fetch procedures
  </script>
  
  <div>
    <h1>CBO Dashboard</h1>
    <section>
      <h2>Assigned Tasks</h2>
      <AssignedTasks {assignedTasks} />
    </section>
  
    <section>
      <h2>Completed Procedures</h2>
      <CompletedProcedures {completedProcedures} />
    </section>
  </div>
  