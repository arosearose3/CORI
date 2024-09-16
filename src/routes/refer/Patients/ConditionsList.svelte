<script>
    export let currentPatientId;
  
    let conditions = [
      { id: 1, condition: 'Diabetes', status: 'Active' },
      { id: 2, condition: 'Hypertension', status: 'Inactive' }
    ];
  </script>
  
  <div>
    <h3>Conditions for {selectedPatient.name}</h3>
    <ul>
      {#each conditions as condition}
        <li>{condition.condition} - {condition.status}</li>
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
  