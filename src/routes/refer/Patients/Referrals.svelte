<script>
    import { onMount } from 'svelte';
    export let currentPatientId;
    let referrals = [];
    let showForm = false;
  
    // Form state for ServiceRequest
    let serviceRequestData = {
      status: 'draft',
      intent: 'proposal',
      priority: 'routine',
      category: [],
      pertainsToGoal: '',
      code: '',
    };
  
    // Patient's goals for 'pertainsToGoal' field
    let goals = [];
  
    // SDOH categories with display name and definition for tooltips
    let sdohCategories = [
      { code: 'sdoh-category-unspecified', display: 'SDOH Category Unspecified', definition: 'Category for Social Determinant of Health artifacts that are not further specified with respect to category.' },
      { code: 'food-insecurity', display: 'Food Insecurity', definition: 'Uncertain, limited, or unstable access to food that is: adequate in quantity and in nutritional quality; culturally acceptable; safe and acquired in socially acceptable ways.' },
      { code: 'housing-instability', display: 'Housing Instability', definition: 'Currently consistently housed, but experiencing being behind on rent, multiple moves, or housing cost burden in the past 12 months.' },
      { code: 'homelessness', display: 'Homelessness', definition: 'Includes Sheltered Homelessness and Unsheltered Homelessness.' },
      { code: 'inadequate-housing', display: 'Inadequate Housing', definition: 'Housing does not meet habitability standards.' },
      { code: 'transportation-insecurity', display: 'Transportation Insecurity', definition: 'Uncertain, limited, or no access to safe, reliable, accessible, affordable, and socially acceptable transportation infrastructure.' },
      { code: 'financial-insecurity', display: 'Financial Insecurity', definition: 'Difficulty fully meeting current and ongoing financial obligations.' },
      { code: 'material-hardship', display: 'Material Hardship', definition: 'The lack of specific socially perceived basic physical necessities.' },
      { code: 'educational-attainment', display: 'Educational Attainment', definition: 'The level of education attained (high school diploma or equivalent).' },
      { code: 'employment-status', display: 'Employment Status', definition: 'The status of employment, whether looking for and available for work.' },
      { code: 'veteran-status', display: 'Veteran Status', definition: 'Whether one has served as active military with honorable release or discharge.' },
      { code: 'stress', display: 'Stress', definition: 'When a person perceives the demands of environmental stimuli to be greater than their ability to meet, mitigate, or alter those demands.' },
      { code: 'social-connection', display: 'Social Connection', definition: 'The structural, functional, and quality aspects of how individuals connect to each other.' },
      { code: 'intimate-partner-violence', display: 'Intimate Partner Violence', definition: 'Physical violence, sexual violence, or psychological harm by a current or former partner or spouse.' },
      { code: 'elder-abuse', display: 'Elder Abuse', definition: 'Intentional act or failure to act by a caregiver that causes harm to an older adult.' },
      { code: 'personal-health-literacy', display: 'Personal Health Literacy', definition: 'The ability to find, understand, and use information and services to inform health-related decisions.' },
      { code: 'health-insurance-coverage-status', display: 'Health Insurance Coverage Status', definition: 'Whether one has or does not have healthcare coverage or insurance.' },
      { code: 'medical-cost-burden', display: 'Medical Cost Burden', definition: 'A measure of financial pressure resulting from health spending.' },
      { code: 'digital-literacy', display: 'Digital Literacy', definition: 'The ability to access, manage, understand, integrate, communicate, and create information through digital devices and technologies.' },
      { code: 'digital-access', display: 'Digital Access', definition: 'Lacking adequate internet or a digital device to access the internet.' },
      { code: 'utility-insecurity', display: 'Utility Insecurity', definition: 'Inability to meet basic household energy needs (heating, cooling, etc.) and/or water needs due to service difficulties.' }
    ];
  
    // Fetch existing referrals and patient goals
    async function fetchReferrals() {
      try {
        const response = await fetch(`/servicerequests/${currentPatientId}`);
        referrals = await response.json();
      } catch (error) {
        console.error('Error fetching referrals:', error);
      }
    }
  
    async function fetchPatientGoals() {
      try {
        const response = await fetch(`/goal/patient/${currentPatientId}`);
        goals = await response.json();
      } catch (error) {
        console.error('Error fetching patient goals:', error);
      }
    }
  
    onMount(() => {
      fetchReferrals();
      fetchPatientGoals();
    });
  
    // Toggle form visibility
    function showNewReferralForm() {
      showForm = true;
    }
  
    // Handle form submission
    async function handleSubmit() {
      try {
        const response = await fetch('/servicerequests/add', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            ...serviceRequestData,
            subject: `Patient/${currentPatientId}`
          })
        });
        if (response.ok) {
          alert('ServiceRequest added successfully');
          showForm = false;  // Hide form after submission
          fetchReferrals();  // Refresh the list
        } else {
          alert('Failed to add ServiceRequest');
        }
      } catch (error) {
        console.error('Error adding ServiceRequest:', error);
      }
    }
  
    // Toggle category selection (checkboxes)
    function toggleCategory(code) {
      if (serviceRequestData.category.includes(code)) {
        serviceRequestData.category = serviceRequestData.category.filter(c => c !== code);
      } else {
        serviceRequestData.category = [...serviceRequestData.category, code];
      }
    }
  </script>
  
  <div class="referrals-section">
    <h2>Referrals</h2>
  
    {#if !showForm}
      <!-- Button and referrals list -->
      <button on:click={showNewReferralForm}>New Referral</button>
      {#if referrals.length > 0}
        <ul>
          {#each referrals as referral}
            <li>{referral.id}: {referral.description}</li>
          {/each}
        </ul>
      {:else}
        <p>No referrals found.</p>
      {/if}
    {/if}
  
    {#if showForm}
      <!-- New Referral Form -->
      <form on:submit|preventDefault={handleSubmit}>
        <h3>New Service Request</h3>
  
        <!-- Status and Intent -->
        <label>
          Status:
          <input type="text" bind:value={serviceRequestData.status} readonly />
        </label>
        <label>
          Intent:
          <input type="text" bind:value={serviceRequestData.intent} readonly />
        </label>
  
        <!-- Priority -->
        <label>
          Priority:
          <select bind:value={serviceRequestData.priority}>
            <option value="routine">Routine</option>
            <option value="urgent">Urgent</option>
            <option value="asap">ASAP</option>
            <option value="stat">Stat</option>
          </select>
        </label>
  
        <!-- SDOH Categories (Checkboxes with Tooltips) -->
        <fieldset>
          <legend>SDOH Categories</legend>
          {#each sdohCategories as category}
            <div class="checkbox-group">
              <input type="checkbox" on:change={() => toggleCategory(category.code)} />
              <label title={category.definition}>{category.display}</label>
            </div>
          {/each}
        </fieldset>
  
        <!-- Pertains To Goal (Dropdown) -->
        <label>
          Pertains to Goal:
          <select bind:value={serviceRequestData.pertainsToGoal}>
            <option value="">Select a Goal</option>
            {#each goals as goal}
              <option value={goal.id}>{goal.description}</option>
            {/each}
          </select>
        </label>
  
        <!-- Code -->
        <label>
          Code:
          <input type="text" bind:value={serviceRequestData.code} placeholder="Enter service code" />
        </label>
  
        <!-- Submit Button -->
        <button type="submit">Submit</button>
      </form>
    {/if}
  </div>
  
  <style>
    .referrals-section {
      padding: 20px;
    }
  
    ul {
      list-style-type: none;
      padding: 0;
    }
  
    li {
      padding: 10px 0;
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
  
    form {
      display: flex;
      flex-direction: column;
      gap: 10px;
    }
  
    label {
      display: flex;
      flex-direction: column;
    }
  
    fieldset {
      border: 1px solid #ccc;
      padding: 10px;
      border-radius: 4px;
    }
  
    .checkbox-group {
      display: flex;
      align-items: center;
      margin-bottom: 5px;
    }
  
    input[type="checkbox"] {
      margin-right: 10px;
    }
  
    legend {
      font-weight: bold;
    }
  
    label[title] {
      cursor: help;
    }
  </style>
  