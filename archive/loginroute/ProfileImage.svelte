<script>
    export let src;
    export let alt = "Profile picture";
    let loaded = false;
    let error = false;
    const URLprefix = '/avail';
  
    $: proxiedSrc = src ? `${URLprefix}/auth/proxy-image?url=${encodeURIComponent(src)}` : null;
  
    function handleLoad() {
      loaded = true;
      console.log('Image loaded successfully');
    }
  
    function handleError() {
      error = true;
      console.error('Failed to load image:', proxiedSrc);
    }
  </script>
  
  <div class="image-container">
    {#if proxiedSrc}
      {#if !loaded && !error}
        <div class="placeholder">Loading...</div>
      {/if}
      <img
        src={proxiedSrc}
        {alt}
        class:hidden={!loaded || error}
        on:load={handleLoad}
        on:error={handleError}
      />
      {#if error}
        <div class="fallback">
          {alt[0].toUpperCase()}
        </div>
      {/if}
    {:else}
      <div class="fallback">
        {alt[0].toUpperCase()}
      </div>
    {/if}
  </div>
  
  
  
  <style>
    .image-container {
      width: 60px;
      height: 60px;
      border-radius: 50%;
      overflow: hidden;
      position: relative;
    }
    img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
    .hidden {
      display: none;
    }
    .placeholder, .fallback {
      width: 100%;
      height: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
      background-color: #ccc;
      color: #fff;
      font-size: 2rem;
      font-weight: bold;
    }
  </style>