<script>
    export let assignedTasks = [];
  </script>
  
  <ul>
    {#each assignedTasks as task}
      <li>
        Task: {task.description} - Due: {task.dueDate}
      </li>
    {/each}
  </ul>
  