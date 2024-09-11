<script>
  import { writable } from 'svelte/store';

  let availabilities = writable([]);
  let startPosition = null;
  let dragging = false;
  let resizing = false;
  let currentRect = null;
  let initialSize = null;

  const gridStartHour = 7;  // 7 AM
  const gridEndHour = 21;   // 9 PM
  const gridHours = gridEndHour - gridStartHour;
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const gridSnapHeight = 60; // One row per hour (height for each row)

  const times = Array.from({ length: gridHours }, (_, i) => {
    const hour = gridStartHour + i;
    return {
      display: `${(hour % 12 || 12)} ${hour >= 12 ? 'PM' : 'AM'}`,
      hour
    };
  });

  function isOverlapping(rect1, rect2) {
    return rect1.day === rect2.day && !(rect1.end <= rect2.start || rect1.start >= rect2.end);
  }

  function checkOverlap(current) {
    let overlaps = false;
    availabilities.update(avails => {
      overlaps = avails.some(avail => avail !== currentRect && isOverlapping(avail, current));
      return avails;
    });
    return overlaps;
  }

  function snapToGrid(position) {
    const hour = gridStartHour + Math.floor(position / gridSnapHeight);
    return Math.max(gridStartHour, Math.min(gridEndHour - 1, hour));
  }

  function handleMouseDown(event, rect) {
    if (event.target.classList.contains('resize')) {
      resizing = true;
      initialSize = { ...rect };
    } else {
      dragging = true;
      startPosition = { x: event.clientX, y: event.clientY };
      currentRect = { ...rect };
    }
  }

  function handleMouseMove(event) {
    if (dragging && currentRect) {
      const deltaY = event.clientY - startPosition.y;
      const newStart = snapToGrid(currentRect.start + deltaY / gridSnapHeight);
      const newEnd = newStart + (currentRect.end - currentRect.start);

      currentRect = { ...currentRect, start: newStart, end: newEnd };
    }

    if (resizing && currentRect) {
      const deltaY = event.clientY - startPosition.y;
      const newEnd = snapToGrid(initialSize.end + deltaY / gridSnapHeight);
      currentRect = { ...currentRect, end: newEnd };
    }
  }

  function handleMouseUp() {
    if (dragging || resizing) {
      if (checkOverlap(currentRect)) {
        currentRect = null;
      } else {
        availabilities.update(avails => avails.map(a => (a === currentRect ? { ...currentRect } : a)));
      }

      dragging = false;
      resizing = false;
      currentRect = null;
    }
  }

  function handleTableClick(event, day) {
    const yPosition = event.offsetY;
    const startHour = snapToGrid(yPosition);
    
    availabilities.update(avails => {
      const rectExists = avails.some(avail => avail.day === day && avail.start <= startHour && avail.end > startHour);
      if (!rectExists) {
        return [...avails, { day, start: startHour, end: startHour + 1 }];
      }
      return avails;
    });
  }

  function deleteAvailability(rect) {
    availabilities.update(avails => avails.filter(avail => avail !== rect));
  }

  // Output the JSON whenever the availabilities array changes
  $: jsonOutput = JSON.stringify($availabilities);
</script>

<style>
  .grid { display: grid; grid-template-columns: 60px repeat(7, 1fr); grid-gap: 1px; }
  .header { background: #ddd; text-align: center; font-weight: bold; padding: 10px; }
  .column { display: flex; flex-direction: column; background: #f0f0f0; position: relative; }
  .time-slot { height: 60px; border-bottom: 1px solid #ccc; position: relative; }
  .avail-rect {
    position: absolute;
    background: lightgray;
    border: 1px solid black;
    display: flex;
    justify-content: center;
    align-items: center;
    cursor: pointer;
  }
  .resize {
    width: 100%;
    height: 20%;
    background: lightblue;
    cursor: ns-resize;
  }
  .delete {
    cursor: pointer;
    font-size: 16px;
    color: red;
  }
</style>

<!-- Accessibility Enhanced Grid -->
 <div> v1.2</div> 
<div class="grid" 
  role="application" 
  tabindex="0" 
  on:mousemove={handleMouseMove} 
  on:mouseup={handleMouseUp}>

  <!-- Header row -->
  <div class="header"></div>
  {#each days as day}
    <div class="header">{day}</div>
  {/each}

  <!-- Time slots and availability rectangles -->
  {#each times as time}
    <div class="header">{time.display}</div>
    {#each days as day}
      <div 
        class="column" 
        role="button" 
        tabindex="0" 
        on:click={(e) => handleTableClick(e, day)} 
        on:keydown={(e) => (e.key === 'Enter' || e.key === ' ') && handleTableClick(e, day)}>
        <!-- Only one row per hour, no unnecessary nested rows -->
        <div class="time-slot"></div>
        
        <!-- Render rectangles that belong to this day and time slot -->
        {#each $availabilities.filter(avail => avail.day === day && avail.start === time.hour) as avail}
          <div
            class="avail-rect"
            role="button"
            tabindex="0"
            aria-label="Availability block"
            on:mousedown={(e) => handleMouseDown(e, avail)}
            on:keydown={(e) => (e.key === 'Enter' || e.key === ' ') && handleMouseDown(e, avail)}
            style="top: 0px; height: {gridSnapHeight}px">
            <div class="resize"></div>
            <button class="delete" on:click={() => deleteAvailability(avail)} aria-label="Delete availability">−</button>
            <div class="resize"></div>
          </div>
        {/each}
      </div>
    {/each}
  {/each}
</div>

<!-- JSON output of the availabilities array -->
<textarea readonly bind:value={jsonOutput} style="width: 100%; height: 200px;"></textarea>
