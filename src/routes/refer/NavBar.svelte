<script>
    import { createEventDispatcher } from 'svelte';
  
    const dispatch = createEventDispatcher(); // Create an event dispatcher to send events to the parent component
  
    export let currentSection = "dashboard";
  
    function handleNavigation(section) {
      currentSection = section;
      dispatch('navigate', { section }); // Dispatch the 'navigate' event with the selected section
    }
  </script>
  
  <nav class="navbar">
    <ul>
      <li on:click={() => handleNavigation('dashboard')} class:active={currentSection === 'dashboard'}>Dashboard</li>
      <li on:click={() => handleNavigation('createReferral')} class:active={currentSection === 'createReferral'}>Create Referral</li>
      <li on:click={() => handleNavigation('myReferrals')} class:active={currentSection === 'myReferrals'}>My Referrals</li>
      <li on:click={() => handleNavigation('notifications')} class:active={currentSection === 'notifications'}>Notifications</li>
    </ul>
  </nav>
  
  <style>
    .navbar ul {
      list-style: none;
      padding: 0;
    }
    .navbar li {
      cursor: pointer;
      padding: 1rem;
      background: #f0f4f8;
      margin-bottom: 0.5rem;
      color: black; /* Updated to make the text black */
    }
    .navbar li.active {
      background: #007bff;
      color: white;
    }
    .navbar li:hover {
      background: #ddd;
    }
  </style>
  