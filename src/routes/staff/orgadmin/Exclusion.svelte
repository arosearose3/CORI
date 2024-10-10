// src/lib/stores.js
import { writable } from 'svelte/store';

export const exc_uploadStatus = writable('');
export const exc_checkResults = writable([]);

// src/routes/+page.svelte
<script>
import axios from 'axios';
import { uploadStatus, checkResults } from '$lib/stores';
import FileUpload from './FileUpload.svelte';
import ExclusionCheck from './Exclusion.svelte';
import ResultsTable from './ResultsTable.svelte';
import EmailNotification from './EmailNotification.svelte';

const API_URL = 'http://localhost:3000/api';
</script>

<main>
  <h1>Exclusion Checker</h1>
  <FileUpload {API_URL} />
  <ExclusionCheck {API_URL} />
  <ResultsTable />
  <EmailNotification {API_URL} />
</main>

<style>
  main {
    max-width: 800px;
    margin: 0 auto;
    padding: 20px;
  }
</style>
