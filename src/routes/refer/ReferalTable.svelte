<script>
    export let referrals = [];
  
    function viewReferral(id) {
      console.log('View referral:', id);
      // Handle view logic
    }
  
    function editReferral(id) {
      console.log('Edit referral:', id);
      // Handle edit logic
    }
  
    function markAsCompleted(id) {
      console.log('Mark as completed:', id);
      // Handle completion logic
    }
  </script>
  
  <table class="referral-table">
    <thead>
      <tr>
        <th>Referral ID</th>
        <th>Status</th>
        <th>Assigned To</th>
        <th>Last Update</th>
        <th>Actions</th>
      </tr>
    </thead>
    <tbody>
      {#each referrals as referral}
        <tr>
          <td>{referral.id}</td>
          <td>{referral.status}</td>
          <td>{referral.assignedTo}</td>
          <td>{referral.lastUpdate}</td>
          <td>
            <button on:click={() => viewReferral(referral.id)}>View</button>
            <button on:click={() => editReferral(referral.id)}>Edit</button>
            <button on:click={() => markAsCompleted(referral.id)}>Complete</button>
          </td>
        </tr>
      {/each}
    </tbody>
  </table>
  
  <style>
    .referral-table {
      width: 100%;
      border-collapse: collapse;
    }
    .referral-table th, .referral-table td {
      border: 1px solid #ddd;
      padding: 0.75rem;
    }
    .referral-table th {
      background: #007bff;
      color: white;
    }
    .referral-table td button {
      margin-right: 0.5rem;
    }
  </style>
  