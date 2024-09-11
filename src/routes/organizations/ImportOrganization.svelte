<script>
    function handleImport() {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = '.json';
      input.onchange = async (event) => {
        const file = event.target.files[0];
        if (file) {
          try {
            const content = await file.text();
            const organizationData = JSON.parse(content);
            // Here you would typically send this data to your backend
            console.log('Imported organization data:', organizationData);
            alert('Organization imported successfully');
          } catch (error) {
            console.error('Error importing organization:', error);
            alert('Error importing organization');
          }
        }
      };
      input.click();
    }
  </script>
  
  <div class="import-organization">
    <h2>Import Organization</h2>
    <button on:click={handleImport}>Import Organization</button>
  </div>
  
  <style>
    .import-organization {
      background-color: #f0f0f0;
      padding: 15px;
      border-radius: 5px;
      margin-top: 20px;
    }
  </style>