<script>
    let notifications = [
      { id: 1, message: "Referral #123 updated", read: false },
      { id: 2, message: "Referral #124 completed", read: false },
    ];
    let unreadCount = notifications.filter(n => !n.read).length;
    let showNotifications = false;
  
    function toggleNotifications() {
      showNotifications = !showNotifications;
    }
  
    function markAsRead(id) {
      const notification = notifications.find(n => n.id === id);
      if (notification) {
        notification.read = true;
        unreadCount--;
      }
    }
  </script>
  
  <div class="notification-bell">
    <button on:click={toggleNotifications}>
      🔔 {unreadCount > 0 ? `(${unreadCount})` : ''}
    </button>
    {#if showNotifications}
      <div class="notifications">
        {#each notifications as notification}
          <div class="notification" class:read={notification.read}>
            <p>{notification.message}</p>
            {#if !notification.read}
              <button on:click={() => markAsRead(notification.id)}>Mark as read</button>
            {/if}
          </div>
        {/each}
      </div>
    {/if}
  </div>
  
  <style>
    .notification-bell {
      position: relative;
      display: inline-block;
    }
    .notifications {
      position: absolute;
      top: 2rem;
      right: 0;
      background: white;
      border: 1px solid #ddd;
      width: 250px;
      max-height: 300px;
      overflow-y: auto;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    }
    .notification {
      padding: 1rem;
      border-bottom: 1px solid #ddd;
    }
    .notification.read {
      background: #f0f0f0;
    }
  </style>
  