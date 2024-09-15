import { writable } from 'svelte/store';

const currentPractitionerTemplate = {
  id: null,
  practitioner: {
    id: null,
    name: null
  },
  organizationId: null,
  organizationName: null,
  availability:null,
  PractitionerRoleId:null 
};

export const currentPractitioner = writable(currentPractitionerTemplate);