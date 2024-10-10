<script>
    import axios from 'axios';
    import { checkResults } from '$lib/stores';
    
    export let API_URL;
    
    async function performCheck() {
      try {
        const response = await axios.post(`${API_URL}/check`);
        checkResults.set(response.data);
      } catch (error) {
        console.error('Error performing check:', error);
      }
    }
    </script>
    
    <button on:click={performCheck}>Perform Exclusion Check</button>
    
    // src/routes/ResultsTable.svelte
    <script>
    import { checkResults } from '$lib/stores';
    </script>
    
    {#if $checkResults.length > 0}
      <table>
        <thead>
          <tr>
            <th>Name</th>
            <th>SAM Match</th>
            <th>OIG Match</th>
            <th>CO Match</th>
          </tr>
        </thead>
        <tbody>
          {#each $checkResults as result}
            <tr>
              <td>{result.name}</td>
              <td>{result.samMatch ? '❌' : '✅'}</td>
              <td>{result.oigMatch ? '❌' : '✅'}</td>
              <td>{result.coMatch ? '❌' : '✅'}</td>
            </tr>
          {/each}
        </tbody>
      </table>
    {:else}
      <p>No results to display</p>
    {/if}
    
    <style>
      table {
        width: 100%;
        border-collapse: collapse;
      }
      th, td {
        border: 1px solid #ddd;
        padding: 8px;
        text-align: left;
      }
      th {
        background-color: #f2f2f2;
      }
    </style>
    