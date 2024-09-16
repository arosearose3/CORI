<script>
    import TaskManagement from './TaskManagement.svelte';
    import ReferralAssignments from './ReferralAssignments.svelte';
  
    let tasks = []; // Fetch tasks from API or store
    let referrals = []; // Fetch referral assignments
  </script>
  
  <div>
    <h1>Coordinator Dashboard</h1>
    <section>
      <h2>Manage Tasks</h2>
      <TaskManagement {tasks} />
    </section>
  
    <section>
      <h2>Referral Assignments</h2>
      <ReferralAssignments {referrals} />
    </section>
  </div>
  