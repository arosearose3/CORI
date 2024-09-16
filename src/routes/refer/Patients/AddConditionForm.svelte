<script>
    export let selectedPatient;
    let condition = '';
    let status = 'Active';
  
    function addCondition() {
      console.log(`Adding condition for ${selectedPatient.name}: ${condition} - ${status}`);
      // Add logic to save condition
    }
  </script>
  
  <div>
    <h3>Add Condition for {selectedPatient.name}</h3>
  
    <form on:submit|preventDefault={addCondition}>
      <label>
        Condition:
        <input type="text" bind:value={condition} required />
      </label>
      <br />
      
      <label>
        Status:
        <select bind:value={status}>
          <option value="Active">Active</option>
          <option value="Inactive">Inactive</option>
        </select>
      </label>
      <br />
  
      <button type="submit">Add Condition</button>
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
  