<script>
  let isAnimating = false; // Controls the animation state

  let provenanceRecords = [
    { versionId: '1', status: 'draft', recorded: '2023-09-10T10:00:00Z', agent: 'Practitioner/123', activity: 'create', reason: 'Initial workflow' },
    { versionId: '2', status: 'requested', recorded: '2023-09-11T10:30:00Z', agent: 'Practitioner/456', activity: 'update', reason: 'Workflow step 1' },
    { versionId: '3', status: 'accepted', recorded: '2023-09-12T14:00:00Z', agent: 'Practitioner/789', activity: 'update', reason: 'Workflow step 2' },
    { versionId: '4', status: 'in-progress', recorded: '2023-09-13T16:00:00Z', agent: 'Practitioner/123', activity: 'update', reason: 'Workflow step 3' },
    { versionId: '5', status: 'completed-or-failed', recorded: '2023-09-14T18:00:00Z', agent: 'Practitioner/456', activity: 'complete', reason: 'Final step' }
  ];

  let stateTransitions = [
    { start: 'draft', end: 'requested' },
    { start: 'requested', end: 'rejected' },
    { start: 'requested', end: 'canceled' },
    { start: 'requested', end: 'accepted' },
    { start: 'accepted', end: 'completed-or-failed' },
    { start: 'accepted', end: 'canceled' },
    { start: 'accepted', end: 'in-progress' },
    { start: 'accepted', end: 'on-hold' },
    { start: 'on-hold', end: 'canceled' },
    { start: 'on-hold', end: 'completed-or-failed' },
    { start: 'in-progress', end: 'completed-or-failed' }
  ];

  let taskStates = [
    { code: 'draft', display: 'Draft', x: 20, y: 20, width: 180, height: 80, actor: 'Requester', color: '#fff', zIndex: 0 },
    { code: 'requested', display: 'Requested', x: 20, y: 150, width: 180, height: 80, actor: 'Requester', color: '#fff', zIndex: 0 },
    { code: 'accepted', display: 'Accepted', x: 300, y: 150, width: 180, height: 80, actor: 'Referral Target', color: '#fff', zIndex: 0 },
    { code: 'completed-or-failed', display: 'Completed or Failed', x: 500, y: 450, width: 180, height: 80, actor: 'Referral Target', color: '#fff', zIndex: 0 },
    { code: 'rejected', display: 'Rejected', x: 300, y: 20, width: 180, height: 80, actor: 'Requester', color: '#fff', zIndex: 0 },
    { code: 'canceled', display: 'Canceled', x: 20, y: 450, width: 180, height: 80, actor: 'Requester', color: '#fff', zIndex: 0 },
    { code: 'on-hold', display: 'On Hold', x: 280, y: 350, width: 180, height: 80, actor: 'Referral Target', color: '#fff', zIndex: 0 },
    { code: 'in-progress', display: 'In Progress', x: 550, y: 300, width: 180, height: 80, actor: 'Referral Target', color: '#fff', zIndex: 0 },
    { code: 'entered-in-error', display: 'Entered in Error', x: 550, y: 20, width: 180, height: 80, actor: 'Requester', color: '#fff', zIndex: 0 }
  ];

    // Calculate highlighted transitions based on provenanceRecords
  let highlightedTransitions = provenanceRecords.map((record, index) => {
    if (index < provenanceRecords.length - 1) {
      return {
        start: record.status,
        end: provenanceRecords[index + 1].status
      };
    }
    return null;
  }).filter(transition => transition !== null);


 // Mouseover state for displaying provenance details
  let hoveredProvenance = null;



  if (typeof document !== 'undefined') {
  // All DOM manipulation code goes inside this block
  const slider = document.getElementById('timeSlider');
  const circle = document.querySelector('.blue-circle');
  
  slider.addEventListener('input', function() {
    const percent = slider.value;
    const circlePosition = percent * 3; // 300px width slider, so 3px per percent
    circle.style.left = `${circlePosition - 10}px`; // Adjust for circle's width (10px offset)
  });
}
    // Get the time range (begin and end times)
    const beginTime = new Date(provenanceRecords[0].recorded).getTime();
  const endTime = new Date(provenanceRecords[provenanceRecords.length - 1].recorded).getTime();

  // Function to interpolate the position on the slider based on time
  function getProvenanceDetailsByTime(percent) {
    const currentTime = beginTime + (percent / 100) * (endTime - beginTime);
    const record = provenanceRecords.find(r => new Date(r.recorded).getTime() >= currentTime);
    return record ? record : provenanceRecords[provenanceRecords.length - 1];
  }

  // Handle slider movement and display provenance details
  function updateProvenanceDetails(event) {
    const sliderValue = event.target.value;
    const percent = parseFloat(sliderValue);
    
    const record = getProvenanceDetailsByTime(percent);
    document.getElementById('provenance-details').innerHTML = `
      <p><strong>Status:</strong> ${record.status}</p>
      <p><strong>Agent:</strong> ${record.agent}</p>
      <p><strong>Time:</strong> ${new Date(record.recorded).toLocaleString()}</p>
      <p><strong>Activity:</strong> ${record.activity}</p>
      <p><strong>Reason:</strong> ${record.reason}</p>
    `;
  }
  // Function to calculate the center position of each state rectangle
  function getCenterPosition(state) {
    return {
      cx: state.x + state.width / 2,
      cy: state.y + state.height / 2
    };
  }

  function calculateDistance(x1, y1, x2, y2) {
    return Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
  }

  function generateArrowSegments(startState, endState, segmentLength = 30) {
    const x1 = getCenterPosition(startState).cx;
    const y1 = getCenterPosition(startState).cy;
    const x2 = getCenterPosition(endState).cx;
    const y2 = getCenterPosition(endState).cy;

    const distance = calculateDistance(x1, y1, x2, y2);
    const steps = Math.floor(distance / segmentLength);
    const arrows = [];

    for (let i = 1; i <= steps; i++) {
      const t = i / steps;
      const xStart = x1 + t * (x2 - x1);
      const yStart = y1 + t * (y2 - y1);
      const xEnd = xStart + (segmentLength / distance) * (x2 - x1);
      const yEnd = yStart + (segmentLength / distance) * (y2 - y1);

      arrows.push({ x1: xStart, y1: yStart, x2: xEnd, y2: yEnd });
    }

    return arrows;
  }


  function findState(code) {
    return taskStates.find(state => state.code === code);
  }

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

    function showProvenanceDetails(stateCode) {
    hoveredProvenance = provenanceRecords.find(record => record.status === stateCode) || null;
  }

  function hideProvenanceDetails() {
    hoveredProvenance = null;
  }
</script>

<!-- Diagram Container with Arrows and States -->
<div class="controls">
  <button on:click={animateProvenance} class="start-btn" disabled={isAnimating}>Start Animation</button>
</div>

<div class="slider-container">
  <input type="range" min="0" max="100" value="0" class="slider" id="timeSlider" oninput="updateProvenanceDetails(event)">
  <div class="blue-circle"></div>
</div>

<!-- Provenance Details Display -->
<div id="provenance-details" class="provenance-details">
  <!-- Provenance details will be updated here based on slider movement -->
</div>

<div class="diagram-container">
  <svg width="800" height="600">
    <defs>
      <marker id="arrowhead" markerWidth="5" markerHeight="5" refX="0" refY="2.5" orient="auto">
        <polygon points="0 0, 5 2.5, 0 5" fill="black"/>
      </marker>
    </defs>

    {#each stateTransitions as transition}
      {#if findState(transition.start) && findState(transition.end)}
        {#each generateArrowSegments(findState(transition.start), findState(transition.end)) as segment}
          <!-- Check if this transition is part of highlightedTransitions -->
          {#if highlightedTransitions.find(h => h.start === transition.start && h.end === transition.end)}
            <line 
              x1={segment.x1} 
              y1={segment.y1} 
              x2={segment.x2} 
              y2={segment.y2} 
              stroke="black" 
              stroke-width="6"  
              marker-end="url(#arrowhead)" 
            />
          {:else}
            <line 
              x1={segment.x1} 
              y1={segment.y1} 
              x2={segment.x2} 
              y2={segment.y2} 
              stroke="black" 
              stroke-width="2" 
              marker-end="url(#arrowhead)" 
            />
          {/if}
        {/each}
      {/if}
    {/each}
  </svg>

  <!-- Task States with Provenance Animation -->
  {#each taskStates as state (state.code)}
    <div 
      class="state" 
      style="top: {state.y}px; left: {state.x}px; background-color: {state.color}; z-index: {state.zIndex}; width: {state.width}px; height: {state.height}px;"
      on:mouseover={() => showProvenanceDetails(state.code)}
      on:mouseout={hideProvenanceDetails}
    >
      <strong>{state.display}</strong>
      <p>Actor: {state.actor}</p>
    </div>
  {/each}
</div>

<!-- Provenance Details Hover Display -->
{#if hoveredProvenance}
  <div class="provenance-details" style="position: absolute; top: {hoveredProvenance.y - 80}px; left: {hoveredProvenance.x}px; padding: 10px; border: 1px solid black; background-color: #f9f9f9;">
    <p><strong>Status:</strong> {hoveredProvenance.status}</p>
    <p><strong>Agent:</strong> {hoveredProvenance.agent}</p>
    <p><strong>Recorded:</strong> {new Date(hoveredProvenance.recorded).toLocaleString()}</p>
    <p><strong>Activity:</strong> {hoveredProvenance.activity}</p>
    <p><strong>Reason:</strong> {hoveredProvenance.reason}</p>
  </div>
{/if}

<style>
    .slider-container {
    position: relative;
    width: 300px;
    margin: 20px 0;
  }

  .slider {
    width: 100%;
  }

  .blue-circle {
    position: absolute;
    top: -10px;
    left: 0;
    width: 20px;
    height: 20px;
    background-color: blue;
    border-radius: 50%;
    pointer-events: none;
  }

  .provenance-details {
    margin-top: 10px;
    background-color: #f0f0f0;
    padding: 10px;
    border: 1px solid #ccc;
    font-size: 12px;
    z-index: 999;
  }
.diagram-container {
  position: relative;
  width: 800px;
  height: 600px;
  margin: 20px 0;
}

  .state {
    position: absolute;
    padding: 10px;
    border: 2px solid #000;
    border-radius: 5px;
    text-align: center;
    background-color: #fff;
    transition: background-color 0.5s ease-in-out, z-index 0s;
  }

  .controls {
    margin-top: 20px;
  }

.provenance-details {
  margin-top: 10px;
  background-color: #f0f0f0;
  padding: 10px;
  border: 1px solid #ccc;
  font-size: 12px;
  z-index: 999;
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

/* Arrow styling */
line {

  marker-end: url(#arrowhead);
}
</style>
