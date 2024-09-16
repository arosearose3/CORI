<script>
    let patient = '';
    let status = 'Active';
    let purpose = '';
  
    function submitConsent() {
      console.log(`Adding consent for ${patient} with purpose: ${purpose}`);
      // Add logic to actually handle consent creation
    }
  </script>
  
  <div>
    <h2>Add New Consent</h2>
  
    <form on:submit|preventDefault={submitConsent}>
      <label>
        Patient:
        <input type="text" bind:value={patient} required />
      </label>
      <br />
  
      <label>
        Purpose:
        <input type="text" bind:value={purpose} required />
      </label>
      <br />
  
      <label>
        Status:
        <select bind:value={status}>
          <option value="Active">Active</option>
          <option value="Revoked">Revoked</option>
        </select>
      </label>
      <br />
  
      <button type="submit">Add Consent</button>
    </form>
  </div>
  
  <style>
    label {
      display: block;
      margin-bottom: 10px;
    }
    input, select {
      margin-left: 10px;
      padding: 5px;
    }
    button {
      margin-top: 10px;
      padding: 8px 12px;
      background-color: #007bff;
      color: white;
      border: none;
      border-radius: 4px;
      cursor: pointer;
    }
  </style>
  