<script>
  import UpdateSchedule from '../update-schedule/UpdateSchedule.svelte'; // Import the Availability component
  import PickPatient from './PickPatient.svelte'; // Import PickPatient for Clients
  import PractitionerSettings from './PractitionerSettings.svelte'; // Import Settings component
  import PractitionerNotices from './PractitionerNotices.svelte'; // Import Notices component
  import PickPractitioner from './PickPractitioner.svelte';
  import Patients from './Patients/Patients.svelte';

  let selectedChild = 'availability'; // Default to 'availability'
  let currentPractitionerName = null; // Store the selected practitioner name
  let currentPractitionerId = null;
  let showPractitionerPicker = true; // Control visibility of the PickPractitioner component

  let currentPatientName = null; // Store the selected patient name
  let currentPatientId = null;

  let showPatientPicker = false; // Control visibility of the PickPatient component
  let showPatientsComponent = false; // Show Patients component after patient selection


  // Show the relevant component when a navigation item is selected
  function showComponent(component) {
    selectedChild = component;
  }

  // Handle practitioner selection event
  function handlePractitionerSelected(event) {
    const { id, name } = event.detail; // Extract id and name from the event
    currentPractitionerName = name; // Set practitioner name
    currentPractitionerId = id;
    showPractitionerPicker = false; // Hide practitioner picker
    showPatientPicker = true; // Show patient picker after practitioner is selected
  }

  // Handle patient selection event
  function handlePatientSelected(event) {
    const { patientId, patientName } = event.detail;
    currentPatientName = patientName;
    currentPatientId = patientId;
    showPatientPicker = false; // Hide PickPatient after selection
    showPatientsComponent = true; // Show Patients component
  }
</script>

<div class="dashboard">
  <!-- Show practitioner picker if no practitioner is selected -->
  {#if showPractitionerPicker}
    <PickPractitioner on:practitionerSelected={handlePractitionerSelected} />
  {:else}
    <!-- Main dashboard content when a practitioner is selected -->
    <div>
      <!-- Display the current practitioner's name -->
      <h3>Current Practitioner: {currentPractitionerName}</h3>
      <h3>Current Practitioner ID: {currentPractitionerId}</h3>

      <!-- Top navigation bar -->
      <nav class="top-nav">
        <ul>
          <li on:click={() => showComponent('availability')} class:selected={selectedChild === 'availability'}>Availability</li>
          <li on:click={() => showComponent('clients')} class:selected={selectedChild === 'clients'}>Clients</li>
          <li on:click={() => showComponent('settings')} class:selected={selectedChild === 'settings'}>Settings</li>
          <li on:click={() => showComponent('notices')} class:selected={selectedChild === 'notices'}>Notices</li>
        </ul>
      </nav>

      <!-- Main content area based on selected navigation -->
      <main>
        {#if selectedChild === 'availability'}
          <UpdateSchedule {currentPractitionerId} />
        {/if}
        {#if selectedChild === 'clients'}
         {#if showPatientPicker}
            <PickPatient on:patientChanged={handlePatientSelected} {currentPractitionerId} />
         {/if}
    
      <!-- If patient is selected, show the Patients component -->
         {#if showPatientsComponent}
          <Patients {currentPatientId} />
         {/if}
        {/if}

        {#if selectedChild === 'settings'}
          <PractitionerSettings {currentPractitionerId} />
        {/if}
        {#if selectedChild === 'notices'}
          <PractitionerNotices {currentPractitionerId} />
        {/if}
      </main>
    </div>
  {/if}
</div>

<style>
  .dashboard {
    display: flex;
    flex-direction: column;
    align-items: center;
  }

  h3 {
    margin-bottom: 10px;
    color: #333;
  }

  /* Top navigation bar styles */
  .top-nav {
    width: 100%;
    background-color: #f0f0f0;
    padding: 10px 0;
  }

  .top-nav ul {
    list-style-type: none;
    display: flex;
    justify-content: space-around;
    padding: 0;
    margin: 0;
  }

  .top-nav li {
    cursor: pointer;
    padding: 10px 20px;
    background-color: #fff;
    border: 1px solid #ccc;
    border-radius: 5px;
    transition: background-color 0.3s ease;
  }

  .top-nav li:hover {
    background-color: #ddd;
  }

  .top-nav li.selected {
    background-color: #007bff;
    color: white;
  }

  main {
    flex-grow: 1;
    width: 100%;
    padding: 20px;
    box-sizing: border-box;
  }
</style>
