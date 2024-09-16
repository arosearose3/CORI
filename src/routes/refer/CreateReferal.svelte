<script>
    let patientName = '';
    let referralReason = '';
    let assignedTo = '';
  
    function submitReferral() {
      const referral = {
        patientName,
        referralReason,
        assignedTo,
        status: 'Pending',
        lastUpdate: new Date().toISOString(),
      };
      console.log('Submitting referral:', referral);
      // Handle referral creation logic here (e.g., call an API)
    }
  </script>
  
  <form on:submit|preventDefault={submitReferral} class="create-referral">
    <div>
      <label>Patient Name</label>
      <input type="text" bind:value={patientName} required />
    </div>
    <div>
      <label>Reason for Referral</label>
      <textarea bind:value={referralReason} required></textarea>
    </div>
    <div>
      <label>Assign To</label>
      <input type="text" bind:value={assignedTo} required />
    </div>
    <button type="submit">Create Referral</button>
  </form>
  
  <style>
    .create-referral div {
      margin-bottom: 1rem;
    }
    .create-referral label {
      display: block;
      margin-bottom: 0.5rem;
    }
    .create-referral input, .create-referral textarea {
      width: 100%;
      padding: 0.5rem;
      border: 1px solid #ddd;
      border-radius: 4px;
    }
    .create-referral button {
      background: #007bff;
      color: white;
      padding: 0.75rem 1.5rem;
      border: none;
      border-radius: 4px;
      cursor: pointer;
    }
  </style>
  