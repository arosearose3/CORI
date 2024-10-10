<script>
  import { onMount } from 'svelte';
  import { user } from '$lib/stores.js'; // Import the user store
  import axios from 'axios'; // Use axios to make HTTP requests
  import { fade } from 'svelte/transition'; // Svelte fade transition
  import { base } from '$app/paths';

  let practitioner = {}; // Holds the Practitioner data
  let smsNumber = '';
  let dateOfBirth = '';
  let npi = ''; // NPI is assumed to be in the 'identifier' field
  let startTime = '09:00';
  let endTime = '17:00';
  let isSaveEnabled = false;
  let isSaving = false; // Track if saving is in progress
  let showMessage = false; // Track if the save message should be shown
  let saveMessage = ''; // Message to show after saving
  let smsChecked = false;
  let limitTextingChecked = false;


  const practitionerId = $user.practitioner.Pid; // Get the Practitioner ID from the user store
  const BASE_URL = `${base}/api/practitioner`; // Your API base URL

  // Fetch the Practitioner data on mount
  onMount(async () => {
    try {
      const response = await axios.get(`${BASE_URL}/${practitionerId}`);
      const practitionerResource = response.data || {};

      // Load the practitioner data
      dateOfBirth = practitionerResource.birthDate || '';
      
      // Check for NPI in identifier (if exists)
      if (practitionerResource.identifier) {
        const npiIdentifier = practitionerResource.identifier.find(id => id.system === 'http://hl7.org/fhir/sid/us-npi');
        npi = npiIdentifier ? npiIdentifier.value : '';
      }

      // Check for phone number in telecom
      if (practitionerResource.telecom) {
        const phoneTelecom = practitionerResource.telecom.find(t => t.system === 'phone');
        smsNumber = phoneTelecom ? phoneTelecom.value : '';
      }

    } catch (error) {
      console.error('Failed to load practitioner data:', error);
    }
  });

  function enableSave() {
    isSaveEnabled = true;
  }

  function updateSMS(event) {
    smsNumber = event.target.value;
    enableSave();
  }

  function updateDOB(event) {
    dateOfBirth = event.target.value;
    enableSave();
  }

  function updateNPI(event) {
    npi = event.target.value;
    enableSave();
  }

  function changedStartTime() {
    enableSave();
  }

  function changedEndTime() {
    enableSave();
  }

  // Function to handle Save
  async function handleSave() {
    try {
      // Show "Saving..." on the button
      isSaving = true;
      saveMessage = ''; // Clear any previous message

      // Prepare the updated Practitioner object based on the existing one
      const practitionerResource = {
        ...practitioner, // Use the existing practitioner object
        birthDate: dateOfBirth, // Update the birthDate
        telecom: practitioner.telecom.map(t => t.system === 'phone' ? { ...t, value: smsNumber } : t),
        identifier: practitioner.identifier.map(id => id.system === 'http://hl7.org/fhir/sid/us-npi' ? { ...id, value: npi } : id)
      };

      // Send the updated Practitioner object to the backend
      const response = await axios.put(`${BASE_URL}/update/${practitionerId}`, practitionerResource);
      console.log('Practitioner updated successfully:', response.data);

      // Update the user store for sms, dob, and npi
      user.update(store => {
        store.practitioner.sms = smsNumber;
        store.practitioner.dob = dateOfBirth;
        store.practitioner.npi = npi;
        return store;
      });

      // Show "Saved" on the button
      isSaveEnabled = false;
      saveMessage = 'Saved';
      showMessage = true;

      // Hide the message after 2 seconds
      setTimeout(() => {
        showMessage = false;
      }, 2000);

      // Reset Save button state after saving
      isSaving = false;
    } catch (error) {
      console.error('Failed to update practitioner:', error);
      saveMessage = 'Failed to Save';
      showMessage = true;
      isSaving = false;
    }
  }

  const timeOptions = [
    { value: '06:00', label: '6 am' }, { value: '07:00', label: '7 am' },
    { value: '08:00', label: '8 am' }, { value: '09:00', label: '9 am' },
    { value: '10:00', label: '10 am' }, { value: '11:00', label: '11 am' },
    { value: '12:00', label: '12 noon' }, { value: '13:00', label: '1 pm' },
    { value: '14:00', label: '2 pm' }, { value: '15:00', label: '3 pm' },
    { value: '16:00', label: '4 pm' }, { value: '17:00', label: '5 pm' },
    { value: '18:00', label: '6 pm' }, { value: '19:00', label: '7 pm' },
    { value: '20:00', label: '8 pm' }, { value: '21:00', label: '9 pm' },
    { value: '22:00', label: '10 pm' }
  ];
</script>

<div class="provider-settings">
  <h3>Provider Settings</h3>

  <h4>Notification Preferences</h4>

  <div class="preference">
    <label>
      <input type="checkbox" bind:checked={smsChecked}>
      Text Messages
    </label>
    {#if smsChecked}
      <input
        type="tel"
        placeholder="Phone number"
        value={smsNumber}
        on:input={updateSMS}
      >
      
      <div class="preference limit-texting">
        <label>
          <input type="checkbox" bind:checked={limitTextingChecked}>
          <span class:greyed-out={!limitTextingChecked}>Limit Texting From</span>
        </label>
        <select
          bind:value={startTime}
          on:change={changedStartTime}
          disabled={!limitTextingChecked}
        >
          {#each timeOptions.slice(0, -2) as time}
            <option value={time.value}>{time.label}</option>
          {/each}
        </select>
        <span class:greyed-out={!limitTextingChecked}>to</span>
        <select
          bind:value={endTime}
          on:change={changedEndTime}
          disabled={!limitTextingChecked}
        >
          {#each timeOptions.slice(2) as time}
            <option value={time.value}>{time.label}</option>
          {/each}
        </select>
      </div>
    {/if}
  </div>

  <h4>Date of Birth</h4>
  <div class="preference">
    <label for="dob">Date of Birth:</label>
    <input
      type="date"
      id="dob"
      value={dateOfBirth}
      on:change={updateDOB}
    >
  </div>

  <h4>National Provider Identifier (NPI)</h4>
  <div class="preference">
    <label for="npi">NPI:</label>
    <input
      type="text"
      id="npi"
      value={npi}
      on:input={updateNPI}
    >
  </div>

  <!-- Save Button -->
  <div class="preference">
    <button
      class="save-button"
      on:click={handleSave}
      disabled={!isSaveEnabled || isSaving}
    >
      {isSaving ? 'Saving...' : 'Save'}
    </button>

    {#if showMessage}
      <p class="save-message" transition:fade>{saveMessage}</p>
    {/if}
  </div>
</div>

<style>
  /* Styles */
  .save-button {
    padding: 10px 20px;
    background-color: #007bff;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    opacity: 0.5; /* Dim the button initially */
    transition: opacity 0.3s ease;
  }

  .save-button:enabled {
    opacity: 1; /* Brighten the button when enabled */
  }

  .save-button:disabled {
    cursor: not-allowed;
  }

  .save-message {
    margin-top: 10px;
    color: green;
    animation: fadeout 2s forwards;
  }

  @keyframes fadeout {
    0% { opacity: 1; }
    100% { opacity: 0; visibility: hidden; }
  }
</style>
