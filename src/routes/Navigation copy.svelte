<script>
  import { navItems } from '$lib/navConfig.js';
  import { user, abilities } from '$lib/stores.js';

  export let isUserAuthenticated;
  export let handleLogin;
  export let handleLogout;
  export let handleConnectFhir;
  export let handleDisconnectFhir;
  export let isFhirAuthenticated;
  export let fhirError;

    // Declare reactive variables
  let userData;
  let ability;

  // Reactive subscriptions to the stores
  $: userData = $user.user; // Subscribe to the whole user store
  $: ability = $abilities; // Subscribe to the abilities store

  $: console.log('Updated Ability Rules:', $abilities.rules);

  // Key to force re-render of the navigation component when roles or abilities change
  let navKey = 0;

  // Watch for changes in userData roles or ability rules to trigger re-render
  $: if (userData?.roles && ability?.rules) {
    console.log('User Data:', userData);
    console.log('Ability Rules:', ability?.rules);
    navKey += 1; // Increment key to force re-render when user data or abilities change
  }

  /**
   * Check if the user has access to perform actions on a given subject.
   * @param {Array} requiredActions - Actions the user needs to perform (e.g., ['view'])
   * @param {string} subject - The subject to check against (e.g., 'AllOrganizations')
   * @returns {boolean} - Whether the user has access
   */
  function hasAccess(requiredActions, subject) {
    console.log ("nav/hasaccess reqActions:"+requiredActions);
    console.log ("nav/hasaccess subject:"+subject);
    if (!requiredActions || requiredActions.length === 0 || !subject) return false;
    // Ensure that ability is used reactively
    return requiredActions.some(action => ability?.can(action, subject));
  }
</script>

<hr>Navtop<br>

<nav class="navigation" key={navKey}>
  {#if Array.isArray(userData?.roles) && userData.roles.length > 0 && Array.isArray(ability?.rules) && ability.rules.length > 0}
    {#each navItems as item}
      {#if hasAccess(['view'], item.subject)}
        <div class="nav-section">
          <!-- Use anchor tags with href -->
          <a class="nav-link" href={item.path} aria-label={item.label}>
            {#if item.icon}
              <span class="nav-icon">{item.icon}</span>
            {/if}
            {item.label}
          </a>
          <!-- Uncomment this section if you want to include sub-items
          {#if item.subItems && item.subItems.length > 0}
            <ul class="sub-navigation">
              {#each item.subItems as subItem}
                {#if hasAccess(['view'], subItem.subject)}
                  <li>
                    <a class="nav-link" href={subItem.path} aria-label={subItem.label}>
                      {#if subItem.icon}
                        <span class="nav-icon">{subItem.icon}</span>
                      {/if}
                      {subItem.label}
                    </a>
                  </li>
                {/if}
              {/each}
            </ul>
          {/if} -->
        </div>
      {/if}
    {/each}
  {:else}
    <!-- Optional fallback for loading state
    <p>Loading navigation...</p> -->
  {/if}


</nav>

<br>Navbottom<hr>

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
    font-size: 0.8rem;
  }

  .nav-link:hover {
    background-color: #e0e0e0;
  }

  .nav-icon {
    margin-right: 8px;
  }

  .sub-navigation {
    list-style: none;
    padding-left: 20px;
    margin-top: 5px;
  }

  .sub-navigation li {
    margin-bottom: 5px;
  }

  .nav-button {
    margin: 8px 0;
    padding: 10px 15px;
    background-color: #007bff;
    color: white;
    border: none;
    cursor: pointer;
    border-radius: 4px;
    width: 100%;
    text-align: left;
    font-size: 14px;
    transition: background-color 0.3s;
  }

  .nav-button:hover {
    background-color: #0056b3;
  }

  .nav-button:disabled {
    background-color: #ccc;
    cursor: not-allowed;
  }

  .nav-button.logout {
    background-color: #dc3545;
  }

  .nav-button.logout:hover {
    background-color: #c82333;
  }

  .error-message {
    color: red;
    font-size: 14px;
    margin-top: 10px;
  }
</style>
