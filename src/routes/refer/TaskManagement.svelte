<script>
    export let tasks = [];
  </script>
  
  <ul>
    {#each tasks as task}
      <li>
        Task: {task.description} - Status: {task.status}
      </li>
    {/each}
  </ul>
  