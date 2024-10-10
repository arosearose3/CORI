<script>
    import { onMount } from 'svelte';
    import { base } from '$app/paths';
    import { user } from '$lib/stores.js'; // Assuming organizationId is stored in stores.js
    
    let firstName = '';
    let lastName = '';
    let dob = '';
    let npi = '';
    let phone = '';
    let email = '';
    let errorMessage = '';
    let successMessage = '';
    let loading = false;
    
    let organizations = [];
    let roles = [
      { code: 'referrer', label: 'Referrer', description: 'Individuals or organizations that initiate a referral.', selected: false },
      { code: 'coordinator', label: 'Coordinator', description: 'Intermediaries that receive referrals and make referrals.', selected: false },
      { code: 'provider', label: 'Provider', description: 'A health-related provider.', selected: false },
      { code: 'orgadmin', label: 'Org Admin', description: 'An organizational administrator.', selected: false }
    ]; // Filter out admin, client, publichealth roles
    
    onMount(() => {
      fetchOrganizations();
    });
    
    async function fetchOrganizations() {
      try {
        const response = await fetch(`${base}/api/organization/all`);
        const data = await response.json();
        organizations = data;
      } catch (error) {
        console.error('Error fetching organizations:', error);
        errorMessage = 'Error fetching organizations. Please try again.';
      }
    }
    
    async function handleSubmit() {
      loading = true;
      errorMessage = '';
      successMessage = '';
  
      try {
        const emailSearchResponse = await fetch(`${base}/api/practitioner/findWithEmail?email=${encodeURIComponent(email)}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
        });
    
        const existingPractitionerData = await emailSearchResponse.json();
        let practitionerId;
    
        // If practitioner exists, get the PractitionerId
        if (existingPractitionerData.length > 0) {
          practitionerId = existingPractitionerData[0]?.id;
          console.log(`Practitioner found with ID: ${practitionerId}`);
        } else {
          // If not, create a new Practitioner
          const newPractitionerData = {
            resourceType: 'Practitioner',
            name: [
              {
                family: lastName,
                given: [firstName],
                use: 'official'
              }
            ],
            birthDate: dob,
            telecom: [
              { system: 'email', value: email },
              { system: 'phone', value: phone }
            ],
            identifier: [
              { system: 'http://hl7.org/fhir/sid/us-npi', value: npi }
            ]
          };
    
          const createPractitionerResponse = await fetch(`${base}/api/practitioner/add`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(newPractitionerData)
          });
    
          const createdPractitioner = await createPractitionerResponse.json();
          practitionerId = createdPractitioner.practitionerID;
          console.log(`New Practitioner created with ID: ${practitionerId}`);
        }
    
        // Step 2: Create a new PractitionerRole
        const organizationId = $user.practitioner.organizationId; // Assuming organizationId is available in the user store
    
        const selectedRoles = roles.filter(role => role.selected).map(role => role.code);
  
        if (selectedRoles.length === 0) {
          errorMessage = 'Please select at least one role.';
          return;
        }
  
        const newPractitionerRoleData = {
          practitioner: { reference: `Practitioner/${practitionerId}` },
          organization: { reference: `Organization/${organizationId}` },
          roles: selectedRoles,
        };
    
        const createRoleResponse = await fetch(`${base}/api/role/patchRoles`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(newPractitionerRoleData)
        });
    
        if (createRoleResponse.ok) {
          successMessage = 'Staff member successfully added with roles.';
          resetForm();
        } else {
          const result = await createRoleResponse.json();
          errorMessage = `Failed to create PractitionerRole: ${result.error || 'Unknown error'}`;
        }
    
      } catch (error) {
        console.error('Error adding new staff:', error);
        errorMessage = 'An error occurred. Please try again.';
      } finally {
        loading = false;
      }
    }
    
    // Reset form fields
    function resetForm() {
      firstName = '';
      lastName = '';
      dob = '';
      npi = '';
      phone = '';
      email = '';
      roles.forEach(role => (role.selected = false));
    }
  </script>
  
  <!-- Staff Form UI -->
  <div class="add-staff-container">
    <h2>Add New Staff Member</h2>
  
    {#if errorMessage}
      <div class="error-message">{errorMessage}</div>
    {/if}
  
    {#if successMessage}
      <div class="success-message">{successMessage}</div>
    {/if}
  
    <form on:submit|preventDefault={handleSubmit}>
      <div class="form-group">
        <label for="firstName">First Name:</label>
        <input id="firstName" type="text" bind:value={firstName} required>
      </div>
  
      <div class="form-group">
        <label for="lastName">Last Name:</label>
        <input id="lastName" type="text" bind:value={lastName} required>
      </div>
  
      <div class="form-group">
        <label for="dob">Date of Birth:</label>
        <input id="dob" type="date" bind:value={dob} >
      </div>
  
      <div class="form-group">
        <label for="npi">NPI:</label>
        <input id="npi" type="text" bind:value={npi} >
      </div>
  
      <div class="form-group">
        <label for="phone">Text Phone:</label>
        <input id="phone" type="tel" bind:value={phone} >
      </div>
  
      <div class="form-group">
        <label for="email">Email:</label>
        <input id="email" type="email" bind:value={email} >
      </div>
  
      <!-- Role Selection -->
      <h3>Select Roles</h3>
      <table>
        <thead>
          <tr>
            <th>Select</th>
            <th>Role</th>
            <th>Description</th>
          </tr>
        </thead>
        <tbody>
          {#each roles as role}
            <tr>
              <td><input type="checkbox" bind:checked={role.selected} /></td>
              <td>{role.label}</td>
              <td>{role.description}</td>
            </tr>
          {/each}
        </tbody>
      </table>
  
      <button type="submit" disabled={loading}>
        {#if loading}Submitting...{/if}
        {#if !loading}Submit{/if}
      </button>
    </form>
  </div>
  
 
  
  <style>
    .add-staff-container {
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
    }
  
    .form-group {
      margin-bottom: 20px;
    }
  
    label {
      display: block;
      margin-bottom: 5px;
      font-weight: bold;
    }
  
    input {
      width: 100%;
      padding: 10px;
      font-size: 1rem;
      border: 1px solid #ddd;
      border-radius: 5px;
    }
  
    button {
      padding: 10px 20px;
      background-color: #007bff;
      color: white;
      border: none;
      border-radius: 5px;
      cursor: pointer;
      font-size: 1rem;
    }
  
    button:disabled {
      background-color: #ccc;
      cursor: not-allowed;
    }
  
    .error-message {
      color: red;
      margin-bottom: 20px;
    }
  
    .success-message {
      color: green;
      margin-bottom: 20px;
    }
  </style>
  