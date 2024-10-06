<script>
    import { onMount } from 'svelte';
    import { user } from '$lib/stores.js';
  
    let emailChecked = false;
    let smsChecked = false;
    let limitTextingChecked = false;
    let smsNumber = '';
    let dateOfBirth = '';
    let npi = '';
    let startTime = '09:00';
    let endTime = '17:00';
  
    $: ({ practitioner } = $user);
  
    onMount(() => {
      smsNumber = $user.practitioner.sms || '';
      dateOfBirth = $user.practitioner.dob || '';
      npi = $user.practitioner.npi || '';
    });
  
    function formatDate(date) {
      return date ? new Date(date).toISOString().split('T')[0] : '';
    }
  
    function updateDOB(event) {
      dateOfBirth = event.target.value;
      user.update(u => {
        u.practitioner.dob = dateOfBirth;
        return u;
      });
    }
  
    function updateSMS(event) {
      smsNumber = event.target.value;
      user.update(u => {
        u.practitioner.sms = smsNumber;
        return u;
      });
    }
  
    function updateNPI(event) {
      npi = event.target.value;
      user.update(u => {
        u.practitioner.npi = npi;
        return u;
      });
    }
  
    function changedStartTime() {
      console.log('Start time changed to:', startTime);
      // Add your logic here to handle the start time change
    }
  
    function changedEndTime() {
      console.log('End time changed to:', endTime);
      // Add your logic here to handle the end time change
    }
  
    const timeOptions = [
      {value: '06:00', label: '6 am'}, {value: '07:00', label: '7 am'}, 
      {value: '08:00', label: '8 am'}, {value: '09:00', label: '9 am'}, 
      {value: '10:00', label: '10 am'}, {value: '11:00', label: '11 am'}, 
      {value: '12:00', label: '12 noon'}, {value: '13:00', label: '1 pm'}, 
      {value: '14:00', label: '2 pm'}, {value: '15:00', label: '3 pm'}, 
      {value: '16:00', label: '4 pm'}, {value: '17:00', label: '5 pm'}, 
      {value: '18:00', label: '6 pm'}, {value: '19:00', label: '7 pm'}, 
      {value: '20:00', label: '8 pm'}, {value: '21:00', label: '9 pm'}, 
      {value: '22:00', label: '10 pm'}
    ];
  </script>
  
  <div class="provider-settings">
    <h3>Provider Settings</h3>
  
    <h4>Notification Preferences</h4>
    
    <div class="preference">
      <label>
        <input type="checkbox" bind:checked={emailChecked}>
        Email
      </label>
      {#if emailChecked}
        <p>{$user.user.email}</p>
      {/if}
    </div>
  
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
        type="text" 
        id="dob" 
        value={formatDate(dateOfBirth)} 
        on:input={updateDOB}
      >
      <input type="date" value={dateOfBirth} on:change={updateDOB}>
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
  </div>
  
  <style>
    .provider-settings {
      max-width: 500px;
      margin: 0 auto;
      text-align: left;
    }
  
    .preference {
      margin-bottom: 15px;
    }
  
    .limit-texting {
      margin-top: 10px;
    }
  
    label {
      display: inline-block;
      margin-right: 10px;
    }
  
    input[type="text"],
    input[type="tel"],
    select {
      width: 200px;
      padding: 5px;
      margin-right: 10px;
      font-size: inherit;
      font-family: inherit;
    }
  
    select {
      width: auto;
      padding-left: 20px;
      padding-right: 20px;
    }
  
    .greyed-out {
      color: #888;
    }
  
    h3 {
      margin-top: 0;
      margin-bottom: 20px;
    }
  
    h4 {
      margin-top: 20px;
      margin-bottom: 10px;
    }
  
    p {
      margin: 5px 0;
    }
  </style>