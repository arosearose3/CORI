<script>
    import ReferralsList from './ReferralsList.svelte';
    import GoalTracking from './GoalTracking.svelte';
  
    let referrals = []; // Fetch patient referrals from an API or store
    let goals = [];     // Fetch patient goals from an API or store
  </script>
  
  <div>
    <h1>Patient Dashboard</h1>
    <section>
      <h2>Your Referrals</h2>
      <ReferralsList {referrals} />
    </section>
  
    <section>
      <h2>Goal Tracking</h2>
      <GoalTracking {goals} />
    </section>
  </div>
  