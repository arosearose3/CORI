<script>
    let patient = '';
    let reason = '';
    let referralDate = '';
  
    function submitReferral() {
      console.log(`Referral created for ${patient} with reason: ${reason}`);
      // Add logic to handle the referral creation (e.g., API call)
    }
  </script>
  
  <div>
    <h2>Create New Referral</h2>
  
    <form on:submit|preventDefault={submitReferral}>
      <label>
        Patient:
        <input type="text" bind:value={patient} required />
      </label>
      <br />
  
      <label>
        Reason for Referral:
        <input type="text" bind:value={reason} required />
      </label>
      <br />
  
      <label>
        Referral Date:
        <input type="date" bind:value={referralDate} required />
      </label>
      <br />
  
      <button type="submit">Submit Referral</button>
    </form>
  </div>
  
  <style>
    label {
      display: block;
      margin-bottom: 10px;
    }
    input {
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
  