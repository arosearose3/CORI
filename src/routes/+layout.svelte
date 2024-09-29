<script>
  import { onMount, onDestroy } from 'svelte';
  import { user, abilities } from '$lib/stores.js';
  import { updateAbilities } from '$lib/stores.js';
  import {
    initFhirAuth,
    handleFhirAuth,
    checkAuthStatus as checkFhirAuthStatus,
    authError as fhirAuthError,
    disconnectFhirAuth,
  } from '$lib/auth/googleFhirAuth.js';
  import { Ability } from '@casl/ability';
  import { goto } from '$app/navigation';
  import Navigation from './Navigation.svelte';

  let userData = null;
  let ability = null;
  let isFhirAuthenticated = false;
  let fhirError = null;
  let practitionerId = null;
  let practitionerName = null;
  let practitionerRoles = []; // Array of PractitionerRole objects
  let selectedPractitionerRole = null; // The selected PractitionerRole object
  let userRoles = []; // Array of role strings defining user abilities
  let organizations = []; // List of organizations extracted from PractitionerRoles
  let hasFetchedPractitionerData = false;
  let fetchError = null;
  let isInitializing = true;
  let isFetchingPractitioner = false;
  let showRoleSelection = false; // Controls the visibility of the role selection UI
  let currentOrgName ='';
  let localOrgArray = [];



  

  // Determine if the user is authenticated based on user data
  $: isUserAuthenticated = !!userData?.id;

  function updateRolesAndAbilities(newRoles) {
    userRoles = newRoles;
    updateAbilities(newRoles);
  }


  // Reset practitioner-related data
  function resetPractitionerData() {
    practitionerId = null;
    practitionerName = null;
    practitionerRoles = [];
    selectedPractitionerRole = null;
    userRoles = [];
    organizations = [];
    hasFetchedPractitionerData = false;
  }

  // Subscribe to abilities store to keep track of user abilities
  const unsubscribeAbilities = abilities.subscribe(value => {
    ability = value;
  });

  // Subscribe to user store to manage authentication and fetch related data
  const unsubscribeUser = user.subscribe(async value => {
    userData = value?.user || null;

    if (isUserAuthenticated && userData?.email && !hasFetchedPractitionerData) {
      isFetchingPractitioner = true;
      await fetchPractitionerData(userData.email);
      hasFetchedPractitionerData = true;
      isFetchingPractitioner = false;
    } else if (!isUserAuthenticated) {
      resetPractitionerData();
      abilities.set(new Ability([]));
    }
  });

  // Subscribe to FHIR authentication error store
  const unsubscribeFhirError = fhirAuthError.subscribe(value => {
    fhirError = value;
    isFhirAuthenticated = !value;
  });

  // Initialize FHIR authentication on component mount
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

  // Clean up subscriptions on component destroy
  onDestroy(() => {
    unsubscribeUser();
    unsubscribeAbilities();
    unsubscribeFhirError();
  });

  async function handleLogin() {
    await handleFhirAuth();
  }

  async function handleLogout() {
    await disconnectFhirAuth();
    resetPractitionerData();
    abilities.set(new Ability([]));
    goto('avail');
  }

  async function handleConnectFhir() {
    await handleFhirAuth();
  }

  async function handleDisconnectFhir() {
    await disconnectFhirAuth();
    resetPractitionerData(); // Optionally reset data on FHIR disconnect
    abilities.set(new Ability([])); // Clear abilities
    goto('avail'); // Redirect after disconnection
  }

  async function getOrganizationName(orgReference) {
    try {
     // console.log ("+layout, getOrgname orgRef:"+orgReference);
      const response = await fetch(`/avail/api/organization/getOrgName?reference=${orgReference}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

          // Check if the response is OK
      if (!response.ok) {
      throw new Error(`Failed to fetch organization name: ${response.statusText}`);
      }

      let  data = await response.text();
      if (data) { data= data.replace(/^"|"$/g, '');}
      return data || 'Unknown Organization'; // Assuming the server returns an object with an orgName key
    }
      catch (error) {
      console.error(`Error fetching organization name: ${error}`);
      return 'Unknown Organization';
    }
  }

/**
 * Returns the full name from a FHIR-style name object.
 * @param {Object} nameObject - The name object containing given and family names.
 * @returns {string} - The full name as a single string.
 */
function getFullName(nameObject) {
  
  if (!nameObject || !Array.isArray(nameObject) || nameObject.length === 0) {
    return '';
  }
  const nameEntry = nameObject[0];
  const givenNames = nameEntry.given ? nameEntry.given.join(' ') : '';
  const familyName = nameEntry.family || '';
  return `${givenNames} ${familyName}`.trim();
}


  /**
   * Fetch practitioner data using the provided email.
   * @param {string} email - User's email address.
   */
  // also fetches PractitionerRoles with the found PractitionerId. 

  async function fetchPractitionerData(email) {
    try {
      const response = await fetch(`/avail/api/practitioner/findWithEmail?email=${encodeURIComponent(email)}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();

        if (Array.isArray(data) && data.length > 0) {
          practitionerId = data[0]?.id || null;
          practitionerName = getFullName(data[0]?.name) || 'Unknown Practitioner';

console.log ("+layout/fetchPractDataEmail prID:"+practitionerId);
console.log ("+layout/fetchPractDataEmail name:"+practitionerName);

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
   // also loads localOrgArray ;

  async function fetchPractitionerRoles(practitionerId) {
    try {
      const response = await fetch(`/avail/api/role/PractitionerRole?practitioner=${encodeURIComponent(practitionerId)}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const bundle = await response.json();
        const entries = Array.isArray(bundle.entry) ? bundle.entry : [];

        // Extract PractitionerRole objects - set practitionerRoles to PR array
        practitionerRoles = entries
          .map(entry => entry.resource)
          .filter(resource => resource.resourceType === 'PractitionerRole');

        // load localOrgArray by processing practitionerRoles
      for (const role of practitionerRoles) {
        if (role.organization && role.organization.reference) {
    
          let orgName = await getOrganizationName(role.organization.reference);
          localOrgArray.push({ name: orgName, id: role.organization.reference });
         }
        }
     console.log ("+layout/fetchPR localOrgArray:"+JSON.stringify(localOrgArray));
     console.log ("+layout/fetchPR pract[0]:"+JSON.stringify(practitionerRoles[0]));

        // If more than one PractitionerRole, show the selection UI
  
        if (practitionerRoles.length > 1) {
          showRoleSelection = true;
        } else if (practitionerRoles.length === 1) {
          console.log ("+layout/fetchPR only one Pract");
          // Automatically select if only one PractitionerRole is found
          selectPractitionerRole(localOrgArray[0].id, localOrgArray[0].name);
        } else {
          console.error('No PractitionerRole resources found.');
          fetchError = 'No roles found for the practitioner.';
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
   * Handle selection of a specific PractitionerRole from an Organization and update the store.
   * @param {Object} prID  - Organization Id., orgName is a string 
   */
  function selectPractitionerRole(prId,orgNameVar) {

    currentOrgName = orgNameVar;
    console.log ("+layout/selectPR prId:"+JSON.stringify(prId));
    console.log ("+layout/selectPR practitionerRoles:"+JSON.stringify(practitionerRoles));

// find the PractitionerRole Resource from the prId 
  const pr = practitionerRoles.find(role => role.organization.reference === prId);
  console.log ("+layout/selectPR pr:"+JSON.stringify(pr));

    // Extract the roles strings from the selected PractitionerRole
    userRoles = (pr.code || [])
      .flatMap(c => 
        (c.coding || [])
        .filter(code => code.system === 'https://combinebh.org/cori-value-set/') // Filter by system
        .map(code => code.code) // Extract the code
      )
    .filter(code => code); // Remove undefined or empty values

    //console.log ("+layout/selectPR userRoles:"+userRoles);

    selectedPractitionerRole = pr;
    // Update the practitioner-related data in the user store
    updatePractitionerStore(pr);

    // Update abilities based on the extracted roles
    updateAbilities(userRoles);
   // console.log("Abilities updated with roles:", userRoles);

    // Hide the role selection UI
    showRoleSelection = false;
  }

  /**
   * Update the user store with the selected PractitionerRole.
   * @param {Object} role - The selected PractitionerRole object.
   */
  function updatePractitionerStore(pr) {
    user.update(store => {
      const updatedStore = { ...store };
      updatedStore.practitioner = {
        id: pr.practitioner?.reference?.split('/')[1] || null,
        name: practitionerName || null,
        organizationId: pr.organization?.reference?.split('/')[1] || null,
        organizationName: pr.organization?.name || 'Organization',
        availability: pr.availability || null,
        PractitionerRoleId: pr.id || null,
        roles: userRoles
      };

     // console.log('Practitioner Store Updated:', updatedStore.practitioner);
      return updatedStore;
    });
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
  </aside>

  <main class="main-content">
    {#if isInitializing}
      <p>Initializing application, please wait...</p>
    {:else if isFetchingPractitioner}
      <p>Loading your data, please wait...</p>
    {:else if fetchError}
      <div class="error-message">{fetchError}</div>
    {:else if !isUserAuthenticated}
      <p>Please log in to access the content.</p>
    {/if}

    <!-- Display role selection UI if multiple PractitionerRoles are available -->
    {#if showRoleSelection && practitionerRoles}

      <div class="role-selection">
<!--
      <h2>all PractitionerRoles</h2>
     <pre>{JSON.stringify(practitionerRoles, null, 2)}</pre>
-->
        <h3>Choose an Organization</h3>
          <ul>
            {#each localOrgArray as org}
              <li>
                <button on:click={() => selectPractitionerRole(org.id,org.name)}>
                {org.name || 'Unknown Organization'}
                </button>
              </li>
            {/each}
          </ul>
      </div>
    {/if}

    <!-- Display selected roles if a PractitionerRole is chosen -->
    {#if selectedPractitionerRole }
      <div class="role-info">

        <h3>{practitionerName}'s roles at {currentOrgName}:</h3>
        <ul>
          {#each userRoles as role}
            <li>{role}</li>
          {/each}
        </ul>
        Switch Organizations
      </div>
    {/if}
   
    <slot></slot>
  
  </main>
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
    height: 100vh;
    box-sizing: border-box;
  }

  .sidebar-logo-container {
    display: flex;
    flex-direction: column;
    align-items: left;
    margin-bottom: 20px;
  }

  .sidebar-logo {
    width: 60px; /* Adjust size as needed */
    height: auto;
    margin-bottom: 10px;
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

  .role-selection {
    margin-top: 20px;
  }

  .role-selection h3 {
    margin-bottom: 10px;
  }

  .role-selection ul {
    list-style: none;
    padding: 0;
  }

  .role-selection li {
    margin-bottom: 5px;
  }

  .role-selection button {
    padding: 8px 12px;
    margin-bottom: 8px;
    background-color: #f0f0f0;
    border: 1px solid #ccc;
    cursor: pointer;
    width: 100%;
    text-align: left;
    border-radius: 4px;
    transition: background-color 0.3s;
  }

  .role-selection button:hover {
    background-color: #e0e0e0;
  }
</style>
