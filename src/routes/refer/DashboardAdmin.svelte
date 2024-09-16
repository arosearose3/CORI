<script>
    import UserManagement from './UserManagement.svelte';
    import SystemHealth from './SystemHealth.svelte';
  
    let users = []; // Fetch user list
    let systemMetrics = {}; // Fetch system health metrics
  </script>
  
  <div>
    <h1>Admin Dashboard</h1>
    <section>
      <h2>User Management</h2>
      <UserManagement {users} />
    </section>
  
    <section>
      <h2>System Health</h2>
      <SystemHealth {systemMetrics} />
    </section>
  </div>
  