<script>
    import { createEventDispatcher, onMount } from 'svelte';
  
    export let currentPractitionerId;
  
    let patients = [];
    let selectedPatientId = null;
    let isLoading = true;
    let error = null;
    let noPatientsFound = false; // Track if no patients are found
  
    const dispatch = createEventDispatcher();
  
    // Watch for practitionerId changes and fetch patients accordingly
    $: if (currentPractitionerId) {
      console.log(`Practitioner ID: ${currentPractitionerId}`); // Debugging log for practitionerId
      fetchPatients();
    } else {
      console.log('No Practitioner ID provided');
    }
  
    // Function to fetch patients for the practitioner
    async function fetchPatients() {
      if (!currentPractitionerId) {
        error = 'Practitioner ID is required.';
        return;
      }
  
      console.log('Fetching patients for practitioner ID:', currentPractitionerId); // Debugging log
  
      isLoading = true;
      noPatientsFound = false; // Reset flag
  
      try {
        const response = await fetch(`/avail/api/patient/getPractitionersPatients?practitionerId=${currentPractitionerId}`);
  
        console.log('API Response:', response); // Log the raw response object
  
        if (!response.ok) {
          throw new Error(`Failed to fetch patients: ${response.status}`);
        }
  
        const data = await response.json();
        console.log('API Data:', data); // Log the data received
  
        patients = processPatientBundle(data); // Process the FHIR bundle
  
        console.log('Processed Patients:', patients); // Debugging log
  
        // Check if no patients were returned
        if (patients.length === 0) {
          noPatientsFound = true;
        }
      } catch (e) {
        console.error('Error fetching patients:', e.message); // Log any error
        error = e.message;
      } finally {
        isLoading = false;
      }
    }
  
    // Process the FHIR patient bundle into a usable array of patients
    function processPatientBundle(bundle) {
      if (!bundle || !bundle.entry || !Array.isArray(bundle.entry)) {
        return [];
      }
  
      return bundle.entry.map((entry) => {
        const resource = entry.resource;
        return {
          id: resource.id || '',
          name: resource.name || [],
          gender: resource.gender || 'unknown',
          birthDate: resource.birthDate || 'N/A',
        };
      });
    }
  
    // Format the patient's name from the FHIR data
    function formatName(name) {
      if (!name || !name.length) return 'N/A';
      const { given, family } = name[0];
      return `${given ? given.join(' ') : ''} ${family || ''}`.trim();
    }
  
    // Handle patient selection
    function selectPatient(patientId, patientName) {
      selectedPatientId = patientId;
      dispatch('patientChanged', { patientId, patientName });
    }
</script>
  
<div class="pick-patient">
  {#if isLoading}
    <p>Loading patients...</p>
  {:else if error}
    <p class="error">Error: {error}</p>
  {:else if noPatientsFound}
    <p>No patients found for this practitioner.</p>
  {:else}
    <h3>Select a Patient</h3>
    <ul>
      {#each patients as patient}
        <li>
          <label>
            <input
              type="radio"
              name="patient"
              value={patient.id}
              on:change={() => selectPatient(patient.id, formatName(patient.name))}
              checked={selectedPatientId === patient.id}
            />
            {formatName(patient.name)} ({patient.gender}, {patient.birthDate})
          </label>
        </li>
      {/each}
    </ul>
  {/if}
</div>
  
<style>
  .pick-patient {
    padding: 20px;
  }

  h3 {
    margin-bottom: 10px;
  }

  ul {
    list-style-type: none;
    padding: 0;
  }

  li {
    margin-bottom: 10px;
  }

  .error {
    color: red;
  }
</style>
