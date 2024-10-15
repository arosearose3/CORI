<script>
    import { onMount } from 'svelte';
    import { base } from '$app/paths';
    
    export let organizationId = null;

    let OIGUpdateDate = "not loaded"; // Placeholder date
    let SAMUpdateDate = "not loaded"; // Placeholder date
    let COUpdateDate = "not loaded";  // Placeholder date
    let staffRoster = []; // Array to store the results of eligibility checking
    let checking = false; // To handle loading state during the eligibility check
    let sortColumn = 'firstName'; // Default sorting column
    let sortDirection = 'asc'; // Default sorting direction
    let orgEmail ="";


    // Function to fetch org email
    async function fetchOrgEmail(orgId) {
    try {
        const response = await fetch(`${base}/api/organization/getOrgEmail?reference=${orgId}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
            credentials: 'include',
        });

        if (!response.ok) {
            throw new Error('Failed to fetch org email');
        }

        const emailData = await response.json();  // Parse the response as JSON
        return emailData.email || null;  // Assuming the response has an 'email' field
    } catch (error) {
        console.error('Error fetching org email:', error);
        return null;
    }
}


    // Function to fetch metadata (file upload dates)
    async function fetchMetadata() {
        try {
            const response = await fetch(`${base}/api/exclusion/upload-dates`);
            if (!response.ok) throw new Error('Failed to fetch metadata');
            const data = await response.json();
            OIGUpdateDate = new Date(data.OIG).toLocaleString();
            SAMUpdateDate = new Date(data.SAMHSA).toLocaleString();
            COUpdateDate = new Date(data.Colorado).toLocaleString();
        } catch (error) {
            console.error('Error fetching metadata:', error);
        }
    }

    // Fetch metadata on component mount
    onMount(async() => {
        fetchMetadata();
        const emailResult = await fetchOrgEmail(organizationId);
        orgEmail = emailResult || "No email available"; // Fallback in case there's no email found
});

        // Refresh function to reload metadata
    function refreshMetadata() {
        fetchMetadata();
    }

    // Function to fetch practitioners for the organization from the FHIR Bundle
    async function fetchPractitioners() {
        if (!organizationId) return;
        try {
            const response = await fetch(`${base}/api/practitioner/getStaffForOrg?organizationId=${organizationId}`);
            if (!response.ok) throw new Error('Failed to fetch practitioners');
            const bundle = await response.json();

            if (bundle.resourceType === 'Bundle' && Array.isArray(bundle.entry)) {
                // Map FHIR bundle to array of practitioner objects
                staffRoster = bundle.entry.map(entry => {
                    const practitioner = entry.resource;
                    const nameObj = practitioner.name?.[0];
                    const firstName = nameObj?.given?.join(' ') || 'Unknown';
                    const lastName = nameObj?.family || 'Unknown';
                    const npi = practitioner.identifier?.find(id => id.system === 'http://hl7.org/fhir/sid/us-npi')?.value || 'Unknown';
                    const dob = practitioner.birthDate || 'Unknown';

                    return {
                        firstName,
                        lastName,
                        npi,
                        dob,
                        samMatch: null, // These will be updated after checking
                        oigMatch: null,
                        coMatch: null
                    };
                });
            }
        } catch (error) {
            console.error('Error fetching practitioners:', error);
            staffRoster = []; // Clear staffRoster on error
        }
    }

    // Function to handle sorting by column
    function sortTable(column) {
        if (sortColumn === column) {
            sortDirection = sortDirection === 'asc' ? 'desc' : 'asc';
        } else {
            sortColumn = column;
            sortDirection = 'asc';
        }

        staffRoster = staffRoster.sort((a, b) => {
            let aValue = a[column];
            let bValue = b[column];

            if (typeof aValue === 'string') {
                aValue = aValue.toLowerCase();
                bValue = bValue.toLowerCase();
            }

            if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
            if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
            return 0;
        });
    }

    // Function to send practitioner data to the exclusion check API
    async function checkStaffRoster() {
        checking = true;

        // Fetch practitioners first
        await fetchPractitioners();
        
        // Build request data to send to the /check endpoint
        const staffData = staffRoster.map(practitioner => [
            practitioner.firstName,
            practitioner.lastName,
            practitioner.dob,
            practitioner.npi
        ]);

        // Call the /check API with the practitioner data
        try {
            const response = await fetch(`${base}/api/exclusion/check`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ staffData })
            });
            if (!response.ok) throw new Error('Failed to check staff eligibility');

            const checkResults = await response.json();
            // Map the results back to the staff roster and update the match columns
            staffRoster = staffRoster.map((staff, index) => ({
                ...staff,
                samMatch: checkResults[index].samMatch,
                oigMatch: checkResults[index].oigMatch,
                coMatch: checkResults[index].coMatch,
            }));
        } catch (error) {
            console.error('Error checking staff eligibility:', error);
            staffRoster = [];
        } finally {
            checking = false;
        }
    }

    // Function to display the result as an icon
    function displayResult(result) {
        return result ? '❌' : '✅'; // Red X for true (failed), Green check for false (passed)
    }

    // Function to email the admin
    async function emailAdmin() {
        const subject = 'Eligibility Check Results';
        const body = 'The eligibility check has been completed. Please review the results.';
        
        try {
            const response = await fetch(`${base}/api/email/email`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    to: 'admin@example.com',
                    subject,
                    html: body
                })
            });
            if (!response.ok) throw new Error('Failed to send email');
            alert('Email sent successfully');
        } catch (error) {
            console.error('Error sending email:', error);
        }
    }
</script>

<div class="eligibility-check-container">
    <button on:click={refreshMetadata}>Refresh File Upload Dates</button>

    <p><strong>US Office of Inspector General file updated on:</strong> {OIGUpdateDate}</p>
    <p><strong>SAMHSA file updated on:</strong> {SAMUpdateDate}</p>
    <p><strong>Colorado file updated on:</strong> {COUpdateDate}</p>

    <button on:click={checkStaffRoster} disabled={checking}>
        {checking ? "Checking..." : "Check Staff Roster"}
    </button>

    {#if staffRoster.length > 0}
        <table class="staff-table">
            <thead>
                <tr>
                    <th on:click={() => sortTable('firstName')}>First Name {sortColumn === 'firstName' ? (sortDirection === 'asc' ? '▲' : '▼') : ''}</th>
                    <th on:click={() => sortTable('lastName')}>Last Name {sortColumn === 'lastName' ? (sortDirection === 'asc' ? '▲' : '▼') : ''}</th>
                    <th on:click={() => sortTable('dob')}>DOB {sortColumn === 'dob' ? (sortDirection === 'asc' ? '▲' : '▼') : ''}</th>
                    <th on:click={() => sortTable('npi')}>NPI {sortColumn === 'npi' ? (sortDirection === 'asc' ? '▲' : '▼') : ''}</th>
                    <th on:click={() => sortTable('samMatch')}>SAMHSA {sortColumn === 'samMatch' ? (sortDirection === 'asc' ? '▲' : '▼') : ''}</th>
                    <th on:click={() => sortTable('oigMatch')}>OIG {sortColumn === 'oigMatch' ? (sortDirection === 'asc' ? '▲' : '▼') : ''}</th>
                    <th on:click={() => sortTable('coMatch')}>Colorado {sortColumn === 'coMatch' ? (sortDirection === 'asc' ? '▲' : '▼') : ''}</th>
                </tr>
                
            </thead>
            <tbody>
                {#each staffRoster as staff}
                    <tr>
                        <td>{staff.firstName}</td>
                        <td>{staff.lastName}</td>
                        <td>{staff.dob}</td>
                        <td>{staff.npi}</td>
                        <td>{displayResult(staff.samMatch)}</td>
                        <td>{displayResult(staff.oigMatch)}</td>
                        <td>{displayResult(staff.coMatch)}</td>
                    </tr>
                {/each}
            </tbody>
        </table>
        <button on:click={emailAdmin}>Email {orgEmail}</button>
    {/if}
</div>


<style>
    .eligibility-check-container {
        padding: 20px;
        border: 1px solid #ccc;
        border-radius: 8px;
        max-width: 600px;
        margin: 0 auto;
    }

    .staff-table {
        margin-top: 20px;
        width: 100%;
        border-collapse: collapse;
    }

    .staff-table th,
    .staff-table td {
        border: 1px solid #ccc;
        padding: 10px;
        text-align: center;
        cursor: pointer;
    }

    .staff-table th:hover {
        background-color: #f2f2f2;
    }

    button {
        margin-top: 15px;
        padding: 10px 15px;
        background-color: #007bff;
        color: white;
        border: none;
        border-radius: 5px;
        cursor: pointer;
    }

    button:disabled {
        background-color: #888;
        cursor: not-allowed;
    }

    button:hover:enabled {
        background-color: #0056b3;
    }
</style>
