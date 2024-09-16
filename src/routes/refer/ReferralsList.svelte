<script>
    export let referrals = [];
  </script>
  
  <ul>
    {#each referrals as referral}
      <li>
        Referral to {referral.target} - Status: {referral.status}
      </li>
    {/each}
  </ul>
  