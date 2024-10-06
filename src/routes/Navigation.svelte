<script>
  import { navItems } from '$lib/navConfig.js';
  import { user, abilities } from '$lib/stores.js';
  import { base } from '$app/paths';

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

  // Ensure userRoles is always an array
  $: userRoles = userData?.practitioner?.roles ?? [];

  // Determine if user has only one role
  $: hasSingleRole = userRoles.length === 1;

  // Initialize the expanded/collapsed state for each role to false (collapsed by default)
  let expandedRoles = {};

  // Initialize expandedRoles for each user role to be collapsed by default
  $: if (userRoles.length > 1) {
    expandedRoles = userRoles.reduce((acc, role) => {
      acc[role] = false;
      return acc;
    }, {});
  }

  // Function to toggle the visibility of a role's nav links
  function toggleRole(role) {
    expandedRoles = { ...expandedRoles, [role]: !expandedRoles[role] };
  }

  // Check access function - now checks role-specific permissions using CASL
  function hasAccess(action, subject) {
    return ability?.can(action, subject); // Check if the user has specific action permission for the subject
  }

  // Check if a nav item belongs to the specific role
  function belongsToRole(item, role) {
    // Ensure the role is valid for the nav item and the user has access to the subject for 'view'
    return item.roles.includes(role) && hasAccess('view', item.subject);
  }
</script>

<nav class="navigation">
  <!-- Ensure conditions are met to trigger the each block -->
  {#if userRoles.length > 0 }
    {#if hasSingleRole}
      <!-- Display nav items directly for single role -->
      <div class="nav-links single-role">
        {#each navItems.filter(item => belongsToRole(item, userRoles[0])) as item}
          <a class="nav-link" href={item.path} aria-label={item.label}>
            {#if item.icon}
              <span class="nav-icon">{item.icon}</span>
            {/if}
            {item.label}
          </a>
        {/each}
      </div>
    {:else}
      <!-- Display collapsible sections for multiple roles -->
      {#each userRoles as role}
        <div class="role-section">
          <div class="role-header" on:click={() => toggleRole(role)}>
            <span>{role}</span>
            <span class="icon">{expandedRoles[role] ? '▲' : '▼'}</span> <!-- Toggle icon -->
          </div>
          
          <!-- Role-specific navigation items with animation -->
          <div class="nav-links" class:expanded={expandedRoles[role]}>
            {#each navItems.filter(item => belongsToRole(item, role)) as item}
              <a class="nav-link" href={item.path} aria-label={item.label}>
                {#if item.icon}
                  <span class="nav-icon">{item.icon}</span>
                {/if}
                {item.label}
              </a>
            {/each}
          </div>
        </div>
      {/each}
    {/if}
  {/if}
</nav>

<style>
  .navigation {
    width: 100%;
  }

  /* Role Header */
  .role-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    cursor: pointer;
    padding: 10px 5px;
    font-weight: bold;
    background-color: #f0f0f0;
    border-radius: 4px;
    margin-bottom: 5px;
    transition: background-color 0.3s;
  }

  .role-header:hover {
    background-color: #e0e0e0;
  }

  /* Toggle icon */
  .icon {
    font-size: 12px;
    margin-left: 5px;
  }

  /* Navigation links inside each role */
  .nav-links {
    max-height: 0;
    overflow: hidden;
    transition: max-height 0.3s ease-out, opacity 0.3s ease-out;
    opacity: 0;
  }

  /* Expanded state for role's navigation links */
  .nav-links.expanded {
    max-height: 500px; /* Set a large enough value for the animation to work */
    opacity: 1;
  }

  /* Single role nav links */
  .nav-links.single-role {
    max-height: none;
    opacity: 1;
  }

  /* Each navigation link */
  .nav-link {
    display: block;
    padding: 8px 10px;
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