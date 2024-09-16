<script>
    export let totalReferrals = 0;
    export let pendingReferrals = 0;
    export let inProgressReferrals = 0;
    export let completedReferrals = 0;
  </script>
  
  <div class="metrics">
    <div class="metric">
      <h3>Total Referrals</h3>
      <p>{totalReferrals}</p>
    </div>
    <div class="metric">
      <h3>Pending Referrals</h3>
      <p>{pendingReferrals}</p>
    </div>
    <div class="metric">
      <h3>In-Progress Referrals</h3>
      <p>{inProgressReferrals}</p>
    </div>
    <div class="metric">
      <h3>Completed Referrals</h3>
      <p>{completedReferrals}</p>
    </div>
  </div>
  
  <style>
    .metrics {
      display: flex;
      justify-content: space-between;
    }
    .metric {
      background: #f8f9fa;
      padding: 1rem;
      border-radius: 8px;
      text-align: center;
      width: 20%;
    }
    .metric h3 {
      margin-bottom: 0.5rem;
    }
  </style>
  