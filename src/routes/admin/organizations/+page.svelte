<!-- src/routes/admin/organizations/+page.svelte -->
<script>
  import { onMount } from 'svelte';
  import { user, abilities } from '$lib/stores.js';
  import OrganizationList from './OrganizationList.svelte';
  import AddOrganization from './AddOrganization.svelte';
  import AssociatePractitionersOrganizations from './AssociatePractitionersOrganizations.svelte';
  import PickOrganization from './PickOrganization.svelte';
  import SetUserRoles from './SetUserRoles.svelte';


  let organizations = [];
  let practitionerRoles = [];
  let selectPractitionerRole = () => {}; // Placeholder function
  let generalError = null;
  let isFetching = false;
  let retryCount = 0;
  const maxRetries = 3;
  let fetchFailed = false; // Flag to stop auto-fetching on error
  let hasFetched = false; // Flag to prevent multiple fetches

  // Reactive variables for user data and abilities
  $: userData = $user.user;
  $: ability = $abilities;

  /**
   * Check if the user has access to a specific subject.
   * @param {string} action - The action to check (e.g., 'view', 'manage').
   * @param {string} subject - The subject to check against (e.g., 'AllOrganizations').
   * @returns {boolean} - True if the user has the permission.
   */
  function hasAccess(action, subject) {
    return ability && ability.can(action, subject);
  }

  // Reactive Statement to fetch organizations
  $: if (!isFetching && userData && ability && !fetchFailed && !hasFetched) {
    if (hasAccess('view', 'AllOrganizations')) {
      fetchOrganizations().then(() => {
        hasFetched = true; // Set flag after successful fetch
      });
    } else {
      generalError = 'You do not have permission to view this page.';
    }
  } else if (!userData) {
    generalError = 'You must be logged in to view this page.';
  }

  /**
   * Fetch the list of organizations from the server.
   */
  async function fetchOrganizations() {
    if (retryCount >= maxRetries) return; // Stop fetching if max retries have been reached

    isFetching = true;
    try {
      const response = await fetch('/avail/api/organization/all', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
          // Include authentication headers if required
        }
      });

      if (response.ok) {
        organizations = await response.json();
    
        generalError = null;
        retryCount = 0; // Reset retry count on success
        fetchFailed = false; // Reset fetch failure flag
      } else {
        throw new Error('Failed to fetch organizations');
      }
    } catch (error) {
      console.error('Error fetching organizations:', error);
      generalError = 'Unable to retrieve organizations. Please try again later.';
      retryCount++;
      fetchFailed = true; // Set failure flag to prevent further auto-fetching
    } finally {
      isFetching = false;
    }
  }

  /**
   * Manually trigger a retry to fetch organizations
   */
  function retryFetch() {
    if (!isFetching && retryCount < maxRetries) {
      fetchFailed = false; // Reset failure flag to allow fetching again
      hasFetched = false; // Reset fetched flag to allow fetching
      fetchOrganizations();
    }
  }
</script>

<!-- Page Content -->


<SetUserRoles />
<hr>
<AddOrganization />
<hr>
<AssociatePractitionersOrganizations />
<hr>
<PickOrganization organizations={organizations}/>
<hr>

{#if generalError}
  <div class="error-message">
    {generalError}
    {#if retryCount < maxRetries}
      <button on:click={retryFetch}>Retry</button>
    {/if}
  </div>
{:else if organizations.length > 0}
  <OrganizationList
    {organizations}
    {practitionerRoles}
    {selectPractitionerRole}
  />
{:else}
  <p>Loading organizations...</p>
{/if}

<style>
  .error-message {
    color: red;
    font-size: 14px;
    margin-top: 10px;
  }

  button {
    margin-top: 10px;
    padding: 5px 10px;
    cursor: pointer;
  }
</style>
