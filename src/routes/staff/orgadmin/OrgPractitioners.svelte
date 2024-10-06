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

  
  
  /**
   * Parses a time string "HH:MM:SS" into minutes since 7 AM.
   * @param {string} timeStr - The time string to parse.
   * @returns {number} - Minutes since 7 AM.
   */
   function parseTimeToMinutes(timeStr) {
    const [hour, minute, second] = timeStr.split(':').map(Number);
    const totalMinutes = (hour * 60 + minute) - 420; // 7 AM is 420 minutes from midnight
    // Ensure the minutes are within 0 to 780 (7 AM to 8 PM)
    return Math.max(0, Math.min(780, totalMinutes));
  }

  function parseTime(timeStr) {
    const [hour, minute, second] = timeStr.split(':').map(Number);
    return { hour, minute };
  }

  /**
   * Computes the bar segments for the availability bar.
   * @param {Array} availableTimes - The practitioner's available times.
   * @returns {Array|null} - An array of segments or null if no availability.
   */
   function getBarSegments(availableTimes) {
    if (!availableTimes || availableTimes.length === 0) return null;

    let segmentsByDay = [];

    availableTimes.forEach(time => {
      const days = time.daysOfWeek || [];
      days.forEach(day => {
        const dayName = convertDayCode(day);
        let segments = [];

        if (time.allDay) {
          // All day availability from 7 AM to 8 PM
          segments.push({ start: 0, end: 780 });
        } else {
          const startMinutes = time.availableStartTime ? parseTimeToMinutes(time.availableStartTime) : null;
          const endMinutes = time.availableEndTime ? parseTimeToMinutes(time.availableEndTime) : null;
          if (startMinutes !== null && endMinutes !== null) {
            segments.push({ start: startMinutes, end: endMinutes });
          }
        }

        // Find existing entry for the day or create a new one
        let dayEntry = segmentsByDay.find(d => d.day === dayName);
        if (!dayEntry) {
          dayEntry = { day: dayName, segments: [] };
          segmentsByDay.push(dayEntry);
        }
        dayEntry.segments = dayEntry.segments.concat(segments);
      });
    });

    // Sort days for consistent display order
    const dayOrder = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    segmentsByDay.sort((a, b) => dayOrder.indexOf(a.day) - dayOrder.indexOf(b.day));

    return segmentsByDay;
  }
 function formatTimeRange(startTime, endTime) {
    const startPeriod = startTime.hour >= 12 ? 'pm' : 'am';
    const endPeriod = endTime.hour >= 12 ? 'pm' : 'am';

    let startHour = startTime.hour % 12 || 12;
    let endHour = endTime.hour % 12 || 12;

    let startMinute = startTime.minute ? `:${startTime.minute.toString().padStart(2, '0')}` : '';
    let endMinute = endTime.minute ? `:${endTime.minute.toString().padStart(2, '0')}` : '';

    // If minutes are 0, don't display them
    if (startMinute === ':00') startMinute = '';
    if (endMinute === ':00') endMinute = '';

    if (startPeriod !== endPeriod) {
    // Start time and end time are in different periods
    return `${startHour}${startMinute}${startPeriod}-${endHour}${endMinute}${endPeriod}`;
  } else {
    // Same period, only add period at the end
    return `${startHour}${startMinute}-${endHour}${endMinute}${startPeriod}`;
  }
  }

  /**
   * Converts three-letter day codes to short day names.
   * @param {string} dayCode - The three-letter day code (e.g., 'mon').
   * @returns {string} - The short name of the day (e.g., 'M' or 'T').
   */
  function convertDayCode(dayCode) {
    const dayMap = {
      mon: 'M',
      tue: 'T',
      wed: 'W',
      thu: 'Th',
      fri: 'F',
      sat: 'Sat',
      sun: 'Sun',
    };
    return dayMap[dayCode.toLowerCase()] || dayCode;
  }

  /**
   * Computes the availability information grouped by day.
   * @param {Array} availableTimes - The practitioner's available times.
   * @returns {Array|null} - An array of objects containing day, time ranges, and segments.
   */
  function getAvailabilityByDay(availableTimes) {
    if (!availableTimes || availableTimes.length === 0) return null;

    let availabilityByDay = [];

    availableTimes.forEach(time => {
      const days = time.daysOfWeek || [];
      days.forEach(day => {
        const dayLabel = convertDayCode(day);

        // Find existing entry for the day or create a new one
        let dayEntry = availabilityByDay.find(d => d.day === dayLabel);
        if (!dayEntry) {
          dayEntry = { day: dayLabel, timeRanges: [], segments: [] };
          availabilityByDay.push(dayEntry);
        }

        if (time.allDay) {
          dayEntry.timeRanges.push('all day');
          dayEntry.segments.push({ start: 0, end: 780 });
        } else {
          const startTimeObj = parseTime(time.availableStartTime);
          const endTimeObj = parseTime(time.availableEndTime);
          const timeRangeStr = formatTimeRange(startTimeObj, endTimeObj);

          dayEntry.timeRanges.push(timeRangeStr);

          const startMinutes = parseTimeToMinutes(time.availableStartTime);
          const endMinutes = parseTimeToMinutes(time.availableEndTime);
          dayEntry.segments.push({ start: startMinutes, end: endMinutes });
        }
      });
    });

    // Sort days for consistent display order
    const dayOrder = ['M', 'T', 'W', 'Th', 'F', 'Sat', 'Sun'];
    availabilityByDay.sort((a, b) => dayOrder.indexOf(a.day) - dayOrder.indexOf(b.day));

    return availabilityByDay;
  }



  // Existing functions continue...

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


    .availability-row {
    font-size: 80%;
    padding: 2px 0; /* Reduce vertical padding */
  }

  .day-label {
    font-weight: normal;
  }

  .availability-bar {
    position: relative;
    height: 5px; /* Reduced height */
    background-color: lightblue;
    width: 100%;
    border: 1px solid #ccc;
    margin-top: 2px;
  }

  .availability-segment {
    position: absolute;
    height: 100%;
    background-color: darkblue;
  }
  </style>
  
  <!-- Table UI -->
{#if practitioners.length > 0}
<table>
  <thead>
    <tr>
    
      <th on:click={() => sortTable('name')}>Practitioner Name</th>
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
<!--         <td>
          <span class="delete-btn" on:click={() => handleDelete(practitioner.id)}>🗑️</span>
        </td> -->
        <td>{practitioner.name}</td>
        <td>{practitioner.kids}</td>
        <td>{practitioner.teens}</td>
        <td>{practitioner.adults}</td>
        <td>{practitioner.couples}</td>
        <td>{practitioner.families}</td>
      </tr>
      {#if getAvailabilityByDay(practitioner.availableTimes)}
        {#each getAvailabilityByDay(practitioner.availableTimes) as dayInfo}
          <tr>
           
            <!-- Day label aligned under Practitioner Name column -->
            <td class="availability-row day-label">
              {dayInfo.day} {dayInfo.timeRanges.join(', ')}
            </td>
            <!-- Availability bar aligned under Kids to Families columns -->
            <td colspan="5" class="availability-row">
              <div class="availability-bar">
                {#each dayInfo.segments as segment}
                  <div
                    class="availability-segment"
                    style="
                      left: {segment.start / 780 * 100}%;
                      width: {(segment.end - segment.start) / 780 * 100}%;
                    "
                  ></div>
                {/each}
              </div>
            </td>
          </tr>
        {/each}
      {/if}
    {/each}
  </tbody>
</table>
{:else}
<p class="message">{message || 'No practitioners found.'}</p>
{/if}

