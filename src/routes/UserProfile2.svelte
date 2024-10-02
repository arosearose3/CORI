<!-- src/lib/components/UserProfile.svelte -->
<script>
  export let userData = null;
</script>

<style>
  .user-profile {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-top: 20px;
  }

  .user-info {
    text-align: left;
  }

  .user-profile img {
    border-radius: 50%;
    width: 50px;
    height: 50px;
    object-fit: cover;
  }

  .name {
    font-weight: bold;
    font-size: 16px;
  }

  .email {
    font-size: 14px;
    color: #555;
    margin-top: 5px; /* Small spacing between name and email */
  }
</style>

{#if userData}
  <div class="user-profile">
    <!-- Left-aligned name and email -->
    <div class="user-info">
      <div class="name">{userData.name}</div>
      <div class="email">{userData.email}</div>
    </div>

    <!-- Right-aligned profile picture -->
    <img src="{userData.picture}" alt="{userData.name}'s profile picture" />
  </div>
{/if}
