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

  // Reactive declarations for user data and abilities
  $: userData = $user.user;
  $: ability = $abilities;

  function hasAccess(requiredActions, subject) {
    if (!requiredActions || requiredActions.length === 0 || !subject) return false;
    return requiredActions.some(action => ability.can(action, subject));
  }
</script>

<!-- Navigation Component -->
<nav class="navigation">
  {#if userData && userData.roles.length > 0 && ability.rules.length > 0}
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
          {/if}
        </div>
      {/if}
    {/each}
  {:else}
    <p>Loading navigation...</p>
  {/if}

  {#each navItems as item}
 
    <div class="nav-section">
      <!-- Use anchor tags with href -->
      <a class="nav-link" href={item.path} aria-label={item.label}>
        {#if item.icon}
          <span class="nav-icon">{item.icon}</span>
        {/if}
        {item.label}
      </a>
      {#if item.subItems && item.subItems.length > 0}
        <ul class="sub-navigation">
          {#each item.subItems as subItem}
           
              <li>
                <a class="nav-link" href={subItem.path} aria-label={subItem.label}>
                  {#if subItem.icon}
                    <span class="nav-icon">{subItem.icon}</span>
                  {/if}
                  {subItem.label}
                </a>
              </li>
            
          {/each}
        </ul>
      {/if}
    </div>
 
{/each}



  <!-- Authentication Buttons -->
  {#if !isUserAuthenticated}
    <button class="nav-button" on:click={handleLogin} aria-label="Log In with Google">Log In with Google</button>
  {:else}
    <button class="nav-button logout" on:click={handleLogout} aria-label="Log Out">Log Out</button>
  {/if}

  {#if !isFhirAuthenticated}
    <button class="nav-button" on:click={handleConnectFhir} aria-label="Connect to FHIR">Connect to FHIR</button>
  {:else}
    <button class="nav-button logout" on:click={handleDisconnectFhir} aria-label="Disconnect FHIR">Disconnect FHIR</button>
  {/if}

  {#if fhirError}
    <div class="error-message" role="alert" aria-live="assertive">
      FHIR Auth Error: {fhirError}
    </div>
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
