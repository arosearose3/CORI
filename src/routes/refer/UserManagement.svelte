<script>
    export let users = [];
  
    function deactivateUser(userId) {
      console.log(`Deactivating user: ${userId}`);
    }
  </script>
  
  <ul>
    {#each users as user}
      <li>
        {user.name} ({user.role})
        <button on:click={() => deactivateUser(user.id)}>Deactivate</button>
      </li>
    {/each}
  </ul>
  