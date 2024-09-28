<!-- PractitionerInfo.svelte -->
<script>
  export let practitionerId;
  export let practitionerName;
</script>

<div class="practitioner-info">
  <p><strong>Practitioner ID:</strong> {practitionerId}</p>
  <p><strong>Practitioner Name:</strong> {practitionerName}</p>
</div>

<style>
  .practitioner-info {
    margin-bottom: 15px;
    font-size: 16px;
    color: #333;
  }
</style>
