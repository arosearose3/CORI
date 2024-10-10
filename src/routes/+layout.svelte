<script>
  import { onMount, onDestroy } from 'svelte';
  import { user, abilities, hasFetchedPractitionerData, clearUserStore, updateAbilities } from '$lib/stores.js';
  
  import {
    handleFhirAuth,
    checkFhirAuthStatus,
    fhirAuthError,
    disconnectFhirAuth,
  } from '$lib/auth/googleFhirAuth.js';
  
  import {
    logoutGoogleUser,
    checkUserAuthStatus,
  } from '$lib/auth/googleUserAuth.js';

  import { Ability } from '@casl/ability';
  import { goto } from '$app/navigation';
  import Navigation from './Navigation.svelte';
  import UserProfile from "./UserProfile2.svelte";
  import HomepageText from './HomepageText.svelte';
  import RoleSelection from './RoleSelection.svelte';
  import { afterNavigate } from '$app/navigation';
  import { page } from '$app/stores';
  import { base } from '$app/paths';

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
  let fetchError = null;
  let isInitializing = true;

  let isFetchingPractitioner = false;
  let hasFetchedPractitioner = false;
  let showRoleSelection = false; // Controls the visibility of the role selection UI
  let currentOrgName = '';
  let seenOrgRefs = new Set();
  let localOrgArray = [];

  console.log('Base path +layout:', base, ":");

  $: {
    isHomePage = $page.url.pathname === `${base}/`;
    console.log('isHomePage changed:', isHomePage);
    console.log('isHomePage url:', $page.url.pathname);
  }

  $: {
    console.log('*******LAYOUTuserData:', userData);
    console.log('ability:', ability);
    console.log('userRoles:', userRoles);
  }

  $: {
    console.log (".id tracker 2");
  isUserAuthenticated = !!userData?.id;
  console.log('+layout/isUserAuthenticated updated:', isUserAuthenticated);
  
  if (isUserAuthenticated && userData?.practitioner?.roles) {
    console.log('+layout/Updating abilities with roles:', userData.practitioner.roles);
    updateAbilities(userData.practitioner.roles);
  }
}

  afterNavigate(() => {
    console.log(`Navigated to: ${$page.url.pathname}`);
  });

  // Subscribe to user store
  const unsubscribeUser = user.subscribe(async value => {
    console.log("+layout user.subscribe, value:", value);
    userData = value?.user || null;
    
    isUserAuthenticated = !!userData?.id;

    if (isUserAuthenticated && value?.practitioner) {
      practitionerId = value.practitioner.Pid;
      practitionerName = value.practitioner.name;
      userRoles = value.practitioner.roles || [];
      console.log("+layout: Updated userRoles:", userRoles);
    }

    if (isUserAuthenticated && userData?.email && !hasFetchedPractitioner) {
      console.log("+layout user.subscribe YES authenticated");
      isFetchingPractitioner = true;
      await fetchPractitionerData(userData.email);
      isFetchingPractitioner = false;
      hasFetchedPractitioner = true;
    } 
    if (!isUserAuthenticated) {
      console.log("+layout user.subscribe NO not authenticated");
      resetPractitionerData();
      abilities.set(new Ability([]));
      isFhirAuthenticated = false;
      hasFetchedPractitioner = false;
    }
  });

  // Subscribe to abilities store
  const unsubscribeAbilities = abilities.subscribe(value => {
    ability = value;
  });

  // Subscribe to FHIR authentication error store
  const unsubscribeFhirError = fhirAuthError.subscribe(value => {
    fhirError = value;
    isFhirAuthenticated = !value;
  });

  // Initialize authentication on component mount
  onMount(async () => {  
    console.log('Base path in layout/onMount:', base);
    isInitializing = true;
    await checkUserAuthStatus(base);
    if (isUserAuthenticated && userData?.email && !hasFetchedPractitionerData()) {
      await fetchPractitionerData(userData.email);
      console.log (".id tracker 6");
      if (userData?.practitioner?.Pid) {  // Add this check
          await fetchPractitionerRoles(userData.practitioner.Pid);
        } else {
          console.error("Practitioner data is missing or invalid.");
         // return; //avoid canceling out the isInitializing
        }
  }
    isInitializing = false;
  });

  // Clean up subscriptions on component destroy
  onDestroy(() => {
    unsubscribeUser();
    unsubscribeAbilities();
    unsubscribeFhirError();
  });

  // Function to reset practitioner-related data
  function resetPractitionerData() {
    practitionerId = null;
    practitionerName = null;
    practitionerRoles = [];
    selectedPractitionerRole = null;
    // Don't reset userRoles here
    organizations = [];
    localOrgArray = [];
    console.log("+layout resetPractitionerData: userRoles preserved:", userRoles);
  }


  // Function to handle user login
  async function handleLogin() {
    console.log('Handling login with base:', base);
    try {
      const authUrl = `${base}/auth/google/url`;
      window.location.href = authUrl;
    } catch (error) {
      console.error('Error during login:', error);
    }
  }

  // Function to handle user logout
  async function handleLogout() {
    console.log('handleLogout called with base:', base);
    try {
      const result = await logoutGoogleUser(base);
      if (result && result.success) {
        clearUserStore();
        resetPractitionerData();
        userRoles = []; // Clear userRoles on logout
        isUserAuthenticated = false;
        isFhirAuthenticated = false;
        goto(`${base}/`);
      } else {
        console.error('Logout failed:', result.error);
      }
    } catch (error) {
      console.error('Error during logout:', error);
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
    clearUserStore();
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

  async function fetchPractitionerData(email) {
    if (hasFetchedPractitionerData()) {
      console.log("Practitioner data already fetched, skipping fetch");
      return;
    }

    try {
      const response = await fetch(`${base}/api/practitioner/findWithEmail?email=${encodeURIComponent(email)}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();

        if (Array.isArray(data) && data.length > 0) {
          practitionerId = data[0]?.id || null;
          practitionerName = getFullName(data[0]?.name) || 'Unknown Practitioner';

          user.update(store => ({
            ...store,
            practitioner: {
              ...store.practitioner,
              Pid: practitionerId,
              name: practitionerName,
              roles: userRoles
            }
          }));

          updateAbilities(userRoles);
          
          console.log("+layout/fetchPractDataEmail prID:" + practitionerId);
          console.log("+layout/fetchPractDataEmail name:" + practitionerName);

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
      credentials: 'include',
    });

    if (response.ok) {
      const bundle = await response.json();
      const entries = Array.isArray(bundle.entry) ? bundle.entry : [];

      practitionerRoles = entries
        .map(entry => entry.resource)
        .filter(resource => resource.resourceType === 'PractitionerRole');

      console.log('Filtered PractitionerRoles:', practitionerRoles);

      const seenOrgRefs = new Set();
      const  tempLocalOrgArray = [];

      // Use Promise.all to wait for all asynchronous operations to complete
      await Promise.all(practitionerRoles.map(async (role) => {
      if (role.organization && role.organization.reference) {
        const orgRef = role.organization.reference;
        if (!seenOrgRefs.has(orgRef)) {
          seenOrgRefs.add(orgRef);
          let orgName = await getOrganizationName(orgRef);
          tempLocalOrgArray.push({ name: orgName, id: orgRef });
        }
      }
    }));

    // After all async operations, deduplicate based on id
    console.log (".id tracker 8");
    localOrgArray = Array.from(new Map(tempLocalOrgArray.map(item => [item.id, item])).values());


      console.log('Populated localOrgArray:', localOrgArray);

      user.update(store => ({
        ...store,
        practitioner: {
          ...store.practitioner,
          practitionerRoles,
          localOrgArray
        }
      }));

      console.log('Updated user store with PractitionerRoles');
      console.log('fetchPR localOrglength' + localOrgArray.length);

      // Now check the length of localOrgArray after it has been fully populated
      if (localOrgArray.length > 1) {
        showRoleSelection = true;
        console.log('Showing role selection');
      } else if (localOrgArray.length === 1) {
        console.log("+layout/fetchPR only one Pract");
        selectPractitionerRole(practitionerRoles[0], localOrgArray[0].name);
      } else {
        console.error('No valid PractitionerRole resources found.');
        fetchError = 'No valid roles found for the practitioner.';
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
  function selectPractitionerRole(selectedRole, orgName) {
  console.log('Selecting role:', selectedRole, 'for organization:', orgName);

  if (!selectedRole || typeof selectedRole !== 'object') {
    console.error('Invalid role selected:', selectedRole);
    return;
  }

  currentOrgName = orgName;
  const userRoles = (selectedRole.code || [])
    .flatMap(c =>
      (c.coding || [])
        .filter(code => code.system === 'https://combinebh.org/cori-value-set/')
        .map(code => code.code)
    )
    .filter(code => code);

  const organizationReference = selectedRole.organization?.reference;
  const organizationId = organizationReference ? organizationReference.split('/')[1] : null;

  console.log("+layout selectPractitionerRole: Updated userRoles:", userRoles);

  console.log (".id tracker 1");
  user.update(store => ({
    ...store,
    practitioner: {
      ...store.practitioner,
      organizationId: organizationId,
      organizationName: orgName || 'Unknown Organization',
      PRid: selectedRole.id || 'unknown',
      roles: userRoles
    }
  }));
  selectedPractitionerRole = selectedRole;
  updateAbilities(userRoles);
  showRoleSelection = false;
}
</script>


<div class="app-container">
  <aside class="sidebar">
    <div class="sidebar-content">
      <div class="sidebar-header">
        <a href="{base}" class="sidebar-logo-container">
          <img src="{base}/apple-touch-icon.png" alt="Logo" class="sidebar-logo" />
          <div class="sidebar-title">
            Colorado<br />
            Referral<br />
            Information
          </div>
        </a>
      </div>
  
      <Navigation
        {isUserAuthenticated}
        {practitionerId}
        {practitionerName}
        {practitionerRoles}
        {organizations}
        {selectPractitionerRole}
        {handleLogin}
        {handleLogout}
        {handleConnectFhir}
        {handleDisconnectFhir}
        {isFhirAuthenticated}
        {fhirError}
      />
  
      <div class="auth-buttons">
        {#if isUserAuthenticated}
          <button class="nav-button logout" on:click={handleLogout} aria-label="Log Out">Logout</button>
        {:else}
          <button class="nav-button" on:click={handleLogin} aria-label="Log In with Google">Login with Google</button>
        {/if}
      </div>
    </div>
  
    <div class="footer-links">
      <a href="{base}/TOS" class="footer-link">Cori Terms of Service</a>
      <a href="{base}/PrivacyPolicy" class="footer-link">Privacy Policy</a>
      <span class="copyright">© 2024 Cori, a Colorado 501(c)(3)</span>
    </div>
  </aside>

  <main class="main-content">
    {#if isInitializing}
      <p>Initializing application, please wait...</p>
    {:else if isFetchingPractitioner}
      <p>Loading your data, please wait...</p>
    {:else if fetchError}
      <div class="error-message">{fetchError}</div>
    {:else if showRoleSelection}

      <RoleSelection 
        onSelectRole={selectPractitionerRole}
        localOrgArray={$user.practitioner?.localOrgArray || []}
        practitionerRoles={$user.practitioner?.practitionerRoles || []}
      />
    
     
    {:else}
      {#if selectedPractitionerRole}
        <div class="user-info">
          <UserProfile {userData} {currentOrgName} />
        </div>
      {/if}

 
      <slot></slot>
   
      {#if isHomePage}
        <HomepageText />
      {/if}
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
    display: flex;
    flex-direction: column;
    background-color: #f8f9fa;
    border-right: 1px solid #ddd;
    height: 100vh;
    min-width: 250px; /* Ensure minimum width */
    overflow-y: auto;
  }

  .sidebar-content {
    flex: 1;
    display: flex;
    flex-direction: column;
    padding: 20px;
  }

  .sidebar-header {
    margin-bottom: 20px;
  }

  .sidebar-logo-container {
    display: flex;
    align-items: center;
    text-decoration: none;
    color: inherit;
  }

  .sidebar-logo {
    width: 60px;
    height: auto;
    margin-right: 10px;
  }

  .sidebar-title {
    font-size: 18px;
    font-weight: bold;
    line-height: 1.2;
  }

  .main-content {
    flex: 1;
    padding: 10px;
    overflow-y: auto;
  }

  .footer-links {
    display: flex;
    flex-direction: column;
    padding: 20px;
    background-color: #f0f0f0;
  }

  .footer-link {
    text-decoration: none;
    color: inherit;
    margin-bottom: 5px;
  }

  .footer-link:hover {
    color: rgb(172, 172, 172);
  }
  .copyright {
    font-size: 12px;
    margin-top: 10px;
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
    width:100%;
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
    margin-top: 20px;
  }

  /* Additional styling as needed */
</style>
