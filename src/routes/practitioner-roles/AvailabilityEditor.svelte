<script>
    import { onMount } from 'svelte';
    import { spring } from 'svelte/motion';
  
    let availabilityData = [];
    let jsonOutput = '';
    let table;
    let isDragging = false;
    let isResizing = false;
    let activeRect = null;
    let startPos = { x: 0, y: 0 };
    let offset = { x: 0, y: 0 };
  
    const daysOfWeek = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const hours = Array.from({ length: 15 }, (_, i) => i + 7); // 7AM to 9PM
  
    const cellWidth = 100;
    const cellHeight = 30;
  
    onMount(() => {
      updateJsonOutput();
    });
  
    function handleMouseDown(event, rect) {
      const { clientX, clientY } = event;
      const { x, y, width, height } = rect;
      
      startPos = { x: clientX, y: clientY };
      offset = { x: clientX - x, y: clientY - y };
      
      const clickY = clientY - table.getBoundingClientRect().top;
      const relativeY = clickY - y;
      
      if (relativeY < height * 0.2 || relativeY > height * 0.8) {
        isResizing = true;
      } else {
        isDragging = true;
      }
      
      activeRect = rect;
    }
  
    function handleMouseMove(event) {
      if (!isDragging && !isResizing) return;
      
      const { clientX, clientY } = event;
      const tableRect = table.getBoundingClientRect();
      const x = Math.max(0, Math.min(clientX - tableRect.left - offset.x, tableRect.width - cellWidth));
      const y = Math.max(0, Math.min(clientY - tableRect.top - offset.y, tableRect.height - cellHeight));
      
      const snappedX = Math.round(x / cellWidth) * cellWidth;
      const snappedY = Math.round(y / cellHeight) * cellHeight;
      
      if (isDragging) {
        activeRect.x = spring(snappedX);
        activeRect.y = spring(snappedY);
      } else if (isResizing) {
        const newHeight = Math.max(cellHeight, Math.abs(snappedY - activeRect.y));
        activeRect.height = spring(newHeight);
      }
      
      activeRect = activeRect;
      updateJsonOutput();
    }
  
    function handleMouseUp() {
      if (isDragging) {
        const collision = availabilityData.some(rect => 
          rect !== activeRect && 
          rect.x === activeRect.x && 
          Math.abs(rect.y - activeRect.y) < cellHeight
        );
        
        if (collision) {
          activeRect.x = spring(startPos.x - offset.x);
          activeRect.y = spring(startPos.y - offset.y);
        }
      }
      
      isDragging = false;
      isResizing = false;
      activeRect = null;
      updateJsonOutput();
    }
  
    function handleTableClick(event) {
      if (activeRect) return;
      
      const { clientX, clientY } = event;
      const tableRect = table.getBoundingClientRect();
      const x = clientX - tableRect.left;
      const y = clientY - tableRect.top;
      
      const snappedX = Math.floor(x / cellWidth) * cellWidth;
      const snappedY = Math.floor(y / cellHeight) * cellHeight;
      
      availabilityData = [
        ...availabilityData,
        {
          x: snappedX,
          y: snappedY,
          width: cellWidth,
          height: cellHeight,
        }
      ];
      
      updateJsonOutput();
    }
  
    function deleteRect(rect) {
      availabilityData = availabilityData.filter(r => r !== rect);
      updateJsonOutput();
    }
  
    function updateJsonOutput() {
      jsonOutput = JSON.stringify(
        availabilityData.map(rect => ({
          day: daysOfWeek[Math.floor(rect.x / cellWidth)],
          startTime: `${hours[Math.floor(rect.y / cellHeight)]}:00`,
          endTime: `${hours[Math.floor((rect.y + rect.height) / cellHeight)]}:00`,
        })),
        null,
        2
      );
    }
  </script>
  
  <div class="availability-editor">
    <div class="table-container"
         bind:this={table}
         on:mousedown={handleTableClick}
         on:mousemove={handleMouseMove}
         on:mouseup={handleMouseUp}
         on:mouseleave={handleMouseUp}>
      <table>
        <thead>
          <tr>
            <th></th>
            {#each daysOfWeek as day}
              <th>{day}</th>
            {/each}
          </tr>
        </thead>
        <tbody>
          {#each hours as hour}
            <tr>
              <td>{hour}:00</td>
              {#each daysOfWeek as day}
                <td></td>
              {/each}
            </tr>
          {/each}
        </tbody>
      </table>
      
      {#each availabilityData as rect}
        <div class="avail-time"
             style="left: {rect.x}px; top: {rect.y}px; width: {rect.width}px; height: {rect.height}px;"
             on:mousedown={(e) => handleMouseDown(e, rect)}>
          <div class="resize-handle top"></div>
          <div class="delete-button" on:click={() => deleteRect(rect)}>-</div>
          <div class="resize-handle bottom"></div>
        </div>
      {/each}
    </div>
    
    <div class="json-output">
      <h3>JSON Output:</h3>
      <pre>{jsonOutput}</pre>
    </div>
  </div>
  
  <style>
    .availability-editor {
      font-family: Arial, sans-serif;
    }
  
    .table-container {
      position: relative;
      overflow: hidden;
    }
  
    table {
      border-collapse: collapse;
    }
  
    th, td {
      border: 1px solid #ccc;
      width: 100px;
      height: 30px;
      text-align: center;
    }
  
    .avail-time {
      position: absolute;
      background-color: rgba(0, 123, 255, 0.5);
      border: 1px solid #0056b3;
    }
  
    .resize-handle {
      position: absolute;
      left: 0;
      right: 0;
      height: 20%;
      background-color: rgba(173, 216, 230, 0.5);
    }
  
    .resize-handle.top {
      top: 0;
      cursor: n-resize;
    }
  
    .resize-handle.bottom {
      bottom: 0;
      cursor: s-resize;
    }
  
    .delete-button {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      cursor: pointer;
    }
  
    .json-output {
      margin-top: 20px;
    }
  
    pre {
      background-color: #f4f4f4;
      padding: 10px;
      border-radius: 4px;
      overflow-x: auto;
    }
  </style>