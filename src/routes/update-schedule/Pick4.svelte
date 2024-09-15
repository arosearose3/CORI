<script>
    import { createEventDispatcher, onMount } from 'svelte';
  
    export let capacity = null; // Receive Capacity object as a prop
  
    const dispatch = createEventDispatcher();
  
    let categories = [
      { label: 'Adults', value: 0, singular: 'adult', url: 'adults' },
      { label: 'Relationships', value: 0, singular: 'relationship', url: 'couples' },
      { label: 'Teens', value: 0, singular: 'teen', url: 'teens' },
      { label: 'Children', value: 0, singular: 'child', url: 'children' },
      { label: 'Families', value: 0, singular: 'family', url: 'families' }
    ];
  
    let capacityExtension = [
      {
        "url": "https://combinebh.org/resources/FHIRResources/PractitionerCapacityFHIRExtension.html",
        "extension": []
      }
    ];
  
    onMount(() => {
      if (capacity) {
        capacityExtension = capacity;
        updateCategoriesFromCapacity();
      }
    });
  
    function updateCategoriesFromCapacity() {
      capacityExtension[0].extension.forEach(ext => {
        const category = categories.find(cat => cat.url === ext.url);
        if (category) {
          category.value = ext.valueInteger;
        }
      });
      categories = categories; // Trigger reactivity
    }
  
    function updateCapacityExtension() {
      capacityExtension[0].extension = categories.map(cat => ({
        "url": cat.url,
        "valueInteger": cat.value
      }));
      dispatch('capacitychange', { capacityExtension });
      console.log("array: ", capacityExtension[0].extension);
    }
  
    function handleChange(index, event) {
      const newValue = parseInt(event.target.value);
      categories[index].value = newValue;
      categories = categories;
      updateCapacityExtension();
    }
  
    $: summarySentence = `I have capacity for ${categories.map((cat, index, array) => {
      let phrase;
      if (cat.value === 0) phrase = `no ${cat.label.toLowerCase()}`;
      else if (cat.value === 1) phrase = `1 ${cat.singular}`;
      else if (cat.value === 5) phrase = `5+ ${cat.label.toLowerCase()}`;
      else phrase = `${cat.value} ${cat.label.toLowerCase()}`;
  
      if (index === array.length - 1 && array.length > 1) {
        return `and ${phrase}`;
      }
      return phrase;
    }).join(', ')}.`;
  </script>
  
  <div class="flex flex-col space-y-6 w-full max-w-3xl mx-auto">
    <p class="text-lg font-medium text-center">{summarySentence}</p>
  
    {#each categories as category, i}
      <div class="flex flex-col mb-8">
        <label class="mb-2 text-sm font-medium">{category.label}</label>
        <div class="relative w-full pt-4 pb-4"> <!-- Added padding to make room for labels -->
          <div class="w-[90%] ml-[10%] relative">
            <span class="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-full pr-2.5 text-xs">0</span>
            
            <input
              type="range"
              min="0"
              max="5"
              step="1"
              bind:value={category.value}
              on:change={(e) => handleChange(i, e)}
              class="w-full h-2 bg-blue-200 rounded-lg appearance-none cursor-pointer"
            />
            <span class="absolute right-0 top-1/2 -translate-y-1/2 translate-x-full pl-2.5 text-xs">5+</span>
          </div>
          <br>
        </div>
      </div>
    {/each}
  </div>
  
  <style>
    input[type="range"] {
      -webkit-appearance: none;
      background: transparent;
    }
  
    input[type="range"]::-webkit-slider-thumb {
      -webkit-appearance: none;
      appearance: none;
      width: 16px;
      height: 16px;
      background: white;
      border: 2px solid #3b82f6;
      border-radius: 50%;
      cursor: pointer;
      margin-top: -7px;
    }
  
    input[type="range"]::-moz-range-thumb {
      width: 16px;
      height: 16px;
      background: white;
      border: 2px solid #3b82f6;
      border-radius: 50%;
      cursor: pointer;
    }
  
    input[type="range"]::-webkit-slider-runnable-track {
      width: 100%;
      height: 2px;
      background: #93c5fd;
      border-radius: 1px;
    }
  
    input[type="range"]::-moz-range-track {
      width: 100%;
      height: 2px;
      background: #93c5fd;
      border-radius: 1px;
    }
  </style>