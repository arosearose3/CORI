<script>
    // Data for task states with approximate x, y coordinates
    let taskStates = [
      { code: 'draft', display: 'Draft (optional)', x: 50, y: 50 },
      { code: 'requested', display: 'Requested', x: 50, y: 150 },
      { code: 'accepted', display: 'Accepted', x: 50, y: 250 },
      { code: 'rejected', display: 'Rejected', x: 200, y: 150 },
      { code: 'canceled', display: 'Canceled', x: 200, y: 250 },
      { code: 'in-progress', display: 'In Progress', x: 200, y: 350 },
      { code: 'on-hold', display: 'On Hold', x: 50, y: 350 },
      { code: 'completed-or-failed', display: 'Completed or Failed', x: 50, y: 450 },
      { code: 'entered-in-error', display: 'Entered in Error', x: 400, y: 150 }
    ];
  
    let selectedState = 'draft'; // Default selected state
  
    // Arrow connections between nodes (from, to)
    let arrows = [
      { from: 'draft', to: 'requested' },
      { from: 'requested', to: 'rejected' },
      { from: 'requested', to: 'accepted' },
      { from: 'requested', to: 'canceled' },
      { from: 'accepted', to: 'in-progress' },
      { from: 'accepted', to: 'on-hold' },
      { from: 'accepted', to: 'canceled' },
      { from: 'accepted', to: 'completed-or-failed' },
      { from: 'canceled', to: 'completed-or-failed' },
      { from: 'canceled', to: 'accepted' },
      { from: 'in-progress', to: 'completed-or-failed' },
      { from: 'in-progress', to: 'on-hold' },
      { from: 'on-hold', to: 'in-progress' },
      { from: 'on-hold', to: 'canceled' }
    ];
  
    function selectState(event) {
      selectedState = event.target.value;
    }
  
    // Function to determine if the given state should be highlighted
    function isHighlighted(stateCode) {
      return selectedState === stateCode;
    }
  
    // Function to get the coordinates of a state by code
    function getStateCoords(stateCode) {
      const state = taskStates.find(s => s.code === stateCode);
      return state ? { x: state.x, y: state.y } : { x: 0, y: 0 };
    }
  </script>
  
  <!-- Diagram Container -->
  <div class="diagram-container">
    <!-- SVG Arrows -->
    <svg class="arrows" xmlns="http://www.w3.org/2000/svg" width="500" height="500">
      {#each arrows as arrow (arrow.from + '-' + arrow.to)}
        <!-- Calculate coordinates using getStateCoords function -->
        <line 
          x1="{getStateCoords(arrow.from).x + 75}" 
          y1="{getStateCoords(arrow.from).y + 25}" 
          x2="{getStateCoords(arrow.to).x + 75}" 
          y2="{getStateCoords(arrow.to).y + 25}" 
          marker-end="url(#arrowhead)"
        />
      {/each}
  
      <!-- Arrow marker -->
      <defs>
        <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="0" refY="3.5" orient="auto">
          <polygon points="0 0, 10 3.5, 0 7" fill="black" />
        </marker>
      </defs>
    </svg>
  
    <!-- Task States -->
    {#each taskStates as state}
      <div 
        class="state" 
        class:selected={isHighlighted(state.code)} 
        style="top: {state.y}px; left: {state.x}px"
      >
        {state.display}
      </div>
    {/each}
  </div>
  
  <!-- Dropdown for selecting task states -->
  <label for="taskState">Select a task state: </label>
  <select id="taskState" on:change={selectState}>
    {#each taskStates as task}
      <option value={task.code}>{task.display}</option>
    {/each}
  </select>
  
  <style>
    .diagram-container {
      position: relative;
      width: 500px;
      height: 500px;
      margin: 20px 0;
    }
  
    .arrows {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
    }
  
    .state {
      position: absolute;
      width: 150px;
      padding: 10px;
      border: 2px solid #000;
      background-color: #e0e0e0;
      border-radius: 5px;
      text-align: center;
    }
  
    .state.selected {
      background-color: #007bff;
      color: white;
      font-weight: bold;
    }
  
    label {
      margin-right: 10px;
    }
  
    select {
      padding: 5px;
      border-radius: 5px;
    }
  
    line {
      stroke: black;
      stroke-width: 2;
    }
  </style>
  