<script>
    import { onMount } from 'svelte';
  
    let practitioners = [];
    let isLoading = true;
    let error = null;
    let sortColumn = 'name';
    let sortAscending = true;
  
    onMount(fetchPractitioners);
  
    async function fetchPractitioners() {
      try {
        const response = await fetch('/avail/api/allPractitioners');
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        practitioners = await response.json();
        sortPractitioners();
      } catch (e) {
        error = e.message;
      } finally {
        isLoading = false;
      }
    }
  
    async function deletePractitioner(id) {
      if (confirm('Are you sure you want to delete this practitioner?')) {
        try {
          const response = await fetch(`/avail/api/deletePractitioner/${id}`, {
            method: 'DELETE'
          });
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }
          await fetchPractitioners(); // Refresh the list after deletion
        } catch (e) {
          error = `Failed to delete practitioner: ${e.message}`;
        }
      }
    }
  
    function formatName(name) {
      if (!name || !name.length) return 'N/A';
      const { given, family } = name[0];
      return `${given ? given.join(' ') : ''} ${family || ''}`.trim();
    }
  
    function formatTelecom(telecom) {
      if (!telecom || !telecom.length) return 'N/A';
      const email = telecom.find(t => t.system === 'email');
      return email ? email.value : 'N/A';
    }
  
    function sortPractitioners() {
      practitioners = practitioners.sort((a, b) => {
        let valueA, valueB;
        switch (sortColumn) {
          case 'name':
            valueA = formatName(a.name);
            valueB = formatName(b.name);
            break;
          case 'email':
            valueA = formatTelecom(a.telecom);
            valueB = formatTelecom(b.telecom);
            break;
          case 'gender':
            valueA = a.gender || '';
            valueB = b.gender || '';
            break;
          case 'birthDate':
            valueA = a.birthDate || '';
            valueB = b.birthDate || '';
            break;
        }
        return sortAscending 
          ? valueA.localeCompare(valueB) 
          : valueB.localeCompare(valueA);
      });
    }
  
    function handleSort(column) {
      if (sortColumn === column) {
        sortAscending = !sortAscending;
      } else {
        sortColumn = column;
        sortAscending = true;
      }
      sortPractitioners();
    }
  </script>
  
  <div class="all-practitioners">
    <h2>All Practitioners</h2>
  
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
            <th></th>
            <th on:click={() => handleSort('name')}>
              Name {sortColumn === 'name' ? (sortAscending ? '▲' : '▼') : ''}
            </th>
            <th on:click={() => handleSort('email')}>
              Email {sortColumn === 'email' ? (sortAscending ? '▲' : '▼') : ''}
            </th>
            <th on:click={() => handleSort('gender')}>
              Gender {sortColumn === 'gender' ? (sortAscending ? '▲' : '▼') : ''}
            </th>
            <th on:click={() => handleSort('birthDate')}>
              Birth Date {sortColumn === 'birthDate' ? (sortAscending ? '▲' : '▼') : ''}
            </th>
          </tr>
        </thead>
        <tbody>
          {#each practitioners as practitioner}
            <tr>
              <td>
                <button on:click={() => deletePractitioner(practitioner.id)} class="delete-btn" aria-label="Delete practitioner">
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <polyline points="3 6 5 6 21 6"></polyline>
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                    <line x1="10" y1="11" x2="10" y2="17"></line>
                    <line x1="14" y1="11" x2="14" y2="17"></line>
                  </svg>
                </button>
              </td>
              <td>{formatName(practitioner.name)}</td>
              <td>              {#if formatTelecom(practitioner.telecom) !== 'N/A'}
                <a href="https://elig.pro/avail/update-schedule?id={practitioner.id}" class="email-link">
                  {formatTelecom(practitioner.telecom)}
                </a>
              {:else}
                N/A
              {/if}</td>
              <td>{practitioner.gender || 'N/A'}</td>
              <td>{practitioner.birthDate || 'N/A'}</td>
            </tr>
          {/each}
        </tbody>
      </table>
    {/if}
  </div>
  
  <style>
    .all-practitioners {
      max-width: 800px;
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
      cursor: pointer;
    }
  
    th:hover {
      background-color: #e6e6e6;
    }
  
    tr:nth-child(even) {
      background-color: #f9f9f9;
    }
  
    .error {
      color: red;
    }
  
    .delete-btn {
      background: none;
      border: none;
      cursor: pointer;
      color: #ff4136;
      padding: 0;
    }
  
    .delete-btn:hover {
      color: #ff1a1a;
    }
  </style>