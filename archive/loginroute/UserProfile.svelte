<script>
  import { userPractitionerStore } from '$lib/stores.js'; // Import the combined store
  import ProfileImage from './ProfileImage.svelte'; // Import the profile image component

  // Access the user data from the combined store
  let userData;

  // Reactive statement to update userData from the combined store
  $: userData = $userPractitionerStore.user;

  // Debug logs to inspect user data
  console.log("in UserProfile - user: ", userData);
  if (userData) {
    console.log("in UserProfile - user.name: ", userData.name);
  }
</script>

<div class="user-profile">
  {#if userData}
    <div class="profile-header">
      <ProfileImage src={userData.picture} alt={userData.name} />
      <h3>{userData.name}</h3>
    </div>
    <table>
      <tr>
        <th>Property</th>
        <th>Value</th>
      </tr>
      {#each Object.entries(userData) as [key, value]}
        <tr>
          <td>{key}</td>
          <td>{key === 'picture' ? '<Image URL>' : value}</td>
        </tr>
      {/each}
    </table>
  {:else}
    <p>No user data available.</p>
  {/if}
</div>

<style>
  .user-profile {
    max-width: 600px;
    margin: 0 auto;
    padding: 20px;
  }
  .profile-header {
    display: flex;
    align-items: center;
    margin-bottom: 20px;
  }
  h3 {
    margin-left: 20px;
  }
  table {
    width: 100%;
    border-collapse: collapse;
  }
  th,
  td {
    text-align: left;
    padding: 8px;
    border-bottom: 1px solid #ddd;
  }
  th {
    background-color: #f2f2f2;
  }
</style>
