<script>
    import { onMount } from 'svelte';
    import { user } from '$lib/stores.js'; // Assuming organizationId is stored in stores.js
    import { base } from '$app/paths'; // Import base path
  
    let sortColumn = 'name';
    let sortDirection = 'asc';
    let message = '';
  
    let organizationId;
    let practitioners = [];
    let errorMessage = '';
  
    // Access the organizationId from the practitioner object in the user store
    $: organizationId = $user?.practitioner?.organizationId;
  
    // Fetch practitioner roles by organization on component mount
    onMount(async () => {
      try {
        await loadPractitioners();
      } catch (error) {
        console.error('Error loading practitioners:', error);
        message = 'An unexpected error occurred while loading practitioners.';
      }
    });
  
    /**
     * Fetches PractitionerRole resources for the organization and processes them.
     */
    async function loadPractitioners() {
      try {
        if (!organizationId) {
          throw new Error('Organization ID is not available');
        }
  
        const response = await fetch(`${base}/api/role/withOrganization?organizationId=${organizationId}`);
        const data = await response.json();
  
        // Validate the bundle structure
        if (data.resourceType === 'Bundle' && Array.isArray(data.entry)) {
          const practitionerRoles = data.entry.map(entry => entry.resource);
  
          // Initialize a new array to store the combined data
          const loadedPractitioners = [];
  
          // Fetch practitioner details in parallel
          await Promise.all(practitionerRoles.map(async (role) => {
            const practitionerId = role.practitioner?.reference?.split('/')[1]; // Extract Practitioner ID
            if (!practitionerId) return;
  
            const practitionerData = await fetchPractitionerDetails(practitionerId);
            const capacity = getCapacity(role.extension);
            const availableTimes = role.availableTime || []; // Extract availableTime
  
            // Combine all relevant data into a single object
            loadedPractitioners.push({
              id: practitionerId,
              name: practitionerData.name,
              birthDate: practitionerData.birthDate,
              ...capacity, // Spread capacity fields
              availableTimes: availableTimes, // Include availableTimes
            });
          }));
  
          // Assign the newly loaded practitioners to the reactive variable
          practitioners = loadedPractitioners;
        } else {
          message = 'Invalid FHIR PractitionerRole bundle format.';
        }
      } catch (error) {
        console.error('Error fetching practitioners:', error);
        message = 'Failed to fetch practitioners. Please try again.';
      }
    }
  
    /**
     * Fetches details of a practitioner by their ID.
     * @param {string} practitionerId - The ID of the practitioner.
     * @returns {Object} - An object containing the practitioner's name and birthDate.
     */
    async function fetchPractitionerDetails(practitionerId) {
      try {
        const response = await fetch(`${base}/api/practitioner/${practitionerId}`);
        const data = await response.json();
  
        if (data.resourceType === 'Bundle' && Array.isArray(data.entry) && data.entry.length > 0) {
          const practitioner = data.entry[0].resource; // Access the practitioner resource
  
          // **Corrected Name Construction: Given Names First, Then Family Name**
          const givenNames = practitioner.name?.[0]?.given?.join(' ') || '';
          const familyName = practitioner.name?.[0]?.family || 'Unknown';
          const fullName = `${givenNames} ${familyName}`.trim();
  
          return {
            name: fullName,
            birthDate: practitioner.birthDate || 'Unknown',
          };
        } else {
          console.error('Invalid Practitioner resource format.');
          return { name: 'Unknown', birthDate: 'Unknown' };
        }
      } catch (error) {
        console.error(`Error fetching practitioner details for ID ${practitionerId}:`, error);
        return { name: 'Unknown', birthDate: 'Unknown' };
      }
    }
  
    /**
     * Extracts capacity information from PractitionerRole extensions.
     * @param {Array} extensions - The extensions array from PractitionerRole.
     * @returns {Object} - An object containing capacity fields.
     */
    function getCapacity(extensions) {
      const capacityExtension = extensions?.find(ext => ext.url === 'https://combinebh.org/resources/FHIRResources/PractitionerCapacityFHIRExtension.html');
      if (!capacityExtension) {
        return {
          kids: 0,
          teens: 0,
          adults: 0,
          couples: 0,
          families: 0,
        };
      }
  
      // Extract the specific capacities
      const capacityData = capacityExtension.extension.reduce((acc, ext) => {
        acc[ext.url] = ext.valueInteger || 0;
        return acc;
      }, {});
  
      return {
        kids: capacityData.children || 0,
        teens: capacityData.teens || 0,
        adults: capacityData.adults || 0,
        couples: capacityData.couples || 0,
        families: capacityData.families || 0,
      };
    }
  
    /**
     * Handles the deletion of a practitioner (currently a stub).
     * @param {string} id - The ID of the practitioner to delete.
     */
    function handleDelete(id) {
      alert(`Delete practitioner with ID: ${id}`);
      // TODO: Implement actual delete functionality
    }
  
    /**
     * Sorts the practitioners array based on the specified column.
     * @param {string} column - The column to sort by.
     */
    function sortTable(column) {
      if (sortColumn === column) {
        // Toggle sort direction if the same column is clicked
        sortDirection = sortDirection === 'asc' ? 'desc' : 'asc';
      } else {
        sortColumn = column;
        sortDirection = 'asc'; // Reset to ascending order on new column
      }
  
      practitioners = [...practitioners].sort((a, b) => {
        if (a[sortColumn] < b[sortColumn]) return sortDirection === 'asc' ? -1 : 1;
        if (a[sortColumn] > b[sortColumn]) return sortDirection === 'asc' ? 1 : -1;
        return 0;
      });
    }
  
    /**
     * Converts three-letter day codes to full day names.
     * @param {string} dayCode - The three-letter day code (e.g., 'mon').
     * @returns {string} - The full name of the day (e.g., 'Monday').
     */
    function convertDayCode(dayCode) {
      const dayMap = {
        mon: 'Monday',
        tue: 'Tuesday',
        wed: 'Wednesday',
        thu: 'Thursday',
        fri: 'Friday',
        sat: 'Saturday',
        sun: 'Sunday',
      };
      return dayMap[dayCode.toLowerCase()] || dayCode;
    }
  
    /**
     * Formats a time string from "HH:MM:SS" to "hAM/PM" format.
     * @param {string} timeStr - The time string in "HH:MM:SS" format.
     * @returns {string} - The formatted time string in "hAM/PM" format.
     */
    function formatTime(timeStr) {
      const [hour, minute, second] = timeStr.split(':').map(Number);
      let period = 'am';
      let hour12 = hour;
  
      if (hour === 0) {
        hour12 = 12;
        period = 'am';
      } else if (hour === 12) {
        period = 'pm';
      } else if (hour > 12) {
        hour12 = hour - 12;
        period = 'pm';
      }
  
      // Optionally, include minutes if they are not zero
      if (minute !== 0) {
        return `${hour12}:${minute.toString().padStart(2, '0')}${period}`;
      }
  
      return `${hour12}${period}`;
    }
  
    /**
     * Formats the available times for display.
     * @param {Array} availableTimes - The availableTime array from PractitionerRole.
     * @returns {Array} - An array of formatted strings representing availability.
     */
    function getFormattedAvailableTimes(availableTimes) {
      if (!availableTimes || availableTimes.length === 0) return [];
  
      const lines = [];
  
      availableTimes.forEach(time => {
        if (time.allDay) {
          const days = time.daysOfWeek.map(day => convertDayCode(day)).join(', ');
          lines.push(`Available ${days}`);
        } else {
          time.daysOfWeek.forEach(day => {
            const dayName = convertDayCode(day);
            const startTime = formatTime(time.availableStartTime);
            const endTime = formatTime(time.availableEndTime);
            lines.push(`Available ${dayName} from ${startTime} until ${endTime}`);
          });
        }
      });
  
      return lines;
    }
  </script>
  
  <style>
    table {
      width: 100%;
      border-collapse: collapse;
    }
  
    th, td {
      padding: 10px;
      text-align: left;
      border-bottom: 1px solid #ddd;
      vertical-align: top; /* Ensure cells align to top for multiline content */
    }
  
    th {
      cursor: pointer;
      background-color: #f2f2f2;
    }
  
    th:hover {
      background-color: #ddd;
    }
  
    .delete-btn {
      color: red;
      cursor: pointer;
    }
  
    .message {
      margin-top: 20px;
      color: red;
    }
  
    .available-times {
      margin-top: 5px;
      font-size: 0.9em;
      color: #555;
    }
  </style>
  
  <!-- Table UI -->
  {#if practitioners.length > 0}
    <table>
      <thead>
        <tr>
          <th></th>
          <th on:click={() => sortTable('name')}>Practitioner Name</th>
          <th on:click={() => sortTable('birthDate')}>Date of Birth</th>
          <th on:click={() => sortTable('kids')}>Kids</th>
          <th on:click={() => sortTable('teens')}>Teens</th>
          <th on:click={() => sortTable('adults')}>Adults</th>
          <th on:click={() => sortTable('couples')}>Couples</th>
          <th on:click={() => sortTable('families')}>Families</th>
        </tr>
      </thead>
      <tbody>
        {#each practitioners as practitioner}
          <tr>
            <td>
              <span class="delete-btn" on:click={() => handleDelete(practitioner.id)}>🗑️</span>
            </td>
            <td>
              {practitioner.name}
              {#if practitioner.availableTimes.length > 0}
                <div class="available-times">
                  {#each getFormattedAvailableTimes(practitioner.availableTimes) as line}
                    <div>{line}</div>
                  {/each}
                </div>
              {/if}
            </td>
            <td>{practitioner.birthDate}</td>
            <td>{practitioner.kids}</td>
            <td>{practitioner.teens}</td>
            <td>{practitioner.adults}</td>
            <td>{practitioner.couples}</td>
            <td>{practitioner.families}</td>
          </tr>
        {/each}
      </tbody>
    </table>
  {:else}
    <p class="message">{message || 'No practitioners found.'}</p>
  {/if}
  