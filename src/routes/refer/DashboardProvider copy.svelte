<script>
  import ActiveReferrals from './ActiveReferrals.svelte';
  import NewReferral from './NewReferral.svelte';
  import ListConsents from './Consents/ListConsents.svelte';
  import AddConsent from './Consents/AddConsent.svelte';
  import Patients from './Patients/Patients.svelte';
  import PickPractitioner from './PickPractitioner.svelte'; // Import PickPractitioner
  import PickPatient from './PickPatient.svelte'; // Import PickPatient

  let selectedChild = 'activeReferrals';
  let currentPractitionerName = null; // Store the selected practitioner name
  let currentPractitionerId = null;
  let currentPatientName = null; // Store the selected patient name
  let currentPatientId = null;
  let showPractitionerPicker = true; // Control visibility of the PickPractitioner component
  let showPatientPicker = false; // Control visibility of the PickPatient component

  // Show the relevant component when practitioner is selected
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
    console.log ("DashProvider - patient selected");
    const { patientId, patientName } = event.detail; // Extract id and name from the event
    currentPatientName = patientName; // Set patient name
    currentPatientId = patientId;
    showPatientPicker = false; // Hide patient picker

    console.log ("DashProvider - patient Id:"+patientId);
    console.log ("DashProvider - patient Name:"+patientName);

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

      <!-- Show patient picker if no patient is selected -->
      {#if showPatientPicker}
        <PickPatient on:patientChanged={handlePatientSelected} {currentPractitionerId} />
      {:else if currentPatientName}
        <!-- Display the current patient's name -->
        <h3>Current Patient: {currentPatientName}</h3>
        <h3>Current Patient ID: {currentPatientId}</h3>

        <!-- Left-side navigation -->
        <nav class="sidebar">
          <ul>
            <!-- Referral-related navigation -->
            <li on:click={() => showComponent('activeReferrals')}>Active Referrals</li>
            <li on:click={() => showComponent('newReferral')}>New Referral</li>

            <!-- Consent-related navigation -->
            <li on:click={() => showComponent('listConsents')}>List Consents</li>
            <li on:click={() => showComponent('addConsent')}>Add Consent</li>

            <!-- Patients navigation -->
            <li on:click={() => showComponent('patients')}>Patients</li>
          </ul>
        </nav>

        <!-- Main content area -->
        <main>
          {#if selectedChild === 'activeReferrals'}
            <ActiveReferrals />
          {/if}
          {#if selectedChild === 'newReferral'}
            <NewReferral />
          {/if}
          {#if selectedChild === 'listConsents'}
            <ListConsents />
          {/if}
          {#if selectedChild === 'addConsent'}
            <AddConsent />
          {/if}
          {#if selectedChild === 'patients'}
            <Patients />
          {/if}
        </main>
      {/if}
    </div>
  {/if}
</div>

<style>
  .dashboard {
    display: flex;
  }
  .sidebar {
    width: 200px;
    background-color: #f0f0f0;
    padding: 20px;
  }
  ul {
    list-style-type: none;
    padding: 0;
  }
  li {
    cursor: pointer;
    margin-bottom: 10px;
  }
  li:hover {
    font-weight: bold;
  }
  main {
    flex-grow: 1;
    padding: 20px;
  }

  h3 {
    margin-bottom: 20px;
    color: #333;
  }
</style>
