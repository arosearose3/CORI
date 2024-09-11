<script>
    let organizationData = {
      identifier: [{ value: '' }],
      active: true,
      type: [{ coding: [{ code: 'prov', system: 'http://terminology.hl7.org/CodeSystem/organization-type' }] }],
      name: '',
      alias: [''],
      description: '',
      contact: [{
        purpose: { coding: [{ code: 'ADMIN' }] },
        name: [{ text: '' }],
        telecom: [
          { system: 'phone', value: '' },
          { system: 'email', value: '' },
          { system: 'fax', value: '' }
        ],
        address: {
          use: 'work',
          type: 'both',
          text: '',
          line: [''],
          city: '',
          state: '',
          postalCode: '',
          country: ''
        },
        organization: { reference: '' },
        period: { start: '', end: '' }
      }]
    };
  
    function addAlias() {
      organizationData.alias = [...organizationData.alias, ''];
    }
  
    function removeAlias(index) {
      organizationData.alias = organizationData.alias.filter((_, i) => i !== index);
    }
  
    function resetForm() {
      organizationData = {
        identifier: [{ value: '' }],
        active: true,
        type: [{ coding: [{ code: 'prov', system: 'http://terminology.hl7.org/CodeSystem/organization-type' }] }],
        name: '',
        alias: [''],
        description: '',
        contact: [{
          purpose: { coding: [{ code: 'ADMIN' }] },
          name: [{ text: '' }],
          telecom: [
            { system: 'phone', value: '' },
            { system: 'email', value: '' },
            { system: 'fax', value: '' }
          ],
          address: {
            use: 'work',
            type: 'both',
            text: '',
            line: [''],
            city: '',
            state: '',
            postalCode: '',
            country: ''
          },
          organization: { reference: '' },
          period: { start: '', end: '' }
        }]
      };
    }
  
    async function handleSubmit() {
      try {
        const response = await fetch('/avail/api/addOrganization', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(organizationData)
        });
  
        if (response.ok) {
          alert('Organization added successfully');
          resetForm();
        } else {
          alert('Failed to add organization');
        }
      } catch (error) {
        console.error('Error adding organization:', error);
        alert('Error adding organization');
      }
    }
  </script>
  
  <div class="add-organization">
    <h2>Add Organization</h2>
    <form on:submit|preventDefault={handleSubmit}>

  
 
  
      <label>
        Name:
        <input type="text" bind:value={organizationData.name} required>
      </label>
  


  
      <fieldset>
        <legend>Contact Information</legend>
        <label>
          Contact Name:
          <input type="text" bind:value={organizationData.contact[0].name[0].text}>
        </label>
  
        <label>
          Phone:
          <input type="tel" bind:value={organizationData.contact[0].telecom[0].value}>
        </label>
  
        <label>
          Email:
          <input type="email" bind:value={organizationData.contact[0].telecom[1].value}>
        </label>
  
        <label>
          Fax:
          <input type="tel" bind:value={organizationData.contact[0].telecom[2].value}>
        </label>
  
        <fieldset>
          <legend>Address</legend>
          <label>
            Street:
            <input type="text" bind:value={organizationData.contact[0].address.line[0]}>
          </label>
          <label>
            City:
            <input type="text" bind:value={organizationData.contact[0].address.city}>
          </label>
          <label>
            State:
            <input type="text" bind:value={organizationData.contact[0].address.state}>
          </label>
          <label>
            Postal Code:
            <input type="text" bind:value={organizationData.contact[0].address.postalCode}>
          </label>
          <label>
            Country:
            <input type="text" bind:value={organizationData.contact[0].address.country}>
          </label>
        </fieldset>
  
        <label>
          Organization Reference:
          <input type="text" bind:value={organizationData.contact[0].organization.reference}>
        </label>
  
        <label>
          Period Start:
          <input type="date" bind:value={organizationData.contact[0].period.start}>
        </label>
  
        <label>
          Period End:
          <input type="date" bind:value={organizationData.contact[0].period.end}>
        </label>
      </fieldset>
  
      <div class="button-group">
        <button type="submit">Submit</button>
        <button type="button" on:click={resetForm}>Cancel</button>
      </div>
    </form>
  </div>
  
  <style>
    .add-organization {
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
      background-color: #f0f0f0;
      border-radius: 8px;
    }
    form {
      display: flex;
      flex-direction: column;
      gap: 15px;
    }
    label {
      display: flex;
      flex-direction: column;
    }
    input, textarea {
      margin-top: 5px;
      padding: 5px;
      border: 1px solid #ccc;
      border-radius: 4px;
    }
    fieldset {
      border: 1px solid #ccc;
      border-radius: 4px;
      padding: 10px;
    }
    .button-group {
      display: flex;
      justify-content: space-between;
      margin-top: 15px;
    }
    button {
      padding: 10px;
      background-color: #007bff;
      color: white;
      border: none;
      border-radius: 4px;
      cursor: pointer;
    }
    button:hover {
      background-color: #0056b3;
    }
    button[type="button"] {
      background-color: #6c757d;
    }
    button[type="button"]:hover {
      background-color: #5a6268;
    }
  </style>