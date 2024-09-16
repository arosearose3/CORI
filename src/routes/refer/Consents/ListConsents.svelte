<script>
    let consents = [
      { id: 1, patient: 'John Doe', status: 'Active', purpose: 'Treatment' },
      { id: 2, patient: 'Jane Smith', status: 'Revoked', purpose: 'Research' }
    ];
  </script>
  
  <div>
    <h2>List of Consents</h2>
    <ul>
      {#each consents as consent}
        <li>
          <strong>Patient:</strong> {consent.patient} | 
          <strong>Status:</strong> {consent.status} | 
          <strong>Purpose:</strong> {consent.purpose}
        </li>
      {/each}
    </ul>
  </div>
  
  <style>
    ul {
      list-style-type: none;
      padding: 0;
    }
    li {
      padding: 5px;
      border-bottom: 1px solid #ccc;
    }
  </style>
  