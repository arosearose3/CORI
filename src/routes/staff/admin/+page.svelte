<script>
    import IngestCoriRoster from "./IngestCoriRoster.svelte";
    import AllPractitioners from "./AllPractitioners.svelte";
    import AddPractitioner from "./AddPractitioner.svelte";
    import IngestPractitioners from "./IngestPractitioners.svelte";
    import AllPractitionersBig from "./AllPractitionersBig.svelte";
  //  import UploadCombine from "./UploadCombine.svelte";

</script>

<h4>admin can see all Practitioners</h4>


<div class="practitioner-container">
<UploadCombine />

<IngestCoriRoster />
<hr>
<AllPractitioners />
<hr>
<AllPractitionersBig />
<hr>
<IngestPractitioners />
<hr>
<AddPractitioner />

</div>

 
<style>
    .practitioner-container {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 20px;
    }
  </style>

