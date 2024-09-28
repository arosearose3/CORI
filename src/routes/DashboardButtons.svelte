<!-- DashboardButtons.svelte -->
<script>
  export let ability;
</script>

<div class="dashboard-buttons">
  {#if ability?.can('view', 'AdminDashboard')}
    <button class="nav-button" aria-label="Admin Dashboard">
      Admin Dashboard
    </button>
  {/if}

  {#if ability?.can('view', 'CoordinatorDashboard')}
    <button class="nav-button" aria-label="Coordinator Dashboard">
      Coordinator Dashboard
    </button>
  {/if}
</div>

<style>
  .dashboard-buttons {
    margin-bottom: 15px;
  }

  .nav-button {
    padding: 10px 15px;
    margin-bottom: 8px;
    background-color: #007bff;
    color: white;
    border: none;
    cursor: pointer;
    border-radius: 4px;
    width: 100%;
    text-align: left;
    font-size: 14px;
    transition: background-color 0.3s;
  }

  .nav-button:hover {
    background-color: #0056b3;
  }

  .nav-button:disabled {
    background-color: #ccc;
    cursor: not-allowed;
  }
</style>
