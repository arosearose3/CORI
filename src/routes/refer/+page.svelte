<script>
    import NavBar from './NavBar.svelte';
    import SummaryMetrics from './SummaryMetrics2.svelte';
    import ReferralTable from './ReferalTable.svelte';
    import NotificationBell from './NotificationBell.svelte';
    import TaskStateDiagram from './TaskStateDiagram.svelte';
  
    // Dummy data for demonstration
    let totalReferrals = 150;
    let pendingReferrals = 50;
    let inProgressReferrals = 70;
    let completedReferrals = 30;
  
    let referrals = [
      { id: 1, status: 'Pending', assignedTo: 'Dr. Smith', lastUpdate: '2024-09-10' },
      { id: 2, status: 'In-Progress', assignedTo: 'Dr. Johnson', lastUpdate: '2024-09-09' },
      { id: 3, status: 'Completed', assignedTo: 'Dr. Brown', lastUpdate: '2024-09-08' }
    ];
  
    let section = 'dashboard'; // To track the current section
  
    function handleNavigation(event) {
      section = event.detail.section; // Update the section when the event is dispatched from NavBar
    }
  </script>
  
  <main class="system-admin-dashboard">
    <div class="sidebar">
      <NavBar on:navigate={handleNavigation} currentSection={section} />
    </div>
  
    <div class="main-content">
      <header class="dashboard-header">
        <h1>System Admin Dashboard</h1>
        <NotificationBell />
      </header>
  
      {#if section === 'dashboard'}
        <SummaryMetrics 
          totalReferrals={totalReferrals}
          pendingReferrals={pendingReferrals}
          inProgressReferrals={inProgressReferrals}
          completedReferrals={completedReferrals}
        />
        <ReferralTable {referrals} />
      {/if}
  
      {#if section === 'createReferral'}
        <!-- Component for creating referral (to be developed later) -->
        <p>Referral creation form will go here</p>
      {/if}
  
      {#if section === 'notifications'}
        <!-- Notification section to view all notifications (to be developed later) -->
        <p>All system notifications will go here</p>
      {/if}
  
      <!-- Add other sections as required for the Admin Dashboard -->
    </div>
    <TaskStateDiagram />
  </main>
  
  <style>
    .system-admin-dashboard {
      display: flex;
      height: 100vh;
      background-color: #f4f6f8;
    }
  
    .sidebar {
      width: 250px;
      background-color: #007bff;
      color: white;
    }
  
    .main-content {
      flex-grow: 1;
      padding: 1.5rem;
      background-color: #fff;
    }
  
    .dashboard-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1rem;
    }
  
    .dashboard-header h1 {
      margin: 0;
      font-size: 1.5rem;
    }
  </style>
  