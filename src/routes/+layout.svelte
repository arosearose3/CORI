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
  
  import {
    initGoogleAuth,
    handleGoogleAuth,
    logoutGoogleUser,
    authError as googleAuthError,
  } from '$lib/auth/googleUserAuth.js';

  import { Ability } from '@casl/ability';
  import { goto } from '$app/navigation';
  import Navigation from './Navigation.svelte';
  import UserProfile from "./UserProfile2.svelte";
  import HomepageText from './HomepageText.svelte';
  import { afterNavigate } from '$app/navigation';
  import { page } from '$app/stores';
  import { base } from '$app/paths'; // Import base path

  // State Variables
  let isHomePage = false;
  let userData = null;
  let ability = null;
  let isFhirAuthenticated = false;
  let isUserAuthenticated = false;
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
  let currentOrgName = '';
  let localOrgArray = [];

  console.log('Base path +layout:', base); // Debugging log

  // Reactive Statement: Determine if the current path is the home page
  $: {
    isHomePage = $page.url.pathname === `${base}/`;
    console.log('isHomePage changed:', isHomePage);
    console.log('isHomePage url:', $page.url.pathname);
  }

  // Navigation logging
  afterNavigate(() => {
    console.log(`Navigated to: ${$page.url.pathname}`);
  });

  // Reactive Statement: Determine if the user is authenticated based on userData
  $: isUserAuthenticated = !!userData?.id;

  // Function to update roles and abilities
  function updateRolesAndAbilities(newRoles) {
    userRoles = newRoles;
    updateAbilities(newRoles);
  }

  // Function to reset practitioner-related data
  function resetPractitionerData() {
    practitionerId = null;
    practitionerName = null;
    practitionerRoles = [];
    selectedPractitionerRole = null;
    userRoles = [];
    organizations = [];
    hasFetchedPractitionerData = false;
  }

  // Subscribe to abilities store
  const unsubscribeAbilities = abilities.subscribe(value => {
    ability = value;
  });

  // Subscribe to user store
  const unsubscribeUser = user.subscribe(async value => {
    console.log("+layout user.subscribe, value:", value);
    userData = value?.user || null;

    isUserAuthenticated = !!userData?.id;

    if (isUserAuthenticated && userData?.email && !hasFetchedPractitionerData) {
      isFetchingPractitioner = true;
      await fetchPractitionerData(userData.email);
      hasFetchedPractitionerData = true;
      isFetchingPractitioner = false;

      // Initialize FHIR auth only after user is authenticated
      if (!isFhirAuthenticated) {
        await initializeFhirAuth();
      }
    } else if (!isUserAuthenticated) {
      resetPractitionerData();
      abilities.set(new Ability([]));
      isFhirAuthenticated = false;
    }
  });

  // Subscribe to FHIR authentication error store
  const unsubscribeFhirError = fhirAuthError.subscribe(value => {
    fhirError = value;
    isFhirAuthenticated = !value;
  });

  // Function to initialize FHIR authentication
  async function initializeFhirAuth() {
    try {
      await initFhirAuth(base);
      isFhirAuthenticated = await checkFhirAuthStatus();
    } catch (error) {
      console.error('FHIR Initialization error:', error);
      fhirError = 'FHIR Initialization failed. Please try again.';
    }
  }

  // Initialize authentication on component mount
  onMount(async () => {
    try {
      await initGoogleAuth(base); // Initialize Google Auth which should fetch and set user data
      isInitializing = false;
    } catch (error) {
      console.error('Google Auth Initialization error:', error);
      fetchError = 'Authentication Initialization failed. Please try again.';
      isInitializing = false;
    }
  });

  // Clean up subscriptions on component destroy
  onDestroy(() => {
    unsubscribeUser();
    unsubscribeAbilities();
    unsubscribeFhirError();
  });

  // Function to handle user login
  async function handleLogin() {
    console.log('Handling login with base:', base);
    try {
      await handleGoogleAuth(base);
      // handleGoogleAuth likely redirects the user, so no further action here
    } catch (error) {
      console.error('Error during login:', error);
      // Optionally set an error state to display to the user
    }
  }

  // Function to handle user logout
  async function handleLogout() {
    console.log('handleLogout called with base:', base);
    try {
      const result = await logoutGoogleUser(base);
      if (result.success) {
        isUserAuthenticated = false;
        if (isFhirAuthenticated) {
          await disconnectFhirAuth(base);
        }
        resetPractitionerData();
        abilities.set(new Ability([]));
        isFhirAuthenticated = false;
        user.set(null); // Ensure user store is cleared
        goto(`${base}/`); // Redirect to the base path
      } else {
        console.error('Logout failed:', result.error);
        // Optionally set an error state to display to the user
      }
    } catch (error) {
      console.error('Error during logout:', error);
      // Optionally set an error state to display to the user
    }
  }

  // Function to handle connecting to FHIR
  async function handleConnectFhir() {
    await handleFhirAuth(base);
  }

  // Function to handle disconnecting from FHIR
  async function handleDisconnectFhir() {
    await disconnectFhirAuth(base);
    resetPractitionerData();
    abilities.set(new Ability([]));
    goto(`${base}/`);
  }

  // Function to fetch organization name by reference
  async function getOrganizationName(orgReference) {
    try {
      const response = await fetch(`${base}/api/organization/getOrgName?reference=${encodeURIComponent(orgReference)}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch organization name: ${response.statusText}`);
      }

      let data = await response.text();
      if (data) {
        data = data.replace(/^"|"$/g, '');
      }
      return data || 'Unknown Organization';
    } catch (error) {
      console.error(`Error fetching organization name: ${error}`);
      return 'Unknown Organization';
    }
  }

  // Function to get the full name from the name object
  function getFullName(nameObject) {
    if (!nameObject || !Array.isArray(nameObject) || nameObject.length === 0) {
      return '';
    }
    const nameEntry = nameObject[0];
    const givenNames = nameEntry.given ? nameEntry.given.join(' ') : '';
    const familyName = nameEntry.family || '';
    return `${givenNames} ${familyName}`.trim();
  }

  // Function to fetch practitioner data by email
  async function fetchPractitionerData(email) {
    try {
      const response = await fetch(`${base}/api/practitioner/findWithEmail?email=${encodeURIComponent(email)}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // Include credentials to send cookies
      });

      if (response.ok) {
        const data = await response.json();

        if (Array.isArray(data) && data.length > 0) {
          practitionerId = data[0]?.id || null;
          practitionerName = getFullName(data[0]?.name) || 'Unknown Practitioner';

          console.log("+layout/fetchPractDataEmail prID:" + practitionerId);
          console.log("+layout/fetchPractDataEmail name:" + practitionerName);

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

  // Function to fetch PractitionerRoles by practitioner ID
  async function fetchPractitionerRoles(practitionerId) {
    try {
      const response = await fetch(`${base}/api/role/PractitionerRole?practitioner=${encodeURIComponent(practitionerId)}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // Include credentials to send cookies
      });

      if (response.ok) {
        const bundle = await response.json();
        const entries = Array.isArray(bundle.entry) ? bundle.entry : [];

        // Extract PractitionerRole objects
        practitionerRoles = entries
          .map(entry => entry.resource)
          .filter(resource => resource.resourceType === 'PractitionerRole');

        // Load localOrgArray
        localOrgArray = []; // Reset to avoid duplicates
        for (const role of practitionerRoles) {
          if (role.organization && role.organization.reference) {
            let orgName = await getOrganizationName(role.organization.reference);
            localOrgArray.push({ name: orgName, id: role.organization.reference });
          }
        }
        console.log("+layout/fetchPR localOrgArray:" + JSON.stringify(localOrgArray));
        console.log("+layout/fetchPR pract[0]:" + JSON.stringify(practitionerRoles[0]));

        // Show role selection if multiple roles
        if (practitionerRoles.length > 1) {
          showRoleSelection = true;
        } else if (practitionerRoles.length === 1) {
          console.log("+layout/fetchPR only one Pract");
          // Automatically select the role
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

  // Function to select a PractitionerRole
  function selectPractitionerRole(prId, orgNameVar) {
    currentOrgName = orgNameVar;
    console.log("+layout/selectPR prId:" + JSON.stringify(prId));
    console.log("+layout/selectPR practitionerRoles:" + JSON.stringify(practitionerRoles));

    // Find the PractitionerRole resource
    const pr = practitionerRoles.find(role => role.organization.reference === prId);
    console.log("+layout/selectPR pr:" + JSON.stringify(pr));

    // Extract role codes
    userRoles = (pr.code || [])
      .flatMap(c =>
        (c.coding || [])
          .filter(code => code.system === 'https://combinebh.org/cori-value-set/')
          .map(code => code.code)
      )
      .filter(code => code);

    selectedPractitionerRole = pr;
    updatePractitionerStore(pr);

    // Update abilities
    updateAbilities(userRoles);

    // Hide the role selection UI
    showRoleSelection = false;
  }

  // Function to update the practitioner store with selected role
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
      return updatedStore;
    });
  }

  // Reactive statement to update abilities based on user roles
  $: if ($user) {
    updateAbilities($user.roles);
  }

  // Subscribe to Google Auth error to display any authentication errors
  let currentAuthError;
  googleAuthError.subscribe(value => {
    currentAuthError = value;
  });

</script>

<div class="app-container">
  <aside class="sidebar">
    <div class="sidebar-logo-container">
      <a href="{base}/">
        <img src="{base}/apple-touch-icon.png" alt="Logo" class="sidebar-logo" />
      </a>
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
    <div class="auth-buttons">
      {#if isUserAuthenticated}
        <button class="nav-button logout" on:click={handleLogout} aria-label="Log Out">Logout</button>
      {:else}
        <button class="nav-button" on:click={handleLogin} aria-label="Log In with Google">Login with Google</button>
      {/if}
    </div>

    <div class="footer-links">
      <a href="{base}/TOS" class="footer-link">Cori Terms of Service</a><br>
      <a href="{base}/PrivacyPolicy" class="footer-link">Privacy Policy</a><br><br>
      <span>© 2024 Cori, a Colorado 501(c)(3)</span>
    </div>
  </aside>

  <main class="main-content">
    {#if currentAuthError}
      <div class="error-message">{currentAuthError}</div>
    {/if}
    {#if isInitializing}
      <p>Initializing application, please wait...</p>
    {:else if isFetchingPractitioner}
      <p>Loading your data, please wait...</p>
    {:else if fetchError}
      <div class="error-message">{fetchError}</div>
    {/if}

    <!-- Display role selection UI if multiple PractitionerRoles are available -->
    {#if showRoleSelection && practitionerRoles}
      <div class="role-selection">
        <h2>All PractitionerRoles</h2>
        <pre>{JSON.stringify(practitionerRoles, null, 2)}</pre>

        <h3>Choose an Organization</h3>
        <ul>
          {#each localOrgArray as org}
            <li>
              <button on:click={() => selectPractitionerRole(org.id, org.name)}>
                {org.name || 'Unknown Organization'}
              </button>
            </li>
          {/each}
        </ul>
      </div>
    {/if}

    <!-- Display selected roles if a PractitionerRole is chosen -->
    {#if selectedPractitionerRole}
      <div class="user-info">
        <UserProfile {userData} />
      </div>

      <div class="role-info">
        <p>
          Roles at {currentOrgName}:
          {#each userRoles as role, index}
            <span>{role}{#if index < userRoles.length - 1},{'\u00A0'}{/if}</span>
          {/each}
        </p>
      </div>
      <hr>
    {/if}

    <slot></slot>
    {#if isHomePage}
      <HomepageText />
    {/if}
  </main>
</div>

<style>
  .error-message {
    color: red;
    margin-bottom: 1rem;
  }

  .app-container {
    display: flex;
    height: 100vh;
  }

  .sidebar {
    position: relative;
    padding: 20px;
    background-color: #f8f9fa;
    display: flex;
    flex-direction: column;
    border-right: 1px solid #ddd;
    height: 100vh;
    padding-bottom: 20px;
    padding-right: 20px;
  }

  .sidebar-logo-container {
    display: flex;
    flex-direction: column;
    align-items: left;
    margin-bottom: 20px;
  }

  .sidebar-logo {
    width: 60px;
    height: auto;
    margin-bottom: 10px;
  }

  .main-content {
    flex: 1;
    padding: 20px;
    overflow-y: auto;
  }

  .footer-links {
    position: absolute;
    bottom: 100px;
    left: 10px;
    right: 0;
    text-align: left;
    padding-right: 20px;
    padding-left: 20px;
  }

  .footer-link {
    text-decoration: none;
    color: inherit;
    display: inline-block;
    padding-bottom: 3px;
  }

  .footer-link:hover {
    color: lightgrey;
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

  .nav-button {
    background-color: #007bff;
    color: white;
    border: none;
    padding: 8px 12px;
    border-radius: 4px;
    cursor: pointer;
    font-size: 16px;
    transition: background-color 0.3s ease;
    margin-bottom: 10px;
  }

  .nav-button:hover {
    background-color: #3399ff;
  }

  .nav-button:active {
    background-color: #0056b3;
  }

  .nav-button.logout {
    background-color: #dc3545;
  }

  .nav-button.logout:hover {
    background-color: #ff6b6b;
  }

  .nav-button.logout:active {
    background-color: #b32d3a;
  }

  .auth-buttons {
    margin-top: auto; /* Push buttons to the bottom if desired */
  }

  /* Additional styling as needed */
</style>
