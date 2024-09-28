<!-- src/lib/components/UserProfile.svelte -->
<script>
  export let userData = null;
</script>

<style>
  .user-profile {
    margin-top: 20px;
    text-align: center;
  }

  .user-profile img {
    border-radius: 50%;
    width: 80px;
    height: 80px;
    object-fit: cover;
    margin-bottom: 10px;
  }

  .user-profile .name {
    font-weight: bold;
    font-size: 16px;
  }

  .user-profile .email {
    font-size: 14px;
    color: #555;
  }
</style>

{#if userData}
  <div class="user-profile">
    <img src="{userData.picture}" alt="{userData.name}'s profile picture" />
    <div class="name">{userData.name}</div>
    <div class="email">{userData.email}</div>
  </div>
{/if}
