<script>
    export let referrals = [];
  </script>
  
  <ul>
    {#each referrals as referral}
      <li>
        Referral to {referral.target} for {referral.patientName} - Status: {referral.status}
      </li>
    {/each}
  </ul>
  