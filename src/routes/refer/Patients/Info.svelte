<script>
    import GoalsList from './GoalsList.svelte';
    import ConditionsList from './ConditionsList.svelte';
    import AddGoalForm from './AddGoalForm.svelte'; // Assuming you have AddGoalForm component
    import AddConditionForm from './AddConditionForm.svelte'; // Assuming you have AddConditionForm component
  
    export let currentPatientId;
  
    let showGoalForm = false;
    let showConditionForm = false;
  
    function addGoal() {
      showGoalForm = true;
      showConditionForm = false;
    }
  
    function addCondition() {
      showGoalForm = false;
      showConditionForm = true;
    }
  </script>
  
  <div class="info-section">
    {#if showGoalForm}
      <!-- Display the Add Goal form -->
      <AddGoalForm {currentPatientId} />
    {:else if showConditionForm}
      <!-- Display the Add Condition form -->
      <!-- <AddConditionForm {currentPatientId} /> -->
    {:else}
      <!-- Default view with Goals and Conditions lists -->
      <h4>Goals</h4>
      <button on:click={addGoal}>Add Goal</button>
      <!-- <GoalsList {currentPatientId} /> -->
  
      <h4>Conditions</h4>
      <button on:click={addCondition}>Add Condition</button>
      <!-- <ConditionsList {currentPatientId} /> -->
    {/if}
  </div>
  
  <style>
    .info-section {
      padding: 20px;
    }
  
    button {
      padding: 10px;
      margin-bottom: 15px;
      background-color: #007bff;
      color: white;
      border: none;
      cursor: pointer;
    }
  
    button:hover {
      background-color: #0056b3;
    }
  </style>
  