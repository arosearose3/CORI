<script>
  import { onMount } from 'svelte';
  import { user } from '$lib/stores.js'; // Import user store
  import UpdateSchedule from '../update-schedule/UpdateSchedule.svelte'; // Import the Availability component
  import PickPatient from './PickPatient.svelte'; // Import PickPatient for Clients
  import PractitionerSettings from './PractitionerSettings.svelte'; // Import Settings component
  import PractitionerNotices from './PractitionerNotices.svelte'; // Import Notices component
  import Patients from './Patients/Patients.svelte'; // Import Patients component

  let selectedChild = 'availability'; // Default to 'availability'
  let currentPractitionerName = null; // Store the practitioner's name from FHIR
  let currentPractitionerId = null; // Store the practitioner's FHIR ID
  let showPatientPicker = false; // Control visibility of the PickPatient component
  let showPatientsComponent = false; // Show Patients component after patient selection
  let currentPatientName = null; // Store the selected patient name
  let currentPatientId = null; // Store the selected patient ID
  let practitionerOptions = []; // To store multiple practitioners if more than one is found
  let selectedPractitionerIndex = null; // For radio button selection

  async function fetchPractitionersByEmail(email) {
    try {
      const response = await fetch(`/avail/api/practitioner/findWithEmail?email=${encodeURIComponent(email)}`);
      
      if (response.ok) {
        const data = await response.json();

        // If no practitioners are found, return an empty array
        if (!data || data.length === 0) {
          console.log('No practitioners found');
          return [];
        }

        // Process each practitioner found and return an array of objects with id, given, and family name
        return data.map(practitioner => {
          const givenName = practitioner.name[0]?.given?.join(' ') || 'Unknown'; // Combine given names if multiple
          const familyName = practitioner.name[0]?.family || 'Unknown';
          return {
            id: practitioner.id,
            name: `${givenName} ${familyName}`
          };
        });

      } else {
        throw new Error('Unable to fetch practitioner information');
      }
    } catch (error) {
      console.error('Error fetching practitioners:', error);
      return [];
    }
  }

  // Fetch practitioner information on component mount
  onMount(async () => {
    if ($user && $user.email) {
      const practitioners = await fetchPractitionersByEmail($user.email);
      
      if (practitioners.length === 1) {
        // If there's only one practitioner, use that one
        currentPractitionerId = practitioners[0].id;
        currentPractitionerName = practitioners[0].name;
        showPatientPicker = true; // Show patient picker once practitioner is selected
      } else if (practitioners.length > 1) {
        // If there are multiple practitioners, show the selection radio button list
        practitionerOptions = practitioners;
      } else {
        console.error('No practitioners found');
      }
    }
  });

  // Handle practitioner selection event from the radio button list
  function handlePractitionerSelection() {
    if (selectedPractitionerIndex !== null) {
      const selected = practitionerOptions[selectedPractitionerIndex];
      currentPractitionerId = selected.id;
      currentPractitionerName = selected.name;
      showPatientPicker = true; // Show patient picker once practitioner is selected
    }
  }

  // Handle patient selection event
  function handlePatientSelected(event) {
    const { patientId, patientName } = event.detail;
    currentPatientName = patientName;
    currentPatientId = patientId;
    showPatientPicker = false; // Hide PickPatient after selection
    showPatientsComponent = true; // Show Patients component
  }

  // Show the relevant component when a navigation item is selected
  function showComponent(component) {
    selectedChild = component;
  }
</script>

<div class="dashboard">
  <!-- If multiple practitioners are found, display radio button list for selection -->
  {#if practitionerOptions.length > 1 && !currentPractitionerId}
    <div>
      <h3>Select a Practitioner:</h3>
      {#each practitionerOptions as practitioner, index}
        <div>
          <input type="radio" id={practitioner.id} name="practitioner" value={index} bind:group={selectedPractitionerIndex} />
          <label for={practitioner.id}>{practitioner.name}</label>
        </div>
      {/each}
      <button on:click={handlePractitionerSelection} disabled={selectedPractitionerIndex === null}>Continue</button>
    </div>
    {/if}
  {#if currentPractitionerId}
    <!-- If practitioner is loaded, show dashboard -->
    <div>
      <!-- Display the current practitioner's name -->
      <h2>Practitioner: {currentPractitionerName}</h2>
      {#if currentPatientName}
        <h2>Patient: {currentPatientName}</h2>
      {:else}
        <h2>No current patient selected.</h2>
      {/if}

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
            <Patients {currentPatientId} {currentPractitionerId} />
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
  {:else}
    <p>Loading practitioner information...</p>
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

    box-sizing: border-box;
  }
</style>
