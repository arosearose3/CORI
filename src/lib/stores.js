import { writable } from 'svelte/store';
import { AbilityBuilder, PureAbility } from '@casl/ability';
import { navItems } from '$lib/navConfig.js';

// Initialize PureAbility with an empty rule set
const initialAbilities = new PureAbility([]);

// Initial state for user and practitioner
const initialUserState = {
  user: {
    id: null,
    email: null,
    name: null,
    picture: null,
  },
  practitioner: {
    id: null,
    name: null,
    organizationId: null,
    organizationName: null,
    availability: null,
    PractitionerRoleId: null,
    sms: null,
    dob: null,
    npi: null,
    roles: [],
    practitionerRoles: [],
    localOrgArray: [],
  },
};

// Function to create a writable store with persistent storage
const createPersistentStore = (key, startValue) => {
  const store = writable(startValue);

  if (typeof window !== 'undefined') {
    const storedValue = localStorage.getItem(key);
    if (storedValue) {
      store.set(JSON.parse(storedValue));
    }

    store.subscribe(value => {
      localStorage.setItem(key, JSON.stringify(value));
    });
  }

  return {
    ...store,
    reset: () => {
      store.set(startValue);
      if (typeof window !== 'undefined') {
        localStorage.removeItem(key);
      }
    }
  };
};

// Main store combining user data and practitioner data
export const user = createPersistentStore('userStore', initialUserState);

// Writable store to manage CASL abilities
export const abilities = writable(new PureAbility([]));

export function updateAbilities(userRoles) {
  if (!userRoles || !Array.isArray(userRoles) || userRoles.length === 0) {
    console.warn('No valid user roles provided for updating abilities');
    return;
  }
  try {
    const { can, build } = new AbilityBuilder(PureAbility);

    navItems.forEach(item => {
      item.roles.forEach(role => {
        if (userRoles.includes(role)) {
          can('view', item.subject);
          console.log(`Role '${role}' can view '${item.subject}'`);
        }

        if (item.subItems) {
          item.subItems.forEach(subItem => {
            if (userRoles.includes(role)) {
              can('view', subItem.subject);
              console.log(`Role '${role}' can view '${subItem.subject}'`);
            }
          });
        }
      });
    });

    const builtAbility = build();
    abilities.set(builtAbility);
    console.log("=== Abilities Updated ===");
  } catch (error) {
    console.error('Error updating abilities:', error);
  }
}

export function setUser(userData) {
  if (!userData || typeof userData !== 'object') {
    console.error('Invalid user data:', userData);
    return;
  }

  user.update(store => ({
    ...store,
    user: {
      id: userData.id || null,
      email: userData.email || null,
      name: userData.name || null,
      picture: userData.picture || null,
    },
  }));

  updateAbilities(userData.roles || []);
}

export function setPractitioner(practitionerData) {
  if (!practitionerData || typeof practitionerData !== 'object') {
    console.error('Invalid practitioner data:', practitionerData);
    return;
  }

  user.update(store => ({
    ...store,
    practitioner: {
      ...store.practitioner,
      ...practitionerData,
      roles: Array.isArray(practitionerData.roles) ? practitionerData.roles : [],
    },
  }));

  updateAbilities(practitionerData.roles || []);
}

export function clearUserStore() {
  user.reset();
  abilities.set(new PureAbility([]));
}

export function clearFhirStore() {
  user.update(store => ({
    ...store,
    practitioner: initialUserState.practitioner,
  }));
}

export const actions = {
  setUser,
  setPractitioner,
  clearUserStore,
  clearFhirStore,
  updateAbilities,
};

// Helper function to check if practitioner data has been fetched
export function hasFetchedPractitionerData() {
  let fetchedData = false;
  user.subscribe(store => {
    fetchedData = store.practitioner.id !== null;
  })();
  return fetchedData;
}