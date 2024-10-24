<script>
    import { createEventDispatcher, onMount } from 'svelte';
    import { user } from '$lib/stores.js'; // If needed to update user roles
    import { base } from '$app/paths'; // To access the base path for API calls
  
    export let practitionerId = null; // This is passed to the component
    let practitionerRoles = []; // Store the practitioner's roles
    let localOrgArray = []; // Store the organizations associated with practitioner roles
    let fetchError = null; // Error handling for data fetch
    
    const dispatch = createEventDispatcher(); // Event dispatcher to emit OrgSelected event
  
    // Fetch organization name by reference
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
          data = data.replace(/^"|"$/g, ''); // Clean up quotes around the string
        }
        return data || 'Unknown Organization';
      } catch (error) {
        console.error(`Error fetching organization name: ${error}`);
        return 'Unknown Organization';
      }
    }
  
    // Fetch practitioner roles using practitioner ID
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
  
          const seenOrgRefs = new Set();
          const tempLocalOrgArray = [];
  
          // Resolve organization names and build localOrgArray
          await Promise.all(practitionerRoles.map(async (role) => {
            if (role.organization && role.organization.reference) {
              const orgRef = role.organization.reference;
              if (!seenOrgRefs.has(orgRef)) {
                seenOrgRefs.add(orgRef);
                let orgName = await getOrganizationName(orgRef);
                tempLocalOrgArray.push({ name: orgName, orgId: orgRef, practitionerRoleId: role.id });
              }
            }
          }));
  
          // Deduplicate and store unique organizations
          localOrgArray = Array.from(new Map(tempLocalOrgArray.map(item => [item.orgId, item])).values());
        } else {
          throw new Error('Failed to fetch practitioner roles');
        }
      } catch (error) {
        console.error('Error fetching practitioner roles:', error);
        fetchError = 'Unable to retrieve practitioner roles. Please try again later.';
      }
    }
  
    // Handle organization selection
    function selectOrganization(practitionerRoleId, orgId) {
      dispatch('OrgSelected', { practitionerRoleId, orgId }); // Emit OrgSelected event
    }
  
    // Fetch practitioner roles when the component mounts
    onMount(() => {
      if (practitionerId) {
        fetchPractitionerRoles(practitionerId);
      }
    });
  </script>
  
  {#if fetchError}
    <div class="error-message">{fetchError}</div>
  {:else if localOrgArray.length > 0}
    <div class="organization-selection">
      <h3>Select Your Organization</h3>
      {#each localOrgArray as org}
        <button class="org-button" on:click={() => selectOrganization(org.practitionerRoleId, org.orgId)}>
          {org.name}
        </button>
      {/each}
    </div>
  {:else}
    <p>Loading organizations...</p>
  {/if}
  
  <style>
    .organization-selection {
      margin-top: 20px;
    }
  
    .org-button {
      padding: 10px;
      margin-bottom: 10px;
      background-color: #007bff;
      border: none;
      border-radius: 5px;
      color: white;
      cursor: pointer;
      width: 100%;
    }
  
    .org-button:hover {
      background-color: #0056b3;
    }
  
    .error-message {
      color: red;
      margin-top: 20px;
    }
  </style>
  