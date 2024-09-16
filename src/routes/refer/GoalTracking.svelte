<script>
    export let goals = [];
  </script>
  
  <ul>
    {#each goals as goal}
      <li>
        Goal: {goal.description} - Progress: {goal.progress}%
      </li>
    {/each}
  </ul>
  