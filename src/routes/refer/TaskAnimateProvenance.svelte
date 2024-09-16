<script>
    let isAnimating = false; // Controls the animation state
  
    let provenanceRecords = [
      {
        versionId: '1',
        status: 'draft',
        recorded: '2023-09-10T10:00:00Z',
        agent: 'Practitioner/123',
        activity: 'create',
        reason: 'Initial workflow'
      },
      {
        versionId: '2',
        status: 'requested',
        recorded: '2023-09-11T10:30:00Z',
        agent: 'Practitioner/456',
        activity: 'update',
        reason: 'Workflow step 1'
      },
      {
        versionId: '3',
        status: 'accepted',
        recorded: '2023-09-12T14:00:00Z',
        agent: 'Practitioner/789',
        activity: 'update',
        reason: 'Workflow step 2'
      },
      {
        versionId: '4',
        status: 'in-progress',
        recorded: '2023-09-13T16:00:00Z',
        agent: 'Practitioner/123',
        activity: 'update',
        reason: 'Workflow step 3'
      },
      {
        versionId: '5',
        status: 'completed-or-failed',
        recorded: '2023-09-14T18:00:00Z',
        agent: 'Practitioner/456',
        activity: 'complete',
        reason: 'Final step'
      }
    ];
  
    let taskStates = [
      { code: 'draft', display: 'Draft (optional)', x: 50, y: 50, color: '#fff', zIndex: 0 },
      { code: 'requested', display: 'Requested', x: 50, y: 150, color: '#fff', zIndex: 0 },
      { code: 'accepted', display: 'Accepted', x: 50, y: 250, color: '#fff', zIndex: 0 },
      { code: 'rejected', display: 'Rejected', x: 200, y: 150, color: '#fff', zIndex: 0 },
      { code: 'canceled', display: 'Canceled', x: 200, y: 250, color: '#fff', zIndex: 0 },
      { code: 'in-progress', display: 'In Progress', x: 200, y: 350, color: '#fff', zIndex: 0 },
      { code: 'on-hold', display: 'On Hold', x: 50, y: 350, color: '#fff', zIndex: 0 },
      { code: 'completed-or-failed', display: 'Completed or Failed', x: 50, y: 450, color: '#fff', zIndex: 0 },
      { code: 'entered-in-error', display: 'Entered in Error', x: 400, y: 150, color: '#fff', zIndex: 0 }
    ];
  
    let currentProvenanceIndex = -1; // Current index of the provenance being displayed (-1 means none)
  
    // Function to highlight each state with animation
    async function animateProvenance() {
      if (isAnimating) return; // Prevent multiple triggers of the animation
      isAnimating = true;
  
      for (let i = 0; i < provenanceRecords.length; i++) {
        currentProvenanceIndex = i;
        highlightState(provenanceRecords[i].status);
  
        // Wait for 1 second before moving to the next state
        await new Promise(resolve => setTimeout(resolve, 1000));
  
        resetStateColors(); // Reset after highlighting
      }
  
      isAnimating = false;
    }
  
    // Function to highlight a task state by status code
    function highlightState(status) {
      const state = taskStates.find(s => s.code === status);
      if (state) {
        state.color = 'yellow'; // Animate to yellow
      }
    }
  
    // Function to reset all state colors to default
    function resetStateColors() {
      taskStates.forEach(state => state.color = '#fff');
    }
  
    // Bring the hovered state to the front
    function bringToFront(state) {
      taskStates.forEach(s => (s.zIndex = 0)); // Reset all zIndex values
      state.zIndex = 1; // Set the hovered state to a higher zIndex
    }
  </script>
  
  <!-- Diagram Container -->
  <div class="diagram-container">
    <!-- Task States with Provenance Animation -->
    {#each taskStates as state (state.code)}
      <div 
        class="state" 
        style="top: {state.y}px; left: {state.x}px; background-color: {state.color}; z-index: {state.zIndex};"
        on:mouseover={() => bringToFront(state)}
      >
        <strong>{state.display}</strong>
        {#if currentProvenanceIndex >= 0 && provenanceRecords[currentProvenanceIndex].status === state.code}
          <!-- Display Provenance details -->
          <div class="provenance-details">
            <p><strong>Agent:</strong> {provenanceRecords[currentProvenanceIndex].agent}</p>
            <p><strong>Time:</strong> {new Date(provenanceRecords[currentProvenanceIndex].recorded).toLocaleString()}</p>
            <p><strong>Activity:</strong> {provenanceRecords[currentProvenanceIndex].activity}</p>
            <p><strong>Reason:</strong> {provenanceRecords[currentProvenanceIndex].reason}</p>
          </div>
        {/if}
      </div>
    {/each}
  
    <!-- Animation Controls -->
    <div class="controls">
      <button on:click={animateProvenance} class="start-btn" disabled={isAnimating}>Start Animation</button>
    </div>
  </div>
  
  <style>
    .diagram-container {
      position: relative;
      width: 600px;
      height: 600px;
      margin: 20px 0;
    }
  
    .state {
      position: absolute;
      width: 180px;
      padding: 10px;
      border: 2px solid #000;
      border-radius: 5px;
      text-align: center;
      background-color: #fff;
      transition: background-color 0.5s ease-in-out, z-index 0s;
    }
  
    .provenance-details {
      margin-top: 10px;
      background-color: #f0f0f0;
      padding: 10px;
      border: 1px solid #ccc;
      font-size: 12px;
    }
  
    .controls {
      margin-top: 20px;
    }
  
    /* Button Styling */
    .start-btn {
      padding: 10px 20px;
      background-color: #007bff;
      color: white;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      transition: background-color 0.3s ease;
    }
  
    .start-btn:hover {
      background-color: #0056b3;
    }
  
    .start-btn:disabled {
      background-color: #cccccc;
      cursor: not-allowed;
    }
  </style>
  