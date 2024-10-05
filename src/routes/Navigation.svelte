<script>
  import { navItems } from '$lib/navConfig.js';
  import { user, abilities } from '$lib/stores.js';
  import { base } from '$app/paths'; // Import base path

  export let isUserAuthenticated;
  export let handleLogin;
  export let handleLogout;
  export let handleConnectFhir;
  export let handleDisconnectFhir;
  export let isFhirAuthenticated;
  export let fhirError;

  // Reactive subscriptions to stores
  $: userData = $user;
  $: ability = $abilities;

    // Helper variables with default values
  $: userRoles = userData?.practitioner?.roles ?? [];
  $: abilityRules = ability?.rules ?? [];


  // Check access function
  function hasAccess(requiredActions, subject) {
    //console.log('hasAccess called:', requiredActions, subject); // Debugging log to ensure it's called
    if (!requiredActions || requiredActions.length === 0 || !subject) return false;
    return requiredActions.some(action => ability?.can(action, subject));
  }
</script>

<nav class="navigation">

  <div class="nav-section">
    <a class="nav-link" href={base}/demoflow aria-label="Task Flow Demo">
      "Task Flow Demo"
    </a>
    <a class="nav-link" href={base}/capacity aria-label="Availability/Capacity Demo">
      "Availability/Capacity Demo"
    </a>
  </div>


  <!-- Ensure conditions are met to trigger the each block -->
  {#if userRoles.length > 0 && abilityRules.length > 0}    
    {#each navItems as item}
      {#if hasAccess(['view'], item.subject)} 
        <div class="nav-section">
          <a class="nav-link" href={item.path} aria-label={item.label}>
            {#if item.icon}
              <span class="nav-icon">{item.icon}</span>
            {/if}
            {item.label}
          </a>
        </div>
      {/if}
    {/each}
  {:else}
  <!-- <p>Loading navigation...</p>-->
    
  {/if}
</nav>


<style>
  .navigation {
    width: 100%;
  }
  .nav-section {
    margin-bottom: 5px;
  }
  .nav-link {
    display: flex;
    align-items: center;
    padding: 3px 5px;
    text-decoration: none;
    color: #333;
    border-radius: 4px;
    transition: background-color 0.3s;
    font-size: 14px;
   
  }
  .nav-link:hover {
    background-color: #e0e0e0;
  }
</style>
