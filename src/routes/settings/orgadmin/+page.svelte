<script>
  import { onMount } from 'svelte';
  import { user } from '$lib/stores.js'; // Import the user store
  import { base } from '$app/paths';

  let organizationId = null;
  let originalOrganizationData = {}; // Define originalOrganizationData

  // Organization data, with default address fields
  export let organization = {
    name: '',
    telecom: [
      { system: 'phone', value: '', use: 'work' },
      { system: 'fax', value: '', use: 'work' },
      { system: 'email', value: '', use: 'work' },
      { system: 'url', value: '', use: 'work' }
    ],
    address: {
      line: [''],
      city: '',
      state: 'CO', // Default state
      postalCode: '',
      country: 'US' // Default country
    }
  };

  let formOrganization = { ...organization };

  onMount(async () => {
    // Get organizationId from user.practitioner in the store
    organizationId = $user.practitioner.organizationId;
    console.log('Loaded organizationId from store:', organizationId);

    // Fetch Organization details
    const organizationResponse = await fetch(`${base}/api/organization/${organizationId}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include' // Include credentials if necessary
    });

    if (!organizationResponse.ok) {
        throw new Error(`Failed to fetch organization: ${organizationResponse.status} ${organizationResponse.statusText}`);
    }

    const organizationData = await organizationResponse.json();
    console.log('Fetched organization data:', organizationData);

    // Populate formOrganization with the fetched data
    formOrganization = {
          name: organizationData.name ?? '',  // Ensure name has a fallback
          telecom: organizationData.telecom || [
          { system: 'phone', value: '', use: 'work' },
          { system: 'fax', value: '', use: 'work' },
          { system: 'email', value: '', use: 'work' },
          { system: 'url', value: '', use: 'work' }
          ],
          address: {
          line: organizationData.address?.[0]?.line || [''], // Ensure line array is initialized
          city: organizationData.address?.[0]?.city || '',
          state: organizationData.address?.[0]?.state || 'CO',
          postalCode: organizationData.address?.[0]?.postalCode || '',
          country: organizationData.address?.[0]?.country || 'US'
          }
    };

    // Store the original organization data for comparison in the handleSubmit function
    originalOrganizationData = { ...formOrganization };
  });

  async function handleSubmit() {
  // Clean up telecom fields: Remove any telecom entries that don't have a value
  const sanitizedTelecom = formOrganization.telecom.filter(t => t.value?.trim());

  // Clean up address: Only include address if necessary fields are populated
  const sanitizedAddress = formOrganization.address?.line[0]?.trim() || formOrganization.address?.city?.trim() ||
                           formOrganization.address?.state?.trim() || formOrganization.address?.postalCode?.trim() ||
                           formOrganization.address?.country?.trim()
      ? [formOrganization.address] // Wrap the address object in an array if populated
      : []; // Otherwise, use an empty array

  // Merge the updated form fields with the original data
  const updatedOrganization = {
      ...originalOrganizationData, // Preserve original fields
      ...formOrganization, // Override with updated fields from form
      telecom: sanitizedTelecom, // Use the sanitized telecom array
      address: sanitizedAddress // Use the sanitized address array
  };

  console.log('Organization data being submitted:', updatedOrganization);

  try {
      const response = await fetch(`${base}/api/organization/update/${organizationId}`, {
          method: 'PUT',
          headers: {
              'Content-Type': 'application/json',  // Use JSON content type
          },
          body: JSON.stringify(updatedOrganization) // Send the updated organization data
      });

      if (!response.ok) {
          throw new Error(`Failed to update organization. Status: ${response.status}`);
      }

      const responseData = await response.json();
      console.log('Organization successfully updated:', responseData);

      // Optionally, you can show a success message to the user here
  } catch (error) {
      console.error('Error updating organization:', error);
      // Optionally, you can show an error message to the user here
  }
}

</script>

<!-- HTML Template -->
<div class="organization-form">
  <h2>Edit Organization</h2>

  <!-- Name -->
  <div class="form-group">
    <label for="name">Organization Name</label>
    <input 
      type="text" 
      id="name" 
      bind:value={formOrganization.name} 
      placeholder="Enter organization name" 
    />
  </div>

  <!-- Telecoms -->
  <h3>Contact Points</h3>

  {#each formOrganization.telecom as telecom, index}
    <div class="form-group telecom-group">
      <label for="system-{index}">{telecom.system?.charAt(0).toUpperCase() + telecom.system?.slice(1)}</label>
      <input
        type="text"
        id="system-{index}"
        bind:value={telecom.value}  
        placeholder={`Enter ${telecom.system || 'contact'}`}  
      />
    </div>
  {/each}

  <!-- Address Fields -->
  <h3>Address</h3>

  <div class="form-group">
    <label for="line">Address Line</label>
    <input 
      type="text" 
      id="line" 
      bind:value={formOrganization.address.line[0]} 
      placeholder="Enter address line" 
    />
  </div>

  <div class="form-group">
    <label for="city">City</label>
    <input 
      type="text" 
      id="city" 
      bind:value={formOrganization.address.city}  
      placeholder="Enter city" 
    />
  </div>

  <div class="form-group">
    <label for="state">State</label>
    <input 
      type="text" 
      id="state" 
      bind:value={formOrganization.address.state} 
      placeholder="Enter state" 
    />
  </div>

  <div class="form-group">
    <label for="postalCode">Postal Code</label>
    <input 
      type="text" 
      id="postalCode" 
      bind:value={formOrganization.address.postalCode}  
      placeholder="Enter postal code" 
    />
  </div>

  <div class="form-group">
    <label for="country">Country</label>
    <input 
      type="text" 
      id="country" 
      bind:value={formOrganization.address.country} 
      placeholder="Enter country" 
    />
  </div>

  <!-- Submit Button -->
  <div class="form-actions">
    <button on:click={handleSubmit}>Submit</button>
  </div>
</div>

<!-- Styling -->
<style>
.organization-form {
  max-width: 600px;
  margin: 0 auto;
  padding: 20px;
  border: 1px solid #ccc;
  border-radius: 8px;
}

.form-group {
  margin-bottom: 1rem;
}

label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: bold;
}

input {
  width: 100%;
  padding: 0.5rem;
  font-size: 1rem;
  border: 1px solid #ddd;
  border-radius: 4px;
}

.form-actions {
  margin-top: 1rem;
}

button {
  padding: 10px 20px;
  background-color: #007bff;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

button:hover {
  background-color: #0056b3;
}
</style>
