<script>
    import { onMount, createEventDispatcher } from 'svelte';
  
    let practitioners = [];
    let isLoading = true;
    let error = null;
    let selectedPractitioner = null;
  
    const dispatch = createEventDispatcher();
  
    // Fetch practitioners on mount
    onMount(fetchPractitioners);
  
    async function fetchPractitioners() {
      try {
        const response = await fetch('/avail/api/practitioner/all');
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
  
        const data = await response.json();
        practitioners = processPractitionerBundle(data).sort((a, b) =>
          formatName(a.name).localeCompare(formatName(b.name))
        );
      } catch (e) {
        error = e.message;
      } finally {
        isLoading = false;
      }
    }
  
    // Process FHIR Practitioner bundle
    function processPractitionerBundle(bundle) {
      if (!bundle || !bundle.entry || !Array.isArray(bundle.entry)) {
        return [];
      }
  
      return bundle.entry
        .map((entry) => {
          const resource = entry.resource;
          if (resource && resource.resourceType === 'Practitioner') {
            return {
              id: resource.id || '',
              name: resource.name || [],
            };
          }
          return null;
        })
        .filter((practitioner) => practitioner !== null);
    }
  
    // Format the practitioner's name
    function formatName(name) {
      if (!name || !name.length) return 'N/A';
      const { given, family } = name[0];
      return `${given ? given.join(' ') : ''} ${family || ''}`.trim();
    }
  
    // Dispatch the selected practitioner's ID and name when a radio button is clicked
    function selectPractitioner(practitioner) {
      selectedPractitioner = practitioner;
      const practitionerName = formatName(practitioner.name);
      dispatch('practitionerSelected', { id: practitioner.id, name: practitionerName });
    }
  </script>
  
  <div class="pick-practitioner">
    <h2>Pick Practitioner</h2>
  
    {#if isLoading}
      <p>Loading practitioners...</p>
    {:else if error}
      <p class="error">Error: {error}</p>
    {:else if practitioners.length === 0}
      <p>No practitioners found.</p>
    {:else}
      <table>
        <thead>
          <tr>
            <th>Select</th>
            <th>Name</th>
          </tr>
        </thead>
        <tbody>
          {#each practitioners as practitioner}
            <tr>
              <td>
                <input 
                  type="radio" 
                  name="practitionerSelection" 
                  value={practitioner.id} 
                  on:change={() => selectPractitioner(practitioner)}
                  checked={selectedPractitioner && selectedPractitioner.id === practitioner.id}
                />
              </td>
              <td>{formatName(practitioner.name)}</td>
            </tr>
          {/each}
        </tbody>
      </table>
    {/if}
  </div>
  
  <style>
    .pick-practitioner {
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
    }
  
    table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 20px;
    }
  
    th, td {
      border: 1px solid #ddd;
      padding: 8px;
      text-align: left;
    }
  
    th {
      background-color: #f2f2f2;
      font-weight: bold;
    }
  
    tr:nth-child(even) {
      background-color: #f9f9f9;
    }
  
    .error {
      color: red;
    }
  
    input[type="radio"] {
      margin-right: 10px;
    }
  </style>
  