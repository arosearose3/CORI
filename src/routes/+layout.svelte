<!-- src/components/Layout.svelte -->
<script>
  import { onMount, onDestroy } from 'svelte';
  import { user, abilities } from '$lib/stores.js';
  import { updateAbilities } from '$lib/stores.js';

  import {
    initFhirAuth,
    handleFhirAuth,
    checkAuthStatus as checkFhirAuthStatus,
    authError as fhirAuthError,
    disconnectFhirAuth
  } from '$lib/auth/googleFhirAuth.js';
  
  import { Ability, AbilityBuilder } from '@casl/ability';
  import { goto } from '$app/navigation';
  import Navigation from './Navigation.svelte';
  import DebugSection from './DebugSection.svelte';
  import { navItems } from '$lib/navConfig.js'; // Import navConfig.js
  
  // State Variables
  let userData = null;
  let ability = null;
  let isFhirAuthenticated = false;
  let fhirError = null;
  let practitionerId = null;
  let practitionerName = null;
  let practitionerRoles = []; // Array of PractitionerRole resources
  let selectedRole = null;
  let roles = [];
  let organizations = [];
  let hasFetchedPractitionerData = false; // Flag to prevent redundant fetching
  let fetchError = null; // User-facing error message
  let isInitializing = true; // Loading state for initialization
  let isFetchingPractitioner = false; // Loading state for fetching practitioner data

  // Derived State
  $: isUserAuthenticated = !!userData?.id;

  // Function to reset practitioner-related data
  function resetPractitionerData() {
    practitionerId = null;
    practitionerName = null;
    practitionerRoles = [];
    selectedRole = null;
    roles = [];
    organizations = [];
    hasFetchedPractitionerData = false;
  }



  // Update ability based on userData and set abilities store
  const unsubscribeAbilities = abilities.subscribe(value => {
    ability = value;
  });

  // Subscriptions to stores
  const unsubscribeUser = user.subscribe(async value => {
    userData = value?.user || null;

    if (isUserAuthenticated && userData?.email && !hasFetchedPractitionerData) {
      isFetchingPractitioner = true;
      await fetchPractitionerData(userData.email);
      hasFetchedPractitionerData = true; // Set flag to prevent re-fetching
      isFetchingPractitioner = false;
    } else if (!isUserAuthenticated) {
      resetPractitionerData(); // Reset data when user is not authenticated
      abilities.set(new Ability([])); // Clear abilities
    }

    
    // Abilities are already managed in stores.js via setUser and updateAbilities
  });

  const unsubscribeFhirError = fhirAuthError.subscribe(value => {
    fhirError = value;
    isFhirAuthenticated = !value;
  });

  // Initialize FHIR authentication on mount
  onMount(async () => {
    try {
      await initFhirAuth();
      isFhirAuthenticated = await checkFhirAuthStatus();
      isInitializing = false;
    } catch (error) {
      console.error('Initialization error:', error);
      fetchError = 'Initialization failed. Please try again.';
      isInitializing = false;
    }
  });

  // Cleanup subscriptions on destroy
  onDestroy(() => {
    unsubscribeUser();
    unsubscribeAbilities();
    unsubscribeFhirError();
  });

  // Authentication Handlers
  async function handleLogin() {
    await handleFhirAuth();
  }

  async function handleLogout() {
    await disconnectFhirAuth();
    resetPractitionerData(); // Ensure data is reset on logout
    abilities.set(new Ability([])); // Clear abilities
    goto('/avail'); // Redirect after logout
  }

  async function handleConnectFhir() {
    await handleFhirAuth();
  }

  async function handleDisconnectFhir() {
    await disconnectFhirAuth();
    resetPractitionerData(); // Optionally reset data on FHIR disconnect
    abilities.set(new Ability([])); // Clear abilities
    goto('/avail'); // Redirect after disconnection
  }

  /**
   * Fetch practitioner data using the provided email.
   * @param {string} email - User's email address.
   */
  async function fetchPractitionerData(email) {
    try {
      const response = await fetch(`/avail/api/practitioner/findWithEmail?email=${encodeURIComponent(email)}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
          // Include authentication headers if required
        }
      });

      if (response.ok) {
        const data = await response.json();

        if (Array.isArray(data) && data.length > 0) {
          practitionerId = data[0]?.id || null;
          practitionerName = data[0]?.name || 'Unknown Practitioner';

          // Fetch associated PractitionerRoles
          await fetchPractitionerRoles(practitionerId);
        } else {
          console.error('No practitioner data found for the provided email.');
          fetchError = 'No practitioner data found for the provided email.';
        }
      } else {
        throw new Error('Failed to fetch practitioner data');
      }
    } catch (error) {
      console.error('Error fetching practitioner data:', error);
      fetchError = 'Unable to retrieve practitioner information. Please try again later.';
    }
  }

  /**
   * Fetch PractitionerRole resources associated with the Practitioner.
   * @param {string} practitionerId - Identifier for the practitioner.
   */
  async function fetchPractitionerRoles(practitionerId) {
    try {
      const response = await fetch(`/avail/api/role/PractitionerRole?practitioner=${encodeURIComponent(practitionerId)}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
          // Include authentication headers if required
        }
      });

      if (response.ok) {
        const bundle = await response.json();

        // Ensure the bundle has an 'entry' array
        const entries = Array.isArray(bundle.entry) ? bundle.entry : [];

        // Extract PractitionerRole resources from the bundle
        practitionerRoles = entries
          .map(entry => entry.resource)
          .filter(resource => resource.resourceType === 'PractitionerRole');

        if (practitionerRoles.length === 0) {
          console.error('No PractitionerRole resources found.');
          fetchError = 'No roles found for the practitioner.';
          return;
        }

        // Extract organizations from PractitionerRoles
        organizations = practitionerRoles.map(role => ({
          id: role.organization?.reference?.split('/')[1] || null,
          name: role.organization?.display || 'Unknown Organization'
        }));

        // Extract unique roles from PractitionerRoles
        const extractedRoles = practitionerRoles.flatMap(role => {
          // Assuming each PractitionerRole has a 'code' array with coding objects containing role codes
          if (Array.isArray(role.code)) {
            return role.code.flatMap(c => c.coding?.map(codeObj => codeObj.code) || []);
          }
          return [];
        });

        // Remove duplicates and assign to roles
        roles = [...new Set(extractedRoles)];

        // Update userData.roles with extracted roles
        user.update(store => {
          const updatedStore = { ...store };
          updatedStore.user = { ...store.user, roles: roles };
          return updatedStore;
        });

        // Update abilities based on the new roles
        updateAbilities(roles);

        // Automatically select the first role if there's only one
        if (practitionerRoles.length === 1) {
          selectPractitionerRole(practitionerRoles[0]);
        }
      } else {
        throw new Error('Failed to fetch practitioner roles');
      }
    } catch (error) {
      console.error('Error fetching practitioner roles:', error);
      fetchError = 'Unable to retrieve practitioner roles. Please try again later.';
    }
  }

  /**
   * Set the selected PractitionerRole and update user store accordingly.
   * @param {Object} role - Selected PractitionerRole object.
   */
  function selectPractitionerRole(role) {
    selectedRole = role;

    // Safely extract role codes
    if (Array.isArray(role.code)) {
      roles = role.code
        .flatMap(item => (Array.isArray(item.coding) ? item.coding.map(coding => coding.code) : []))
        .filter(code => code); // Remove any undefined or null codes
    } else {
      roles = [];
    }

    // Update the store with selected PractitionerRole without altering authentication properties
    user.update(store => {
      // Clone the existing user object to prevent unintended mutations
      const updatedStore = { ...store };

      // Add or update the 'practitioner' property separately
      updatedStore.practitioner = {
       
          id: selectedRole.practitioner?.reference?.split('/')[1] || null,
          name: practitionerName || null,
          organizationId: selectedRole.organization?.reference?.split('/')[1] || null,
          organizationName: selectedRole.organization?.display || 'Organization',
          availability: selectedRole.availability || null,
          PractitionerRoleId: selectedRole.id || null,
        
      };

      console.log('Practitioner Store Updated:', updatedStore.practitioner); // Debugging log to verify updates
 

      return updatedStore;
    });

    // Abilities are automatically updated via stores.js when user.roles are updated
  }
</script>

<div class="app-container">
  <aside class="sidebar">
    <div class="sidebar-logo-container">
      <img src="/avail/apple-touch-icon.png" alt="Logo" class="sidebar-logo" />

      
      <div class="sidebar-title">
        Colorado<br />
        Referral<br />
        Information
      </div>
    </div>
   
    <Navigation 
      isUserAuthenticated={isUserAuthenticated}
      practitionerId={practitionerId}
      practitionerName={practitionerName}
      practitionerRoles={practitionerRoles}
      organizations={organizations}
      selectPractitionerRole={selectPractitionerRole}
      handleLogin={handleLogin}
      handleLogout={handleLogout}
      handleConnectFhir={handleConnectFhir}
      handleDisconnectFhir={handleDisconnectFhir}
      isFhirAuthenticated={isFhirAuthenticated}
      fhirError={fhirError}
    />
    
  </aside>

  <main class="main-content">
    <hr>slot
    <slot></slot>
    endofslot<hr> 
    {#if isInitializing}
      <p>Initializing application, please wait...</p>
    {:else if isFetchingPractitioner}
      <p>Loading your data, please wait...</p>
    {:else if fetchError}
      <div class="error-message">{fetchError}</div>
    {:else if !isUserAuthenticated}
      <p>Please log in to access the content.</p>
 
    {/if}

    <!-- Display selected roles -->
    {#if selectedRole}
      <div class="role-info">
        <h3>Roles for Selected PractitionerRole</h3>
        <ul>
          {#each roles as role}
            <li>{role}</li>
          {/each}
        </ul>
      </div>
    {/if}
  </main>

  {#if process.env.NODE_ENV === 'development'}
    <DebugSection 
      isUserAuthenticated={isUserAuthenticated}
      practitionerId={practitionerId}
      practitionerName={practitionerName}
      practitionerRoles={practitionerRoles}
      organizations={organizations}
      selectPractitionerRole={selectPractitionerRole}
      ability={ability}
      handleLogin={handleLogin}
      handleLogout={handleLogout}
      handleConnectFhir={handleConnectFhir}
      handleDisconnectFhir={handleDisconnectFhir}
      isFhirAuthenticated={isFhirAuthenticated}
      fhirError={fhirError}
      userData={userData}
    />
  {/if}
</div>



<style>
  .app-container {
    display: flex;
    height: 100vh;
 
  }

  .sidebar {
    width: 250px;
    background-color: #f8f9fa;
    padding: 20px;
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    border-right: 1px solid #ddd;
    overflow-y: auto;
    height: 100vh; /* Full viewport height */
    box-sizing: border-box;
  }

  .sidebar-logo-container {
    display: flex;
    flex-direction: column;
    align-items: left;
    margin-bottom: 20px;
  }

  .sidebar-logo {
    width: 80px; /* Adjust size as needed */
    height: auto;
    margin-bottom: 10px;
  }

  .sidebar-title {
    text-align: center;
    font-size: 16px;
    font-weight: bold;
    line-height: 1.2;
    color: #333;
  }

  .main-content {
    flex: 1;
    padding: 20px;
    overflow-y: auto;
  }

  .error-message {
    color: red;
    font-size: 14px;
    margin-top: 10px;
  }

  .role-info {
    margin-top: 20px;
  }

  .role-info h3 {
    margin-bottom: 10px;
  }

  .role-info ul {
    list-style: none;
    padding: 0;
  }

  .role-info li {
    margin-bottom: 5px;
  }

  .debug-section {
    margin-top: 20px;
    padding: 10px;
    background-color: #eef;
    border: 1px solid #99c;
    border-radius: 4px;
    overflow-y: auto;
    max-height: 300px;
  }

  .debug-section h3 {
    margin-bottom: 10px;
    font-size: 16px;
    color: #333;
  }

  .debug-section ul {
    list-style: none;
    padding: 0;
  }

  .debug-section li {
    margin-bottom: 5px;
    font-size: 14px;
    color: #555;
  }

  .debug-section strong {
    color: #000;
  }
</style>
