<script>
    let activeReferrals = [
      { id: 1, patient: 'John Doe', status: 'In Progress', date: '2023-09-13' },
      { id: 2, patient: 'Jane Smith', status: 'Pending', date: '2023-09-12' }
    ];
  </script>
  
  <div>
    <h2>Active Referrals</h2>
    <ul>
      {#each activeReferrals as referral}
        <li>
          <strong>Patient:</strong> {referral.patient} | 
          <strong>Status:</strong> {referral.status} | 
          <strong>Date:</strong> {referral.date}
        </li>
      {/each}
    </ul>
  </div>
  
  <style>
    ul {
      list-style-type: none;
      padding: 0;
    }
    li {
      padding: 5px;
      border-bottom: 1px solid #ccc;
    }
  </style>
  